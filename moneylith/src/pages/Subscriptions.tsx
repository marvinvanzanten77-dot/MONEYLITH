const subscriptions = [
  {
    name: "Netflix",
    amount: "€ 15,99",
    frequency: "Maandelijks",
    account: "Persoonlijke ING",
    next: "04 dec",
    status: "Actief",
  },
  {
    name: "Spotify",
    amount: "€ 9,99",
    frequency: "Maandelijks",
    account: "ING Zakelijk",
    next: "12 dec",
    status: "Actief",
  },
  {
    name: "Telefoonabonnement",
    amount: "€ 29,50",
    frequency: "Maandelijks",
    account: "bunq virtueel",
    next: "01 dec",
    status: "Gepauzeerd",
  },
];

export function Subscriptions() {
  return (
    <section className="subscriptions-page space-y-6">
      <header className="section-row">
        <div>
          <p className="section-label--small">Abonnementen</p>
          <h2 className="section-title">Automatische terugkerende kosten in één overzicht.</h2>
          <p className="section-helper">
            Streamingdiensten, telefoon en lidmaatschappen worden hier gelinkt aan je rekeningen.
          </p>
        </div>
        <button className="moneylith-pill moneylith-pill--primary" type="button">
          Abonnement toevoegen
        </button>
      </header>

      <div className="accounts-grid">
        {subscriptions.map((subscription) => (
          <article key={subscription.name} className="account-card">
            <div className="account-card-main">
              <div>
                <h3>{subscription.name}</h3>
                <p className="iban">{subscription.amount}</p>
                <p className="meta">
                  {subscription.frequency} • {subscription.account}
                </p>
                <p className="section-helper">Volgende betaling: {subscription.next}</p>
              </div>
              <span className="summary-badge">{subscription.status}</span>
            </div>
            <div className="account-actions">
              <button className="ghost-button" type="button">
                Bewerken
              </button>
              <button className="ghost-button ghost-button--alert" type="button">
                Verwijderen
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
