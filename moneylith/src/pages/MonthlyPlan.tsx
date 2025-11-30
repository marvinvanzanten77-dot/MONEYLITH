import type { MonthPlan } from "../core/types";
import { formatCurrency } from "../core/format";

interface MonthlyPlanProps {
  monthPlan: MonthPlan;
}

const plannedItems = [
  { day: "01", type: "Inkomen", description: "Salaris", amount: "€ 3.400" },
  { day: "03", type: "Uitgave", description: "Huur", amount: "€ -1.120" },
  { day: "05", type: "Uitgave", description: "Energie", amount: "€ -220" },
  { day: "10", type: "Inkomen", description: "Bijbaan", amount: "€ 620" },
  { day: "15", type: "Uitgave", description: "Internet", amount: "€ -45" },
];

export function MonthlyPlan({ monthPlan }: MonthlyPlanProps) {
  const calendar = Array.from({ length: 30 }, (_, index) => index + 1);

  return (
    <section className="monthly-plan space-y-6">
      <header className="section-row">
        <div>
          <p className="section-label--small">Maandplan</p>
          <h2 className="section-title">Overzicht van geplande inkomsten en uitgaven per maand.</h2>
          <p className="section-helper">Selecteer een maand en krijg inzicht in je cashflow.</p>
        </div>
        <label className="section-label">
          Maand
          <select className="account-form-select">
            <option>November</option>
            <option>December</option>
            <option>Januari</option>
          </select>
        </label>
      </header>

      <div className="section-row">
        <article className="section-panel full-width">
          <header>
            <p className="section-label--small">Kalenderoverzicht</p>
            <span className="section-helper">Dummy-indicatie van ingeplande events.</span>
          </header>
          <div className="calendar-grid">
            {calendar.map((day) => (
              <div key={day} className="calendar-day">
                <strong>{day}</strong>
                <small>0 taken</small>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="section-row">
        <article className="section-panel">
          <header>
            <p className="section-label--small">Geplande inkomsten en uitgaven</p>
            <span className="section-helper">Lijst van de belangrijkste posten.</span>
          </header>
          {plannedItems.map((item) => (
            <div key={`${item.day}-${item.description}`} className="list-card">
              <div>
                <strong>{item.day}</strong> • {item.type}
                <p className="section-helper">{item.description}</p>
              </div>
              <p className="section-amount-right">{item.amount}</p>
            </div>
          ))}
        </article>

        <article className="section-panel">
          <header>
            <p className="section-label--small">Samenvatting</p>
            <span className="section-helper">Verwachte balans</span>
          </header>
          <p className="section-value">Totale inkomsten: {formatCurrency(monthPlan.totalIncome)}</p>
          <p className="section-value">Totale uitgaven: {formatCurrency(monthPlan.totalFixedExpenses + monthPlan.totalVariableBudget)}</p>
          <p className="section-value">Verwacht verschil: {formatCurrency(monthPlan.freeToSpend)}</p>
        </article>
      </div>
    </section>
  );
}
