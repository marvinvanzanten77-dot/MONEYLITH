const debts = [
  {
    name: "DUO studielening",
    outstanding: "€ 12.800",
    interest: "2,4%",
    monthly: "€ 230",
    end: "Dec 2032",
    priority: "Hoog",
  },
  {
    name: "Persoonlijke lening",
    outstanding: "€ 4.200",
    interest: "7,8%",
    monthly: "€ 120",
    end: "Juli 2029",
    priority: "Gemiddeld",
  },
  {
    name: "Klarna aflossing",
    outstanding: "€ 820",
    interest: "0%",
    monthly: "€ 40",
    end: "Mei 2025",
    priority: "Laag",
  },
];

export function Debts() {
  return (
    <section className="debts-page space-y-6">
      <header className="section-row">
        <div>
          <p className="section-label--small">Schulden</p>
          <h2 className="section-title">Leningen, betalingsregelingen en openstaande lijnen.</h2>
          <p className="section-helper">
            Houd de totale schuld, maandelijkse aflossingen en prioriteit bij.
          </p>
        </div>
      </header>

      <article className="section-panel">
        <header>
          <p className="section-label--small">Samenvatting schulden</p>
          <span className="section-helper">Totaal openstaand en maandelijkse aflossing.</span>
        </header>
        <div className="section-row">
          <span className="summary-badge">Totaal open: € 17.820</span>
          <span className="summary-badge">Maandlast € 390</span>
          <span className="summary-badge">Aantal leningen: 3</span>
        </div>
      </article>

      <div className="accounts-grid">
        {debts.map((debt) => (
          <article key={debt.name} className="account-card">
            <div className="account-card-main">
              <div>
                <h3>{debt.name}</h3>
                <p className="iban">Openstaand: {debt.outstanding}</p>
                <p className="meta">
                  Rente: {debt.interest} • Maandbedrag: {debt.monthly}
                </p>
                <p className="section-helper">Einddatum: {debt.end}</p>
              </div>
              <span className="summary-badge">Prioriteit: {debt.priority}</span>
            </div>
            <div className="account-actions">
              <button className="ghost-button" type="button">
                Bewerken
              </button>
              <button className="ghost-button" type="button">
                Afgesloten markeren
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
