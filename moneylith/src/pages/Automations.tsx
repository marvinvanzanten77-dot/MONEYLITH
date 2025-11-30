const exampleRules = [
  "Stuur een waarschuwing als speelruimte onder € 200 valt.",
  "Markeer een uitgave als 'hoog' als het bedrag boven € 250 uitkomt.",
  "Plan een buffer als variabele kosten stijgen met > 10%.",
];

const userRules = [
  {
    name: "Speelruimte alert",
    condition: "Vrij te besteden < € 200",
    action: "Toon melding",
    status: "Actief",
  },
  {
    name: "Hoge uitgave",
    condition: "Bedrag > € 250",
    action: "Markeer transactie",
    status: "Uitgeschakeld",
  },
];

export function Automations() {
  return (
    <section className="automations-page space-y-6">
      <header className="section-row">
        <div>
          <p className="section-label--small">Automatiseringen</p>
          <h2 className="section-title">Regels voor meldingen en automatische berekeningen.</h2>
          <p className="section-helper">
            Alles blijft lokaal; je stelt alleen zichtbare regels en alerts in.
          </p>
        </div>
      </header>

      <article className="section-panel">
        <header>
          <p className="section-label--small">Voorbeelden van regels</p>
          <span className="section-helper">Dit zijn suggesties met dummy-data.</span>
        </header>
        <ul className="section-helper" style={{ listStyle: "disc", paddingLeft: "1.25rem", margin: 0 }}>
          {exampleRules.map((rule) => (
            <li key={rule} style={{ marginBottom: "0.25rem" }}>
              {rule}
            </li>
          ))}
        </ul>
      </article>

      <article className="section-panel">
        <header>
          <p className="section-label--small">Jouw regels</p>
          <span className="section-helper">Status en acties blijven zichtbaar.</span>
        </header>
        {userRules.map((rule) => (
          <div key={rule.name} className="list-card">
            <div>
              <strong>{rule.name}</strong>
              <p className="section-helper">{rule.condition}</p>
              <p className="section-helper" style={{ color: "#4fd2ff" }}>
                Actie: {rule.action}
              </p>
            </div>
            <span className="summary-badge">{rule.status}</span>
          </div>
        ))}
        <button className="moneylith-pill moneylith-pill--primary" type="button">
          Nieuwe automatisering
        </button>
        <p className="section-helper">Hier kun je later je eigen regels maken.</p>
      </article>
    </section>
  );
}
