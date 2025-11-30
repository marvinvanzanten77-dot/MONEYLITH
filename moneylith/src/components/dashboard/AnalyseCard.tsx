import { useEffect, useState } from "react";
import { DashboardCard } from "./DashboardCard";
import { useFetch } from "../../core/useFetch";
import type { RegelPatroon } from "../../core/dashboardTypes";

type PatronenResponse = { ok: boolean; regels: RegelPatroon[] };

export function AnalyseCard() {
  const [refreshing, setRefreshing] = useState(false);
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const query = `/api/patronen/maand?year=${year}&month=${month}`;
  const { data, loading, error } = useFetch<PatronenResponse>(query);
  const regels = data?.regels ?? [];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/patronen/maand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
    } catch {
      // ignore, hook will refetch on remount/refresh; minimal best-effort
    } finally {
      setRefreshing(false);
      // trigger simple reload
      window.location.reload();
    }
  };

  useEffect(() => {
    // no-op; the useFetch hook already runs on mount
  }, []);

  return (
    <DashboardCard title="Analyse" actionLabel="Heranalyseer" onAction={handleRefresh}>
      {loading && <p>Bezig met laden...</p>}
      {(error || refreshing) && (
        <p className="text-sm text-moneylith-muted">{refreshing ? "Heranalyse in behandeling..." : "Er is een fout opgetreden."}</p>
      )}
      {!loading && !error && regels.length === 0 && <p>Geen gegevens gevonden.</p>}
      {!loading && !error && regels.length > 0 && (
        <div className="space-y-2">
          {regels.map((regel) => (
            <div key={regel.categorie} className="rounded-lg border border-white/10 bg-[#0a1224] p-3">
              <p className="text-sm font-semibold text-white">{regel.categorie}</p>
              <p className="text-xs text-moneylith-muted">Totaal: {formatEuro(regel.totaal)}</p>
              <p className="text-xs text-moneylith-muted mt-1">{regel.redenering}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value || 0);
}
