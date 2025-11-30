// Detecteert terugkerende uitgaven en markeert ze als vaste lasten; bouwt ook groepmetadata.
export async function detecteerVasteLasten(db) {
  const rows = db
    .prepare("SELECT id, rekening, datum, omschrijving, bedrag FROM transacties WHERE bedrag < 0 AND TRIM(omschrijving) != ''")
    .all();

  const updateTransactieStmt = db.prepare("UPDATE transacties SET vaste_last = 1 WHERE id = ?");
  const selectGroep = db.prepare("SELECT id FROM vaste_lasten_groepen WHERE normalized_key = ?");
  const insertGroep = db.prepare(
    "INSERT INTO vaste_lasten_groepen (normalized_key, rekening, omschrijving, gemiddelde_bedrag, aantal_transacties, eerste_datum, laatste_datum) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const updateGroep = db.prepare(
    "UPDATE vaste_lasten_groepen SET gemiddelde_bedrag = ?, aantal_transacties = ?, eerste_datum = ?, laatste_datum = ? WHERE normalized_key = ?"
  );

  const groups = {};
  rows.forEach((row) => {
    const normalizedOmschrijving = row.omschrijving
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
    const key = `${row.rekening}::${normalizedOmschrijving}`;
    const month = row.datum.slice(0, 7);
    if (!groups[key]) {
      groups[key] = {
        ids: [],
        months: new Set(),
        amounts: [],
        minDatum: row.datum,
        maxDatum: row.datum,
        rekening: row.rekening,
        omschrijving: row.omschrijving,
      };
    }
    const group = groups[key];
    group.ids.push(row.id);
    group.months.add(month);
    group.amounts.push(row.bedrag);
    if (row.datum < group.minDatum) group.minDatum = row.datum;
    if (row.datum > group.maxDatum) group.maxDatum = row.datum;
  });

  let gemarkeerd = 0;
  Object.entries(groups).forEach(([key, group]) => {
    if (group.ids.length >= 3 && group.months.size >= 3) {
      group.ids.forEach((id) => {
        updateTransactieStmt.run(id);
        gemarkeerd += 1;
      });

      const gemiddelde =
        group.amounts.reduce((sum, value) => sum + value, 0) / group.amounts.length;
      const existing = selectGroep.get(key);
      if (!existing) {
        insertGroep.run(
          key,
          group.rekening,
          group.omschrijving,
          Number(gemiddelde.toFixed(2)),
          group.ids.length,
          group.minDatum,
          group.maxDatum
        );
      } else {
        updateGroep.run(
          Number(gemiddelde.toFixed(2)),
          group.ids.length,
          group.minDatum,
          group.maxDatum,
          key
        );
      }
    }
  });
  return gemarkeerd;
}
