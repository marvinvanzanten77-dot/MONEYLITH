import { useEffect, useState } from "react";
import type { FixedExpense, Income, MonthPlan } from "../core/types";
import { formatCurrency } from "../core/format";

interface DashboardProps {
  monthPlan: MonthPlan;
  incomes: Income[];
  fixedExpenses: FixedExpense[];
}

const summaryCards = [
  { key: "free", label: "Vrij te besteden", helper: "Na vaste en variabele lasten.", icon: "💠" },
  { key: "fixed", label: "Vaste lasten", helper: "Actief deze maand.", icon: "📌" },
  { key: "debts", label: "Schulden", helper: "Lopende aflossingen.", icon: "⚠️" },
];

const incomePlaceholders = [
  { label: "Salaris", value: "€ 3.400" },
  { label: "Toeslagen", value: "€ 420" },
  { label: "Bijbaan", value: "€ 620" },
];

const fixedExpensePlaceholders = [
  { name: "Huur", day: "01", amount: "€ 1.120" },
  { name: "Energie", day: "08", amount: "€ 220" },
  { name: "Internet", day: "05", amount: "€ 45" },
  { name: "Abonnementen", day: "10", amount: "€ 60" },
];

export function Dashboard({ monthPlan, fixedExpenses, incomes }: DashboardProps) {
  const [instellingen, setInstellingen] = useState<{
    regels: {
      totaal: number;
      actief: number;
      laatst_getriggerd_op: string | null;
    };
  } | null>(null);
  const [instellingenLoading, setInstellingenLoading] = useState(true);
  const [instellingenError, setInstellingenError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setInstellingenLoading(true);
      setInstellingenError(null);
      try {
        const resp = await fetch("/api/instellingen/overzicht");
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
          throw new Error(data.error || "Kon instellingen niet laden");
        }
        if (!cancelled) {
          setInstellingen(data);
        }
      } catch (err) {
        if (!cancelled) {
          setInstellingenError(err instanceof Error ? err.message : "Fout bij laden instellingen");
        }
      } finally {
        if (!cancelled) {
          setInstellingenLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = {
    free: formatCurrency(monthPlan.freeToSpend),
    fixed: `${fixedExpenses.length} items`,
    debts: "3 leningen",
  };

  const incomeRows =
    incomes.length > 0
      ? incomes.map((income) => ({ label: income.name, value: formatCurrency(income.amount) }))
      : incomePlaceholders;

  const fixedRows =
    fixedExpenses.length > 0
      ? fixedExpenses.map((expense) => ({
          name: expense.name,
          day: expense.dayOfMonth.toString().padStart(2, "0"),
          amount: formatCurrency(expense.amount),
        }))
      : fixedExpensePlaceholders;

  return (
    <section className="dashboard-page space-y-6">
      <div className="section-row">
        {summaryCards.map((card) => (
          <article key={card.key} className="section-panel">
            <header>
              <p className="section-label--small">
                {card.icon} {card.label}
              </p>
              <span className="section-amount-right">{totals[card.key as keyof typeof totals]}</span>
            </header>
            <p className="section-helper">{card.helper}</p>
          </article>
        ))}
      </div>

      <div className="section-panel">
        <header>
          <div>
            <p className="section-label--small">Inkomen</p>
            <h3 className="section-value">{formatCurrency(monthPlan.totalIncome)}</h3>
          </div>
          <span className="section-helper">Maandelijkse optelling.</span>
        </header>
        <div className="list-card" style={{ borderBottom: 0 }}>
          <strong className="section-helper">Bron</strong>
          <strong className="section-helper">Bedrag</strong>
        </div>
        {incomeRows.map((item) => (
          <div key={item.label} className="list-card">
            <p>{item.label}</p>
            <p className="section-amount-right">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="section-panel">
        <header>
          <div>
            <p className="section-label--small">Vaste lasten</p>
            <h3 className="section-value">{formatCurrency(monthPlan.totalFixedExpenses)}</h3>
          </div>
          <span className="section-helper">Terugkerende kosten deze maand.</span>
        </header>
        <table className="section-table">
          <thead>
            <tr>
              <th>Naam</th>
              <th>Dag</th>
              <th>Bedrag</th>
            </tr>
          </thead>
          <tbody>
            {fixedRows.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.day}</td>
                <td>{row.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-panel">
        <header>
          <div>
            <p className="section-label--small">Speelruimte</p>
            <h3 className="section-value">{formatCurrency(monthPlan.freeToSpend)}</h3>
          </div>
          <span className="section-helper">Vrij om uit te geven na alle vaste en geplande lasten.</span>
        </header>
        <div className="summary-row">
          {Array.from({ length: 4 }).map((_, index) => (
            <span key={index} className="summary-badge">
              Week {index + 1}: {formatCurrency(monthPlan.weeklyBreakdown[index] ?? 0)}
            </span>
          ))}
        </div>
        <p className="section-helper">Indicatie per maand, opgesplitst per week.</p>
      </div>

      <div className="section-panel">
        <header>
          <div>
            <p className="section-label--small">Instellingen</p>
            <h3 className="section-value">Regels overzicht</h3>
          </div>
          <span className="section-helper">Laatste regels & status.</span>
        </header>
        {instellingenLoading ? (
          <p className="section-helper text-sm">Laden…</p>
        ) : instellingenError ? (
          <p className="section-helper text-sm text-red-400">{instellingenError}</p>
        ) : instellingen ? (
          <div className="space-y-2 text-sm text-moneylith-muted">
            <p>
              {instellingen.regels.totaal} regels ({instellingen.regels.actief} actief)
            </p>
            <p>
              Laatst getriggerd:{" "}
              {instellingen.regels.laatst_getriggerd_op
                ? new Date(instellingen.regels.laatst_getriggerd_op).toLocaleString("nl-NL")
                : "Nog niet"}
            </p>
          </div>
        ) : (
          <p className="section-helper text-sm">Geen regels beschikbaar.</p>
        )}
      </div>
    </section>
  );
}
