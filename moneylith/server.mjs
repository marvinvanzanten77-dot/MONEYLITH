// Kleine API-server voor Moneylith om via HTTP met OpenAI te praten.
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import pdfParse from "pdf-parse";
import { parse as parseCsvSync } from "csv-parse/sync";
import cors from "cors";
import db from "./db/db.js";
import client from "./openaiClient.mjs";
import { classificeerTransactiesMetGPT, parsePdfTransactiesViaGPT } from "./gptCategorisatie.mjs";
import { detecteerVasteLasten } from "./recurringDetectie.mjs";

const insertStmt = db.prepare(
  "INSERT INTO transacties (rekening, datum, bedrag, omschrijving, categorie, bron, ingevoerd_op) VALUES (?, ?, ?, ?, ?, ?, ?)"
);

const budgetInsert = db.prepare("INSERT INTO budgetten (categorie, bedrag_per_maand) VALUES (?, ?)");
const budgetUpdate = db.prepare("UPDATE budgetten SET bedrag_per_maand = ? WHERE LOWER(categorie) = LOWER(?)");
const budgetSelectByCategory = db.prepare("SELECT * FROM budgetten WHERE LOWER(categorie) = LOWER(?)");
const budgetSelectAll = db.prepare("SELECT * FROM budgetten");
const selectUncategorized = db.prepare(
  "SELECT id, rekening, datum, bedrag, omschrijving FROM transacties WHERE (categorie IS NULL OR TRIM(categorie) = '') LIMIT 100"
);
const selectAllTransacties = db.prepare("SELECT id, rekening, datum, bedrag, omschrijving FROM transacties");
const updateCategoryStmt = db.prepare("UPDATE transacties SET categorie = ? WHERE id = ?");
const selectGroepById = db.prepare("SELECT * FROM vaste_lasten_groepen WHERE id = ?");
const selectTransactiesByRekening = db.prepare(
  "SELECT id, datum, bedrag, rekening, omschrijving, vaste_last FROM transacties WHERE LOWER(rekening) = LOWER(?)"
);
const selectRegels = db.prepare("SELECT * FROM regels ORDER BY id DESC");
const selectRegelById = db.prepare("SELECT * FROM regels WHERE id = ?");
const insertRegel = db.prepare(
  `INSERT INTO regels (naam, actief, rekening, omschrijving_pattern, min_bedrag, max_bedrag, categorie_actie, markeer_vaste_last, aangemaakt_op)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const updateRegel = db.prepare(
  `UPDATE regels SET naam = ?, actief = ?, rekening = ?, omschrijving_pattern = ?, min_bedrag = ?, max_bedrag = ?, categorie_actie = ?, markeer_vaste_last = ? WHERE id = ?`
);
const deleteRegel = db.prepare("DELETE FROM regels WHERE id = ?");
const selectPatronenMaand = db.prepare(
  "SELECT * FROM uitgavepatronen WHERE jaar = ? AND maand = ? ORDER BY totaal DESC"
);
const insertPatroon = db.prepare(
  `INSERT INTO uitgavepatronen (
    jaar,
    maand,
    categorie,
    totaal,
    patroon_type,
    redenering
  ) VALUES (?, ?, ?, ?, ?, ?)`
);
const deletePatronenMaand = db.prepare("DELETE FROM uitgavepatronen WHERE jaar = ? AND maand = ?");
const selectFixedIndex = db.prepare("SELECT * FROM vaste_lasten_index ORDER BY ingevoerd_op DESC");
const selectFixedById = db.prepare("SELECT * FROM vaste_lasten_index WHERE id = ?");
const insertFixedIndexStmt = db.prepare(
  `INSERT INTO vaste_lasten_index (naam, bedrag, rekening, frequentie, omschrijving)
    VALUES (?, ?, ?, ?, ?)`
);
const updateFixedIndexStmt = db.prepare(
  `UPDATE vaste_lasten_index SET naam = ?, bedrag = ?, rekening = ?, frequentie = ?, omschrijving = ?, actief = ?
    WHERE id = ?`
);
const deleteFixedIndexStmt = db.prepare("DELETE FROM vaste_lasten_index WHERE id = ?");
const selectSchulden = db.prepare("SELECT * FROM schulden ORDER BY imported_on DESC");
const insertSchuldStmt = db.prepare(
  `INSERT INTO schulden (naam, bedrag, rente, maandbedrag, looptijd, status)
    VALUES (?, ?, ?, ?, ?, ?)`
);
function getInstelling(key, defaultValue = null) {
  const row = db.prepare("SELECT value FROM instellingen WHERE key = ?").get(key);
  return row ? row.value : defaultValue;
}

function setInstelling(key, value) {
  db.prepare(`
    INSERT INTO instellingen (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}
function buildGroepUpdateStatement(fields) {
  return db.prepare(`UPDATE vaste_lasten_groepen SET ${fields.map((field) => `${field} = ?`).join(", ")} WHERE id = ?`);
}
function insertTransacties(rows, bron) {
  const now = new Date().toISOString();
  let count = 0;
  const ids = [];
  rows.forEach((row) => {
    if (
      typeof row.rekening !== "string" ||
      typeof row.datum !== "string" ||
      typeof row.bedrag !== "number" ||
      Number.isNaN(row.bedrag)
    ) {
      return;
    }
    const info = insertStmt.run(
      row.rekening,
      row.datum,
      row.bedrag,
      row.omschrijving ?? "",
      row.categorie ?? "Overig",
      bron,
      now
    );
    ids.push(info.lastInsertRowid);
    count += 1;
  });
  return { count, ids };
}

function applyRegelsOpNieuweTransacties(nieuweIds) {
  if (!Array.isArray(nieuweIds) || nieuweIds.length === 0) {
    return;
  }

  const autoRegels = getInstelling("regels_automatisch_toepassen", "1");
  if (autoRegels !== "1") {
    return;
  }

  const regelsStmt = db.prepare(`
    SELECT
      id,
      actief,
      rekening,
      omschrijving_pattern,
      min_bedrag,
      max_bedrag,
      categorie_actie,
      markeer_vaste_last
    FROM regels
    WHERE actief = 1
  `);
  const regels = regelsStmt.all();
  if (!regels.length) {
    return;
  }

  const selectTransactieStmt = db.prepare(
    "SELECT id, rekening, omschrijving, bedrag, categorie, vaste_last FROM transacties WHERE id = ?"
  );
  const updateTransactieStmt = db.prepare(
    "UPDATE transacties SET categorie = ?, vaste_last = ? WHERE id = ?"
  );
  const updateLaatstGetriggerdStmt = db.prepare(
    "UPDATE regels SET laatst_getriggerd_op = datetime('now') WHERE id = ?"
  );

  const matchTransactieMetRegel = (t, regel) => {
    if (regel.rekening && t.rekening !== regel.rekening) {
      return false;
    }
    if (regel.omschrijving_pattern) {
      const omschrijving = (t.omschrijving ?? "").toLowerCase();
      if (!omschrijving.includes(regel.omschrijving_pattern.toLowerCase())) {
        return false;
      }
    }
    if (typeof regel.min_bedrag === "number" && t.bedrag < regel.min_bedrag) {
      return false;
    }
    if (typeof regel.max_bedrag === "number" && t.bedrag > regel.max_bedrag) {
      return false;
    }
    return true;
  };

  const transaction = db.transaction((ids) => {
    for (const id of ids) {
      const transactie = selectTransactieStmt.get(id);
      if (!transactie) {
        continue;
      }
      for (const regel of regels) {
        if (!matchTransactieMetRegel(transactie, regel)) {
          continue;
        }

        let nieuweCategorie = transactie.categorie;
        if (regel.categorie_actie) {
          nieuweCategorie = regel.categorie_actie;
        }

        let nieuweVasteLast = transactie.vaste_last;
        if (regel.markeer_vaste_last === 1) {
          nieuweVasteLast = 1;
        } else if (regel.markeer_vaste_last === 0) {
          nieuweVasteLast = 0;
        }

        updateTransactieStmt.run(nieuweCategorie, nieuweVasteLast, transactie.id);
        updateLaatstGetriggerdStmt.run(regel.id);
      }
    }
  });

  transaction(nieuweIds);
}

function parseCsvBufferNaarRecords(buffer) {
  const raw = buffer.toString("utf8");
  try {
    const records = parseCsvSync(raw, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      delimiter: /[;,]/,
      relax_column_count: true,
      relax_quotes: true,
      trim: true,
    });
    return records;
  } catch (err) {
    console.error("Fout bij CSV parsen:", err);
    throw new Error("CSV parse error: " + (err?.message || "onbekende fout"));
  }
}

async function genereerPatroonBeschrijving(categorie, totaal, jaar, maand) {
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "Je helpt Moneylith-gebruikers inzicht te krijgen in hun maandelijkse uitgavenpatronen.",
        },
        {
          role: "user",
          content: `Voor ${jaar}-${String(maand).padStart(2,"0")} zijn er €${totaal.toFixed(
            2
          )} uitgegeven in categorie ${categorie}. Geef een korte Nederlandse beschrijving in één zin.`,
        },
      ],
    });
    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.error("GPT-patroonbeschrijving faalde:", err);
    return `Categorie ${categorie}: €${totaal.toFixed(2)} uitgegeven in ${jaar}-${String(month).padStart(2,"0")}.`;
  }
}

async function captureUitgavePatronen(jaar, maand) {
  const prefix = `${jaar}-${String(maand).padStart(2, "0")}-`;
  const rows = db
    .prepare(
      "SELECT categorie, bedrag FROM transacties WHERE datum LIKE ?"
    )
    .all(`${prefix}%`);

  if (!rows.length) {
    return [];
  }

  const totals = {};
  rows.forEach((row) => {
    const cat = row.categorie || "Onbekend";
    totals[cat] = (totals[cat] || 0) + row.bedrag;
  });

  const patterns = await Promise.all(
    Object.entries(totals).map(async ([categorie, totaal]) => {
      const redenering = await genereerPatroonBeschrijving(categorie, totaal, jaar, maand);
      return { categorie, totaal, redenering };
    })
  );

  db.transaction(() => {
    deletePatronenMaand.run(jaar, maand);
    patterns.forEach((patroon) => {
      insertPatroon.run(
        jaar,
        maand,
        patroon.categorie,
        patroon.totaal,
        "categorie-som",
        patroon.redenering
      );
    });
  })();

  return Object.keys(totals).map((categorie) => ({
    categorie,
    totaal: totals[categorie],
  }));
}

function parseDebtCsvBuffer(buffer) {
  const records = [];
  const raw = buffer.toString("utf8");
  const rows = parseCsvSync(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    delimiter: /[;,]/,
    relax_column_count: true,
    trim: true,
  });
  rows.forEach((row) => {
    const naam = row.Naam || row.Name || "Onbekend";
    let bedragRaw = row.Bedrag || row.Amount || "0";
    bedragRaw = typeof bedragRaw === "string" ? bedragRaw.replace(/\./g, "").replace(",", ".") : bedragRaw;
    records.push({
      naam,
      bedrag: parseFloat(bedragRaw) || 0,
      rente: parseFloat(row.Rente || row.Interest || "0") || 0,
      maandbedrag: parseFloat(row["Maandbedrag"] || row["Monthly"] || "0") || 0,
      looptijd: row.Looptijd || row["Term"] || "",
      status: row.Status || "open",
    });
  });
  return records;
}

function extractYearMonth(dateStr) {
  if (!dateStr) return {};
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return {};
  }
  return { year: parsed.getFullYear(), month: parsed.getMonth() + 1 };
}

function getTotalTransacties() {
  return db.prepare("SELECT COUNT(*) AS count FROM transacties").get().count;
}

function normalizeOmschrijving(value) {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({ dest: uploadsDir });

const app = express();
app.use(express.json());
app.use(cors());

// Endpoint voor het ophalen van transacties uit SQLite (debug).
app.get("/api/transacties", (req, res) => {
  const rows = db
    .prepare("SELECT rekening, datum, bedrag, omschrijving, bron, ingevoerd_op FROM transacties ORDER BY ingevoerd_op DESC LIMIT 100")
    .all();
  res.json({
    ok: true,
    transacties: rows,
  });
});

// Maandoverzicht voor transacties op basis van jaar en maand.
app.get("/api/transacties/maand", (req, res) => {
  const year = req.query.year;
  const month = req.query.month;
  if (!year || !month || !/^\d{4}$/.test(year) || !/^\d{2}$/.test(month)) {
    return res.status(400).json({ ok: false, error: "Ongeldige parameters" });
  }

  const prefix = `${year}-${month}-`;
  const rows = db
    .prepare(
      "SELECT id, rekening, datum, bedrag, omschrijving, bron, ingevoerd_op FROM transacties WHERE datum LIKE ? ORDER BY datum ASC, id ASC"
    )
    .all(`${prefix}%`);

  const inkomsten = rows.filter((r) => r.bedrag > 0).reduce((sum, r) => sum + r.bedrag, 0);
  const uitgaven = rows.filter((r) => r.bedrag < 0).reduce((sum, r) => sum + r.bedrag, 0);
  const saldo = rows.reduce((sum, r) => sum + r.bedrag, 0);

  const perDagMap = {};
  rows.forEach((r) => {
    perDagMap[r.datum] = (perDagMap[r.datum] || 0) + r.bedrag;
  });
  const perDag = Object.keys(perDagMap)
    .sort()
    .map((datum) => ({ datum, totaal: perDagMap[datum] }));

  const perCategorieMap = {};
  rows.forEach((r) => {
    if (!r.categorie) {
      return;
    }
    perCategorieMap[r.categorie] = (perCategorieMap[r.categorie] || 0) + r.bedrag;
  });
  const perCategorie = Object.keys(perCategorieMap).map((categorie) => ({
    categorie,
    totaal: Number(perCategorieMap[categorie].toFixed(2)),
  }));

  res.json({
    ok: true,
    year: Number(year),
    month: Number(month),
    inkomsten,
    uitgaven,
    saldo,
    perDag,
    perCategorie,
    transacties: rows,
  });
});

// Budgetten beheren: create or update per categorie.
app.post("/api/budget", (req, res) => {
  const { categorie, bedrag_per_maand } = req.body;
  if (!categorie || typeof categorie !== "string" || categorie.trim().length === 0) {
    return res.status(400).json({ ok: false, error: "Ongeldige categorie" });
  }
  const amount = Number(bedrag_per_maand);
  if (Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({ ok: false, error: "Ongeldig bedrag_per_maand" });
  }

  const existing = budgetSelectByCategory.get(categorie.trim());
  if (existing) {
    budgetUpdate.run(amount, categorie.trim());
    return res.json({
      ok: true,
      message: "Budget bijgewerkt",
      budget: { ...existing, bedrag_per_maand: amount },
    });
  }

  const info = budgetInsert.run(categorie.trim(), amount);
  return res.json({
    ok: true,
    message: "Budget aangemaakt",
    budget: { id: info.lastInsertRowid, categorie: categorie.trim(), bedrag_per_maand: amount },
  });
});

// Alle budgetten ophalen.
app.get("/api/budget", (req, res) => {
  const budgetten = budgetSelectAll.all();
  res.json({
    ok: true,
    budgetten,
  });
});

// Budget check per maand (match via omschrijving LIKE categorie).
app.get("/api/budget/check", (req, res) => {
  const year = req.query.year;
  const month = req.query.month;
  if (!year || !month || !/^\d{4}$/.test(year) || !/^\d{2}$/.test(month)) {
    return res.status(400).json({ ok: false, error: "Ongeldige parameters" });
  }

  const prefix = `${year}-${month}-`;
  const budgetten = budgetSelectAll.all();
  const resultaten = budgetten.map((budget) => {
    if (!budget.categorie) {
      return {
        categorie: budget.categorie,
        budget: budget.bedrag_per_maand,
        uitgegeven: 0,
        status: "OK",
      };
    }

    const row = db
      .prepare(
        "SELECT SUM(CASE WHEN bedrag < 0 THEN -bedrag ELSE 0 END) AS totaal FROM transacties WHERE datum LIKE ? AND LOWER(categorie) = LOWER(?)"
      )
      .get(`${prefix}%`, budget.categorie);
    const totaleUitgaven = Number((row?.totaal || 0).toFixed(2));
    let status = "OK";
    if (totaleUitgaven >= budget.bedrag_per_maand) {
      status = "OVERSCHREDEN";
    } else if (totaleUitgaven >= 0.8 * budget.bedrag_per_maand) {
      status = "BIJNA";
    }
    return {
      categorie: budget.categorie,
      budget: budget.bedrag_per_maand,
      uitgegeven: Number(totaleUitgaven.toFixed(2)),
      status,
    };
  });

  res.json({
    ok: true,
    year: Number(year),
    month: Number(month),
    resultaten,
  });
});

// Samenvatting van inkomsten, uitgaven en vaste lasten voor een maand.
app.get("/api/vaste-lasten/maand", (req, res) => {
  const yearParam = req.query.year || req.query.jaar;
  const monthParam = req.query.month || req.query.maand;
  if (
    !yearParam ||
    !monthParam ||
    !/^\d{4}$/.test(yearParam) ||
    !/^\d{1,2}$/.test(monthParam)
  ) {
    return res
      .status(400)
      .json({ ok: false, error: "year/month (of jaar/maand) queryparameter vereist." });
  }

  const normMonth = String(monthParam).padStart(2, "0");
  const prefix = `${yearParam}-${normMonth}-`;
  try {
    const rows = db.prepare("SELECT bedrag, vaste_last FROM transacties WHERE datum LIKE ?").all(`${prefix}%`);

    const inkomsten = rows.filter((r) => r.bedrag > 0).reduce((sum, r) => sum + r.bedrag, 0);
    const uitgaven = rows.filter((r) => r.bedrag < 0).reduce((sum, r) => sum + Math.abs(r.bedrag), 0);
    const vasteLasten = rows
      .filter((r) => r.bedrag < 0 && r.vaste_last === 1)
      .reduce((sum, r) => sum + Math.abs(r.bedrag), 0);
    const vrijeRuimte = inkomsten - vasteLasten;

    return res.status(200).json({
      ok: true,
      year: Number(yearParam),
      month: Number(normMonth),
      inkomsten: Number(inkomsten.toFixed(2)),
      uitgaven: Number(uitgaven.toFixed(2)),
      vaste_lasten: Number(vasteLasten.toFixed(2)),
      vrije_ruimte: Number(vrijeRuimte.toFixed(2)),
    });
  } catch (err) {
    console.error("Interne serverfout bij vaste lasten maand:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Interne serverfout bij vaste lasten maand." });
  }
});

// Hercategoriseer transacties via GPT (categorie NULL/lege string of alles bij ?alle=true).
app.post("/api/transacties/categoriseer-opnieuw", async (req, res) => {
  const alle = req.query.alle === "true";
  const rows = alle ? selectAllTransacties.all() : selectUncategorized.all();
  if (!rows.length) {
    return res.json({ ok: true, bijgewerkt: 0, nogOver: 0 });
  }

  try {
    await classificeerTransactiesMetGPT(rows);
    rows.forEach((row) => {
      updateCategoryStmt.run(row.categorie ?? "Overig", row.id);
    });
    const nogOver = db
      .prepare("SELECT COUNT(*) AS cnt FROM transacties WHERE categorie IS NULL OR TRIM(categorie) = ''")
      .get().cnt;
    return res.json({ ok: true, bijgewerkt: rows.length, nogOver });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Fout tijdens hercategorisatie",
      detail: String(err),
    });
  }
});

// Detecteert terugkerende uitgaven en markeert ze als vaste lasten.
app.post("/api/vaste-lasten/detecteer", async (req, res) => {
  try {
    const gemarkeerd = await detecteerVasteLasten(db);
    return res.status(200).json({ ok: true, gemarkeerdeTransacties: gemarkeerd });
  } catch (err) {
    console.error("Fout bij detecteren vaste lasten:", err);
    return res.status(500).json({ ok: false, error: "Detectie faalde" });
  }
});

// Haal alle vaste-lasten-groepen op (optioneel filteren op actief = 0/1).
app.get("/api/vaste-lasten/groepen", (req, res) => {
  try {
    const actiefParam = req.query.actief;
    let sql =
      "SELECT id, normalized_key, rekening, omschrijving, gemiddelde_bedrag, aantal_transacties, eerste_datum, laatste_datum, actief, categorie, notitie FROM vaste_lasten_groepen";
    const params = [];

    if (actiefParam === "0" || actiefParam === "1") {
      sql += " WHERE actief = ?";
      params.push(Number(actiefParam));
    }

    sql += " ORDER BY omschrijving ASC";
    const groepen = db.prepare(sql).all(...params);

    return res.status(200).json({ ok: true, groepen });
  } catch (err) {
    console.error("Fout bij ophalen groepen:", err);
    return res.status(500).json({ ok: false, error: "Kon groepen niet ophalen" });
  }
});

// Update een vaste-lasten-groep (actief, categorie, notitie).
app.patch("/api/vaste-lasten/groep/:id", (req, res) => {
  const id = Number(req.params.id);
  const groep = selectGroepById.get(id);
  if (!groep) {
    return res.status(404).json({ ok: false, error: "Groep niet gevonden" });
  }
  const { actief, categorie, notitie } = req.body;
  const updates = [];
  const params = [];
  if (actief !== undefined) {
    if (actief !== 0 && actief !== 1) {
      return res.status(400).json({ ok: false, error: "Ongeldige waarde voor actief" });
    }
    updates.push("actief = ?");
    params.push(actief);
  }
  if (categorie !== undefined) {
    if (categorie !== null && typeof categorie !== "string") {
      return res.status(400).json({ ok: false, error: "Categorie moet string of null zijn" });
    }
    updates.push("categorie = ?");
    params.push(categorie);
  }
  if (notitie !== undefined) {
    if (notitie !== null && typeof notitie !== "string") {
      return res.status(400).json({ ok: false, error: "Notitie moet string of null zijn" });
    }
    updates.push("notitie = ?");
    params.push(notitie);
  }
  if (!updates.length) {
    return res.status(400).json({ ok: false, error: "Niets te updaten" });
  }

  const stmt = buildGroepUpdateStatement(updates);
  stmt.run(...params, id);
  return res.status(200).json({ ok: true });
});

// Haal alle transacties op die horen bij een vaste-lasten-groep.
app.get("/api/vaste-lasten/groep/:id/transacties", (req, res) => {
  try {
    const id = Number(req.params.id);
    const groep = selectGroepById.get(id);
    if (!groep) {
      return res.status(404).json({ ok: false, error: "Groep niet gevonden" });
    }
    const [rekeningKey, normalizedOmschrijving] = groep.normalized_key.split("::");
    const targetNormalizedOmschrijving = normalizedOmschrijving ?? "";
    const rows = selectTransactiesByRekening.all(rekeningKey);
    const transacties = rows.filter((row) => normalizeOmschrijving(row.omschrijving) === targetNormalizedOmschrijving);
    return res.status(200).json({
      ok: true,
      groep,
      transacties,
    });
  } catch (err) {
    console.error("Fout bij ophalen groeps-transacties:", err);
    return res.status(500).json({ ok: false, error: "Kon transacties niet ophalen" });
  }
});

// Instellingen - Regels CRUD
app.get("/api/instellingen/regels", (req, res) => {
  try {
    const regels = selectRegels.all();
    return res.status(200).json({ ok: true, regels });
  } catch (err) {
    console.error("Fout bij ophalen regels:", err);
    return res.status(500).json({ ok: false, error: "Interne serverfout" });
  }
});

app.post("/api/instellingen/regels", (req, res) => {
  try {
    const {
      id,
      naam,
      actief,
      rekening,
      omschrijving_pattern,
      min_bedrag,
      max_bedrag,
      categorie_actie,
      markeer_vaste_last,
    } = req.body;
    if (!naam || typeof naam !== "string" || naam.trim().length === 0) {
      return res.status(400).json({ ok: false, error: "Naam is verplicht" });
    }

    const normalizedActief = typeof actief === "boolean" ? (actief ? 1 : 0) : typeof actief === "number" ? (actief ? 1 : 0) : 1;
    const normalizedMarkeerVasteLast =
      typeof markeer_vaste_last === "boolean"
        ? markeer_vaste_last
          ? 1
          : 0
        : typeof markeer_vaste_last === "number"
        ? markeer_vaste_last
        : null;
    if (id) {
      const existing = selectRegelById.get(id);
      if (!existing) {
        return res.status(404).json({ ok: false, error: "Regel niet gevonden" });
      }
      updateRegel.run(
        naam.trim(),
        normalizedActief,
        rekening ?? null,
        omschrijving_pattern ?? null,
        min_bedrag ?? null,
        max_bedrag ?? null,
        categorie_actie ?? null,
        normalizedMarkeerVasteLast,
        id
      );
      const regel = selectRegelById.get(id);
      return res.status(200).json({ ok: true, regel });
    }

    const now = new Date().toISOString();
    const info = insertRegel.run(
      naam.trim(),
      normalizedActief,
      rekening ?? null,
      omschrijving_pattern ?? null,
      min_bedrag ?? null,
      max_bedrag ?? null,
      categorie_actie ?? null,
      normalizedMarkeerVasteLast,
      now
    );
    const regel = selectRegelById.get(info.lastInsertRowid);
    return res.status(201).json({ ok: true, regel });
  } catch (err) {
    console.error("Fout bij opslaan regel:", err);
    return res.status(500).json({ ok: false, error: "Interne serverfout" });
  }
});

app.delete("/api/instellingen/regels/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = selectRegelById.get(id);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Regel niet gevonden" });
    }
    deleteRegel.run(id);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Fout bij verwijderen regel:", err);
    return res.status(500).json({ ok: false, error: "Interne serverfout" });
  }
});

app.get("/api/instellingen/flags", (req, res) => {
  try {
    const rows = db.prepare("SELECT key, value FROM instellingen").all();
    const flags = {};
    rows.forEach((row) => {
      flags[row.key] = row.value;
    });
    return res.status(200).json({ ok: true, flags });
  } catch (err) {
    console.error("Fout in GET /api/instellingen/flags", err);
    return res.status(500).json({ ok: false, error: "Kon instellingen niet ophalen" });
  }
});

app.patch("/api/instellingen/flags/:key", (req, res) => {
  const { key } = req.params;
  const { value } = req.body || {};
  if (typeof value !== "string") {
    return res
      .status(400)
      .json({ ok: false, error: "value moet een string zijn ('0' of '1' bijvoorbeeld)" });
  }
  try {
    setInstelling(key, value);
    return res.status(200).json({ ok: true, key, value });
  } catch (err) {
    console.error("Fout in PATCH /api/instellingen/flags/:key", err);
    return res.status(500).json({ ok: false, error: "Kon instelling niet opslaan" });
  }
});

app.get("/api/patronen/maand", async (req, res) => {
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!year || !month) {
    return res.status(400).json({ ok: false, error: "year en month query parameters zijn verplicht" });
  }
  try {
    const regels = selectPatronenMaand.all(year, month);
    return res.status(200).json({ ok: true, regels });
  } catch (err) {
    console.error("Fout bij ophalen patronen:", err);
    return res.status(500).json({ ok: false, error: "Kon patronen niet ophalen" });
  }
});

app.post("/api/patronen/maand", async (req, res) => {
  const year = Number(req.body.year);
  const month = Number(req.body.month);
  if (!year || !month) {
    return res.status(400).json({ ok: false, error: "year en month body parameters zijn verplicht" });
  }
  try {
    await captureUitgavePatronen(year, month);
    const regels = selectPatronenMaand.all(year, month);
    return res.status(200).json({ ok: true, regels });
  } catch (err) {
    console.error("Fout bij analyseren patronen:", err);
    return res.status(500).json({ ok: false, error: "Kon patronen niet analyseren" });
  }
});

app.get("/api/vaste-last-index", (req, res) => {
  try {
    const lijst = selectFixedIndex.all();
    return res.status(200).json({ ok: true, lijst });
  } catch (err) {
    console.error("Fout bij ophalen vaste lasten index:", err);
    return res.status(500).json({ ok: false, error: "Kon vaste lasten index niet laden" });
  }
});

app.post("/api/vaste-last-index", (req, res) => {
  const { id, naam, bedrag, rekening, frequentie, omschrijving, actief } = req.body;
  if (!naam || typeof naam !== "string" || !bedrag) {
    return res.status(400).json({ ok: false, error: "Naam en bedrag zijn verplicht" });
  }
  try {
    if (id) {
      const existing = selectFixedById.get(id);
      if (!existing) {
        return res.status(404).json({ ok: false, error: "Vaste last niet gevonden" });
      }
      updateFixedIndexStmt.run(
        naam,
        Number(bedrag),
        rekening ?? null,
        frequentie ?? null,
        omschrijving ?? null,
        actif !== undefined ? Number(actif) : existing.actief,
        id
      );
      return res.status(200).json({ ok: true, regel: selectFixedById.get(id) });
    }
    const info = insertFixedIndexStmt.run(naam, Number(bedrag), rekening ?? null, frequentie ?? null, omschrijving ?? null);
    return res.status(201).json({ ok: true, regel: selectFixedById.get(info.lastInsertRowid) });
  } catch (err) {
    console.error("Fout bij opslaan vaste last index:", err);
    return res.status(500).json({ ok: false, error: "Kon vaste last niet opslaan" });
  }
});

app.delete("/api/vaste-last-index/:id", (req, res) => {
  const id = Number(req.params.id);
  try {
    const existing = selectFixedById.get(id);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Vaste last niet gevonden" });
    }
    deleteFixedIndexStmt.run(id);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Fout bij verwijderen vaste last index:", err);
    return res.status(500).json({ ok: false, error: "Kon vaste last niet verwijderen" });
  }
});

app.get("/api/schulden", (req, res) => {
  try {
    const lijst = selectSchulden.all();
    return res.status(200).json({ ok: true, lijst });
  } catch (err) {
    console.error("Fout bij ophalen schulden:", err);
    return res.status(500).json({ ok: false, error: "Kon schulden niet ophalen" });
  }
});

app.post("/api/schulden/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: "Geen bestand ontvangen (field: file)" });
  }
  try {
    const buffer = fs.readFileSync(req.file.path);
    const records = parseDebtCsvBuffer(buffer);
    const ids = db.transaction((rows) => {
      const inserted = [];
      for (const row of rows) {
        const info = insertSchuldStmt.run(
          row.naam,
          row.bedrag,
          row.rente,
          row.maandbedrag,
          row.looptijd,
          row.status
        );
        inserted.push(info.lastInsertRowid);
      }
      return inserted;
    })(records);
    return res.status(200).json({ ok: true, inserted: ids.length });
  } catch (err) {
    console.error("Fout bij upload schulden:", err);
    return res.status(500).json({ ok: false, error: "Kon schulden niet importeren" });
  } finally {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
  }
});

app.get("/api/instellingen/overzicht", (req, res) => {
  try {
    const regelsStats = db
      .prepare(`
        SELECT
          COUNT(*) AS totaal,
          SUM(CASE WHEN actief = 1 THEN 1 ELSE 0 END) AS actief,
          MAX(laatst_getriggerd_op) AS laatst_getriggerd_op
        FROM regels
      `)
      .get();

    return res.status(200).json({
      ok: true,
      regels: {
        totaal: regelsStats?.totaal || 0,
        actief: regelsStats?.actief || 0,
        laatst_getriggerd_op: regelsStats?.laatst_getriggerd_op || null,
      },
    });
  } catch (err) {
    console.error("Fout in /api/instellingen/overzicht", err);
    return res.status(500).json({
      ok: false,
      error: "Kon instellingen-overzicht niet ophalen",
    });
  }
});

// Endpoint voor het inlezen van transacties via CSV-upload.
app.post("/api/upload-transacties/csv", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ ok: false, error: "Geen bestand ontvangen (field: file)" });
  }

  try {
    const buffer = fs.readFileSync(req.file.path);
    const records = parseCsvBufferNaarRecords(buffer);
    const now = new Date().toISOString();
    const transacties = records
      .map((row) => {
        const datum =
          row.Datum ||
          row["Boekingsdatum"] ||
          row["Date"] ||
          row["DATUM"] ||
          null;

        const omschrijving =
          row.Omschrijving ||
          row["Naam / Omschrijving"] ||
          row["Omschrijving-1"] ||
          row["Beschrijving"] ||
          row["Description"] ||
          "";

        const rekening =
          row.Rekening ||
          row["Rekeningnummer"] ||
          row["IBAN"] ||
          row["Account"] ||
          "Onbekend";

        let bedragRaw =
          row.Bedrag ||
          row["Bedrag (EUR)"] ||
          row["Amount"] ||
          row["Bedrag in EUR"] ||
          "0";

        if (typeof bedragRaw === "string") {
          bedragRaw = bedragRaw.trim().replace(/\./g, "").replace(",", ".");
        }

        const bedrag = parseFloat(bedragRaw) || 0;

        return {
          rekening,
          datum,
          bedrag,
          omschrijving,
          categorie: null,
          bron: "csv",
          ingevoerd_op: now,
          vaste_last: 0,
        };
      })
      .filter((item) => item.datum && !Number.isNaN(item.bedrag));

    await classificeerTransactiesMetGPT(transacties);
    const { count, ids } = insertTransacties(transacties, "csv");
    if (ids.length) {
      await applyRegelsOpNieuweTransacties(ids);
      const { year, month: monthNum } = extractYearMonth(transacties[0]?.datum);
      if (year && monthNum) {
        await captureUitgavePatronen(year, monthNum);
      }
    }
    res.json({
      ok: true,
      inserted: count,
    });
  } catch (err) {
    console.error("Fout in /api/upload-transacties/csv:", err);
    res.status(500).json({
      ok: false,
      error:
        err?.message?.startsWith("CSV parse error:")
          ? err.message
          : "CSV kon niet worden geparsed: " + (err?.message || "onbekende fout"),
    });
  } finally {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
  }
});

// Endpoint voor het uploaden van een PDF en genereren van transacties via GPT.
app.post("/api/upload-transacties/pdf", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ ok: false, error: "Geen bestand ontvangen (field: file)." });
  }

  try {
    const buffer = fs.readFileSync(req.file.path);
    const text = (await pdfParse(buffer)).text;
    const parsed = await parsePdfTransactiesViaGPT(text);
    if (!parsed.length) {
      return res.status(500).json({ ok: false, error: "PDF kon niet worden geparsed door GPT." });
    }

    const { count, ids } = insertTransacties(parsed, "pdf");
    applyRegelsOpNieuweTransacties(ids);
    res.json({
      ok: true,
      geimporteerd: count,
      totaalInDb: getTotalTransacties(),
    });
  } catch (err) {
    console.error("Fout in /api/upload-transacties/pdf:", err);
    res.status(500).json({
      ok: false,
      error: "Interne fout bij verwerken PDF-upload",
    });
  } finally {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
  }
});

app.post("/api/openai-test", async (req, res) => {
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "Je bent een testassistent voor de Moneylith app.",
        },
        {
          role: "user",
          content: "Geef één korte zin terug als deze HTTP-test werkt.",
        },
      ],
    });

    res.json({
      ok: true,
      reply: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error("OpenAI-fout:", err);
    res.status(500).json({
      ok: false,
      error: "OpenAI-fout",
      detail: String(err),
    });
  }
});

const buildDir = path.join(__dirname, "dist");
const staticDir = fs.existsSync(buildDir) ? buildDir : path.join(__dirname, "public");

app.use(express.static(staticDir));

// Serve SPA entry point for routes that aren't API endpoints
app.get("*", (req, res) => {
  // Avoid interfering with API routes
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ ok: false, error: "Route not found" });
  }
  res.sendFile(path.join(staticDir, "index.html"));
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Moneylith API-server draait op http://localhost:${PORT}`);
});
