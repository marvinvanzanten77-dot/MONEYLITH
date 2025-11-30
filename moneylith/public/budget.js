// Budget-module: laadt budgetten, slaat nieuwe op en checkt per maand.
const budgetTable = document.getElementById("budget-table");
const checkTable = document.getElementById("check-table");
const budgetMessage = document.getElementById("budget-message");
const checkMessage = document.getElementById("check-message");
const jaarSelect = document.getElementById("check-jaar");
const maandSelect = document.getElementById("check-maand");
const saveButton = document.getElementById("save-budget");
const checkButton = document.getElementById("check-budget");
const recatMissing = document.getElementById("recategorize-missing");
const recatAll = document.getElementById("recategorize-all");
const recatMessage = document.getElementById("recat-message");

// Vul jaar dropdown (huidig jaar en vorig jaar)
const today = new Date();
const currentYear = today.getFullYear();
for (let y = currentYear; y >= currentYear - 3; y -= 1) {
  const option = document.createElement("option");
  option.value = String(y);
  option.textContent = y;
  jaarSelect.appendChild(option);
}
jaarSelect.value = String(currentYear);

async function loadBudgetten() {
  budgetTable.innerHTML = "";
  budgetMessage.textContent = "";
  try {
    const resp = await fetch("/api/budget");
    const data = await resp.json();
    if (!data.ok) {
      throw new Error(data.error || "Kon budgetten niet ophalen");
    }
    data.budgetten.forEach((budget) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${budget.categorie}</td>
        <td>€ ${budget.bedrag_per_maand.toFixed(2)}</td>
      `;
      budgetTable.appendChild(row);
    });
  } catch (err) {
    budgetMessage.textContent = `Fout: ${err.message}`;
  }
}

saveButton.addEventListener("click", async () => {
  const categorie = document.getElementById("budget-categorie").value.trim();
  const bedrag = Number(document.getElementById("budget-bedrag").value);
  if (!categorie || Number.isNaN(bedrag) || bedrag <= 0) {
    budgetMessage.textContent = "Voer een geldige categorie en bedrag in.";
    return;
  }

  try {
    const resp = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categorie, bedrag_per_maand: bedrag }),
    });
    const data = await resp.json();
    if (!data.ok) {
      throw new Error(data.error || "Opslaan mislukt");
    }
budgetMessage.textContent = data.message;
await loadBudgetten();
} catch (err) {
  budgetMessage.textContent = `Fout: ${err.message}`;
}
});

checkButton.addEventListener("click", async () => {
  const year = jaarSelect.value;
  const month = maandSelect.value;
  checkMessage.textContent = "";
  checkTable.innerHTML = "";

  try {
    const resp = await fetch(`/api/budget/check?year=${year}&month=${month}`);
    const data = await resp.json();
    if (!data.ok) {
      throw new Error(data.error || "Check mislukt");
    }
    data.resultaten.forEach((resultaat) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${resultaat.categorie}</td>
        <td>€ ${resultaat.budget.toFixed(2)}</td>
        <td>€ ${resultaat.uitgegeven.toFixed(2)}</td>
        <td>${resultaat.status}</td>
      `;
      checkTable.appendChild(row);
    });
  } catch (err) {
    checkMessage.textContent = `Fout: ${err.message}`;
  }
});

async function recategorize(all = false) {
  recatMessage.textContent = "Bezig met categoriseren...";
  try {
    const query = all ? "?alle=true" : "";
    const resp = await fetch(`/api/transacties/categoriseer-opnieuw${query}`, {
      method: "POST",
    });
    const data = await resp.json();
    if (!data.ok) {
      throw new Error(data.error || "Categorisatie mislukt");
    }
    recatMessage.textContent = `Bijgewerkt: ${data.bijgewerkt}. Nog zonder categorie: ${data.nogOver}.`;
  } catch (err) {
    recatMessage.textContent = `Fout: ${err.message}`;
  }
}

recatMissing.addEventListener("click", () => recategorize(false));
recatAll.addEventListener("click", () => recategorize(true));

loadBudgetten();
