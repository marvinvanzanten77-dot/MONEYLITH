import client from "./openaiClient.mjs";

const CATEGORIES = [
  "Boodschappen",
  "Vervoer",
  "Salaris",
  "Wonen",
  "Abonnementen",
  "Shopping",
  "Gezondheid",
  "Horeca",
  "Overig",
];

const CHUNK_SIZE = 35;

function chunkArray(arr, size) {
  const results = [];
  for (let i = 0; i < arr.length; i += size) {
    results.push(arr.slice(i, i + size));
  }
  return results;
}

function buildSystemPrompt() {
  return `
Je bent een categorisatie-engine voor banktransacties.
Je krijgt een lijst transacties en moet per transactie één categorie toewijzen.
Toegestane categorieën (exact):
${CATEGORIES.map((cat) => `- '${cat}'`).join("\n")}
Geef ALLEEN geldige JSON terug in de vorm:
{ "transacties": [ { "index": number, "categorie": string } ] }
`;
}

async function classifyBatch(batch, offset) {
  const systemMessage = buildSystemPrompt();
  const userPayload = {
    transacties: batch.map((tx, idx) => ({
      index: offset + idx,
      rekening: tx.rekening,
      datum: tx.datum,
      bedrag: tx.bedrag,
      omschrijving: tx.omschrijving,
    })),
  };

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
    });

    const content = completion.choices[0].message.content;
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.transacties) ? parsed.transacties : [];
  } catch (err) {
    console.error("Categorisatie GPT fout:", err);
    return [];
  }
}

function getCategoria(cat) {
  if (typeof cat !== "string") return null;
  const trimmed = cat.trim();
  return CATEGORIES.includes(trimmed) ? trimmed : null;
}

// Voeg categorie toe aan transacties; fallback naar 'Overig' bij missing data.
export async function classificeerTransactiesMetGPT(transacties) {
  const batches = chunkArray(transacties, CHUNK_SIZE);
  const categoryMap = new Map();

  for (let i = 0; i < batches.length; i += 1) {
    const batch = batches[i];
    const offset = i * CHUNK_SIZE;
    const predictions = await classifyBatch(batch, offset);
    predictions.forEach((prediction) => {
      const categorie = getCategoria(prediction.categorie);
      if (typeof prediction.index === "number") {
        categoryMap.set(prediction.index, categorie ?? "Overig");
      }
    });
  }

  transacties.forEach((transactie, idx) => {
    transactie.categorie = categoryMap.get(idx) ?? transactie.categorie ?? "Overig";
  });
  return transacties;
}

// Parse PDF-tekst naar transacties + categorie via GPT.
export async function parsePdfTransactiesViaGPT(text) {
  const systemPrompt = `
Je bent een parser voor bankafschriften.
Je krijgt ruwe tekst uit een PDF of vergelijkbare bron.
Extraheer ALLE transacties en geef ALLEEN geldige JSON terug in deze vorm:
{
  "transacties": [
    {
      "rekening": "string",
      "datum": "YYYY-MM-DD",
      "bedrag": number,
      "omschrijving": "string",
      "categorie": "Boodschappen" | "Vervoer" | "Salaris" | "Wonen" | "Abonnementen" | "Shopping" | "Gezondheid" | "Horeca" | "Overig"
    }
  ]
}
Geen extra tekst buiten de JSON.
`;

  const userPrompt = `Hier is de tekst van het bankafschrift:\n<<<\n${text}\n>>>`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    const parsed = JSON.parse(completion.choices[0].message.content);
    if (!Array.isArray(parsed?.transacties)) return [];
    return parsed.transacties.map((tran) => ({
      rekening: tran.rekening ?? "Onbekend",
      datum: tran.datum,
      bedrag: Number(tran.bedrag),
      omschrijving: tran.omschrijving ?? "",
      categorie: getCategoria(tran.categorie) ?? "Overig",
    }));
  } catch (err) {
    console.error("PDF-categorie GPT fout:", err);
    return [];
  }
}
