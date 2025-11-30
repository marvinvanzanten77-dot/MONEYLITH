import { useMemo } from "react";
import { DashboardCard } from "./DashboardCard";
import { useFetch } from "../../core/useFetch";
import type { Transactie } from "../../core/dashboardTypes";

type TransactiesResponse = { ok: boolean; transacties: Transactie[] };

export function InkomstenCard() {
  const { data, loading, error } = useFetch<TransactiesResponse>("/api/transacties");
  const inkomsten = useMemo(() => {
    if (!data?.transacties) return [];
    return data.transacties.filter((t) => t.bedrag > 0).slice(0, 6);
  }, [data]);
  const totaal = inkomsten.reduce((sum, t) => sum + (t.bedrag ?? 0), 0);

  return (
    <DashboardCard title="Inkomsten" actionLabel="Bekijk alles" onAction={() => {}}>
      {loading && <p>Bezig met laden...</p>}
      {error && <p className="text-red-400">Er is een fout opgetreden.</p>}
      {!loading && !error && inkomsten.length === 0 && <p>Geen gegevens gevonden.</p>}
      {!loading && !error && inkomsten.length > 0 && (
        <>
          <p className="text-xs text-moneylith-muted mb-2">Totaal: {formatEuro(totaal)}</p>
          <table className="w-full text-left text-sm">
            <thead className="text-moneylith-muted border-b border-white/10">
              <tr>
                <th className="py-2 pr-3">Datum</th>
                <th className="py-2 pr-3">Omschrijving</th>
                <th className="py-2 pr-3 text-right">Bedrag</th>
              </tr>
            </thead>
            <tbody>
              {inkomsten.map((ink, idx) => (
                <tr key={`${ink.omschrijving}-${idx}`} className="border-b border-white/5 last:border-0">
                  <td className="py-2 pr-3">{ink.datum}</td>
                  <td className="py-2 pr-3">{ink.omschrijving}</td>
                  <td className="py-2 pr-3 text-right">{formatEuro(ink.bedrag)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </DashboardCard>
  );
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value || 0);
}
