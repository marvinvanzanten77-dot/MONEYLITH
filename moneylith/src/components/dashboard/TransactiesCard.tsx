import { useMemo } from "react";
import { DashboardCard } from "./DashboardCard";
import { useFetch } from "../../core/useFetch";
import type { Transactie } from "../../core/dashboardTypes";

type TransactiesResponse = { ok: boolean; transacties: Transactie[] };

export function TransactiesCard() {
  const { data, loading, error } = useFetch<TransactiesResponse>("/api/transacties");
  const rows = useMemo(() => data?.transacties?.slice(0, 10) ?? [], [data]);

  return (
    <DashboardCard title="Recente transacties" actionLabel="Bekijk alle transacties" onAction={() => {}}>
      {loading && <p>Bezig met laden...</p>}
      {error && <p className="text-red-400">Er is een fout opgetreden.</p>}
      {!loading && !error && rows.length === 0 && <p>Geen gegevens gevonden.</p>}
      {!loading && !error && rows.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead className="text-moneylith-muted border-b border-white/10">
            <tr>
              <th className="py-2 pr-3">Datum</th>
              <th className="py-2 pr-3">Omschrijving</th>
              <th className="py-2 pr-3">Rekening</th>
              <th className="py-2 pr-3 text-right">Bedrag</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tx, idx) => (
              <tr key={`${tx.rekening}-${tx.datum}-${idx}`} className="border-b border-white/5 last:border-0">
                <td className="py-2 pr-3">{tx.datum}</td>
                <td className="py-2 pr-3">{tx.omschrijving}</td>
                <td className="py-2 pr-3">{tx.rekening}</td>
                <td className="py-2 pr-3 text-right font-semibold">{formatEuro(tx.bedrag)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DashboardCard>
  );
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value || 0);
}
