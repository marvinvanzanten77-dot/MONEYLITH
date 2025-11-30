export function MainNavCards() {
  const tiles = [
    {
      title: "Maandoverzicht",
      subtitle: "Bekijk gedetailleerde maandgegevens van je transacties.",
      cta: "Ga naar maandoverzicht",
    },
    {
      title: "Budgetten",
      subtitle: "Plan je maandelijkse uitgaven en houd ze bij.",
      cta: "Budgetten",
    },
    {
      title: "Vaste lasten",
      subtitle: "Bekijk vaste lasten & vrije ruimte per maand.",
      cta: "Vaste lasten",
    },
    {
      title: "Instellingen",
      subtitle: "Regels en alerts beheren (nog in ontwikkeling).",
      cta: "Bekijk later",
    },
  ];

  return (
    <section className="main-nav-grid">
      {tiles.map((tile) => (
        <article key={tile.title} className="main-nav-card">
          <div>
            <h2>{tile.title}</h2>
            <p>{tile.subtitle}</p>
          </div>
          <button type="button">{tile.cta}</button>
        </article>
      ))}
    </section>
  );
}
