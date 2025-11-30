// Maandoverzicht logica: selecteer jaar/maand en laad de gegevens via het nieuwe API.
const jaarSelect = document.getElementById("jaar-select");
const maandSelect = document.getElementById("maand-select");
const loadButton = document.getElementById("load-maand");
const errorEl = document.getElementById("error");
const inkomstenEl = document.getElementById("inkomsten");
const uitgavenEl = document.getElementById("uitgaven");
const saldoEl = document.getElementById("saldo");
const transactieBody = document.getElementById("transactie-body");
const perDagList = document.getElementById("perdag-list");
const perCategorieTable = document.getElementById("per-categorie-table");
const perCategorieBody = perCategorieTable.querySelector("tbody");
const perCategorieEmpty = document.getElementById("per-categorie-empty");

const currentDate = new Date();
const currentYear = currentDate.getFullYear();

// Populeer dropdown met de laatste 4 jaar inclusief huidig.
for (let y = currentYear; y >= currentYear - 3; y -= 1) {
  const option = document.createElement("option");
  option.value = String(y);
  option.textContent = y;
  jaarSelect.appendChild(option);
}

jaarSelect.value = String(currentYear);
maandSelect.value = String(currentDate.getMonth() + 1).padStart(2, "0");

loadButton.addEventListener("click", async () => {
  const year = jaarSelect.value;
  const month = maandSelect.value;
  errorEl.style.display = "none";
  errorEl.textContent = "";
  inkomstenEl.textContent = "...";
  uitgavenEl.textContent = "...";
  saldoEl.textContent = "...";

  try {
    const resp = await fetch(`/api/transacties/maand?year=${year}&month=${month}`);
    const data = await resp.json();
    if (!data.ok) {
      throw new Error(data.error || "Onbekende fout");
    }

    inkomstenEl.textContent = `€ ${data.inkomsten.toFixed(2)}`;
    uitgavenEl.textContent = `€ ${data.uitgaven.toFixed(2)}`;
    saldoEl.textContent = `€ ${data.saldo.toFixed(2)}`;

    transactieBody.innerHTML = "";
    data.transacties.forEach((t) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${t.datum}</td>
        <td>${t.rekening}</td>
        <td>${t.bedrag.toFixed(2)}</td>
        <td>${t.omschrijving}</td>
        <td>${t.bron}</td>
      `;
      transactieBody.appendChild(row);
    });

    perDagList.innerHTML = "";
    data.perDag.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.datum}: € ${item.totaal.toFixed(2)}`;
      perDagList.appendChild(li);
    });

    perCategorieBody.innerHTML = "";
    if (Array.isArray(data.perCategorie) && data.perCategorie.length) {
      perCategorieEmpty.style.display = "none";
      data.perCategorie.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.categorie}</td>
          <td>€ ${item.totaal.toFixed(2)}</td>
        `;
        perCategorieBody.appendChild(row);
      });
    } else {
      perCategorieEmpty.style.display = "block";
    }
  } catch (err) {
    errorEl.style.display = "block";
    errorEl.textContent = `Kon overzicht niet laden: ${err.message}`;
  }
});
