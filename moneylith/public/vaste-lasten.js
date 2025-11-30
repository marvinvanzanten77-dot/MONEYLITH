// Laad jaar/maand-selects en toon vaste lasten-overzicht + detectie-resultaten.
const jaarSelect = document.getElementById("vaste-jaar");
const maandSelect = document.getElementById("vaste-maand");
const loadButton = document.getElementById("load-vaste");
const detectButton = document.getElementById("detect-vaste");
const inkomstenEl = document.getElementById("vaste-inkomsten");
const uitgavenEl = document.getElementById("vaste-uitgaven");
const vasteLastenEl = document.getElementById("vaste-vaste");
const vrijeRuimteEl = document.getElementById("vaste-vrije");
const errorEl = document.getElementById("vaste-error");
const detectResultEl = document.getElementById("detect-result");

const today = new Date();
const currentYear = today.getFullYear();
for (let year = currentYear; year >= currentYear - 3; year -= 1) {
  const option = document.createElement("option");
  option.value = String(year);
  option.textContent = year;
  jaarSelect.appendChild(option);
}
jaarSelect.value = String(currentYear);
maandSelect.value = String(today.getMonth() + 1).padStart(2, "0");

function formatCurrency(value) {
  return `€ ${value.toFixed(2)}`;
}

loadButton.addEventListener("click", async () => {
  const year = jaarSelect.value;
  const month = maandSelect.value;
  errorEl.style.display = "none";
  detectResultEl.textContent = "";
  inkomstenEl.textContent = "…";
  uitgavenEl.textContent = "…";
  vasteLastenEl.textContent = "…";
  vrijeRuimteEl.textContent = "…";

  try {
    const resp = await fetch(`/api/vaste-lasten/maand?year=${year}&month=${month}`);
    const data = await resp.json();

    if (!resp.ok || !data.ok) {
      throw new Error(data.error || "Kon vaste lasten voor deze maand niet ophalen.");
    }

    inkomstenEl.textContent = formatCurrency(data.inkomsten || 0);
    uitgavenEl.textContent = formatCurrency(data.uitgaven || 0);
    vasteLastenEl.textContent = formatCurrency(data.vaste_lasten || 0);
    vrijeRuimteEl.textContent = formatCurrency(data.vrije_ruimte || 0);
  } catch (err) {
    console.error(err);
    errorEl.style.display = "block";
    errorEl.textContent = `Fout: ${err.message}`;
  }
});

detectButton.addEventListener("click", async () => {
  detectResultEl.textContent = "Detectie bezig...";
  try {
    const resp = await fetch("/api/vaste-lasten/detecteer", { method: "POST" });
    const data = await resp.json();
    if (!data.ok) {
      throw new Error(data.error || "Detectie fout");
    }
    detectResultEl.textContent = `Gemarkeerd: ${data.gemarkeerd} transacties`;
  } catch (err) {
    detectResultEl.textContent = `Fout: ${err.message}`;
  }
});

const filterActiefSelect = document.getElementById("filter-actief");
const herlaadGroepenBtn = document.getElementById("btn-herlaad-groepen");
const groepenStatusEl = document.getElementById("groepen-status");
const groepenTabelBody = document.querySelector("#vaste-lasten-groepen-tabel tbody");
const groepTransactiesPaneel = document.getElementById("groep-transacties-paneel");
const groepTransactiesInfo = document.getElementById("groep-transacties-info");
const groepTransactiesTabelBody = document.querySelector("#groep-transacties-tabel tbody");
const sluitTransactiesBtn = document.getElementById("btn-sluit-transacties");

async function debugFetch(url, options) {
  console.log("[DEBUG vaste-lasten] Request naar:", url, options || {});
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  console.log(
    "[DEBUG vaste-lasten] Response van:",
    url,
    "status:",
    res.status,
    "content-type:",
    contentType,
    "body preview:",
    text.slice(0, 300)
  );
  return { res, contentType, text };
}

async function updateGroep(id, payload) {
  try {
    const res = await fetch(`/api/vaste-lasten/groep/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      alert(data.error || "Kon de groep niet bijwerken.");
    }
  } catch (err) {
    console.error(err);
    alert("Netwerkfout bij bijwerken van vaste last.");
  }
}

async function toonGroepTransacties(id) {
  try {
    const res = await fetch(`/api/vaste-lasten/groep/${id}/transacties`);
    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert(data.error || "Kon transacties niet ophalen.");
      return;
    }

    const g = data.groep;
    groepTransactiesInfo.textContent =
      `${g.omschrijving} (${g.rekening}) – gemiddeld € ${
        typeof g.gemiddelde_bedrag === "number" ? g.gemiddelde_bedrag.toFixed(2) : g.gemiddelde_bedrag
      } over ${g.aantal_transacties} transacties`;

    groepTransactiesTabelBody.innerHTML = "";
    data.transacties.forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.datum}</td>
        <td>€ ${typeof t.bedrag === "number" ? t.bedrag.toFixed(2) : t.bedrag}</td>
        <td>${t.rekening}</td>
        <td>${t.omschrijving}</td>
        <td>${t.vaste_last ? "Ja" : "Nee"}</td>
      `;
      groepTransactiesTabelBody.appendChild(tr);
    });
    groepTransactiesPaneel.style.display = "block";
  } catch (err) {
    console.error(err);
    alert("Netwerkfout bij tonen van transacties.");
  }
}

function renderGroups(groups) {
  groepenTabelBody.innerHTML = "";
  groups.forEach((groep) => {
    const tr = document.createElement("tr");
    const activeTd = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = groep.actief == 1;
    checkbox.addEventListener("change", () => {
      updateGroep(groep.id, { actief: checkbox.checked ? 1 : 0 });
    });
    activeTd.appendChild(checkbox);

    const catTd = document.createElement("td");
    const catInput = document.createElement("input");
    catInput.type = "text";
    catInput.value = groep.categorie ?? "";
    catInput.addEventListener("blur", () => {
      updateGroep(groep.id, { categorie: catInput.value || null });
    });
    catTd.appendChild(catInput);

    const noteTd = document.createElement("td");
    const noteInput = document.createElement("input");
    noteInput.type = "text";
    noteInput.value = groep.notitie ?? "";
    noteInput.addEventListener("blur", () => {
      updateGroep(groep.id, { notitie: noteInput.value || null });
    });
    noteTd.appendChild(noteInput);

    const detailTd = document.createElement("td");
    const detailBtn = document.createElement("button");
    detailBtn.type = "button";
    detailBtn.textContent = "Transacties";
    detailBtn.addEventListener("click", () => toonGroepTransacties(groep.id));
    detailTd.appendChild(detailBtn);

    tr.appendChild(activeTd);
    tr.appendChild(createCell(groep.omschrijving));
    tr.appendChild(createCell(groep.rekening));
    tr.appendChild(createCell(`€ ${groep.gemiddelde_bedrag.toFixed(2)}`));
    tr.appendChild(createCell(groep.aantal_transacties));
    tr.appendChild(createCell(groep.eerste_datum));
    tr.appendChild(createCell(groep.laatste_datum));
    tr.appendChild(catTd);
    tr.appendChild(noteTd);
    tr.appendChild(detailTd);
    groepenTabelBody.appendChild(tr);
  });
}

function createCell(content) {
  const td = document.createElement("td");
  td.textContent = content;
  return td;
}

async function laadVasteLastenGroepen() {
  groepenStatusEl.textContent = "Bezig met laden…";
  const filter = filterActiefSelect.value;
  let url = "/api/vaste-lasten/groepen";
  if (filter === "1" || filter === "0") {
    url += `?actief=${filter}`;
  }

  try {
    console.log("[DEBUG groepen] URL:", url);
    const res = await fetch(url);
    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();

    console.log(
      "[DEBUG groepen] status:",
      res.status,
      "content-type:",
      contentType,
      "body preview:",
      text.slice(0, 300)
    );

    if (!res.ok) {
      groepenStatusEl.textContent = `Fout bij laden vaste lasten groepen (status ${res.status}). Zie console.`;
      groepenTabelBody.innerHTML = "";
      return;
    }

    if (!contentType.includes("application/json")) {
      groepenStatusEl.textContent =
        "Server gaf geen geldige JSON terug voor vaste lasten groepen. Zie console.";
      groepenTabelBody.innerHTML = "";
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("[DEBUG groepen] JSON parse fout:", e);
      groepenStatusEl.textContent =
        "Kon JSON van server niet lezen voor vaste lasten groepen. Zie console.";
      groepenTabelBody.innerHTML = "";
      return;
    }

    if (!data.ok) {
      console.error("[DEBUG groepen] backend-error:", data.error);
      groepenStatusEl.textContent = data.error || "Kon vaste lasten groepen niet laden.";
      groepenTabelBody.innerHTML = "";
      return;
    }

    const groepen = data.groepen || [];
    renderGroups(groepen);
    groepenStatusEl.textContent = `${groepen.length} groepen geladen.`;
  } catch (err) {
    console.error("Echte netwerkfout bij laden vaste lasten groepen:", err);
    groepenStatusEl.textContent = "Netwerkfout bij laden vaste lasten groepen (zie console).";
    groepenTabelBody.innerHTML = "";
  }
}

filterActiefSelect.addEventListener("change", laadVasteLastenGroepen);
herlaadGroepenBtn.addEventListener("click", laadVasteLastenGroepen);
sluitTransactiesBtn.addEventListener("click", () => {
  groepTransactiesPaneel.style.display = "none";
});

document.addEventListener("DOMContentLoaded", () => {
  laadVasteLastenGroepen();
});
