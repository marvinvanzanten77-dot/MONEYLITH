import { useMemo } from "react";
import { DashboardCard } from "./DashboardCard";
import { useFetch } from "../../core/useFetch";
import type { Transactie } from "../../core/dashboardTypes";

type TransactiesResponse = { ok: boolean; transacties: Transactie[] };

export function RekeningenCard() {
  const { data, loading, error } = useFetch<TransactiesResponse>("/api/transacties");

  const rekeningen = useMemo(() => {
    if (!data?.transacties) return [];
    const map = new Map<string, number>();
    data.transacties.forEach((t) => {
      const current = map.get(t.rekening) ?? 0;
      map.set(t.rekening, current + (t.bedrag ?? 0));
    });
    return Array.from(map.entries())
      .map(([naam, saldo]) => ({ naam, saldo }))
      .sort((a, b) => b.saldo - a.saldo)
      .slice(0, 6);
  }, [data]);

  return (
    <DashboardCard title="Rekeningen" actionLabel="Bekijk alles" onAction={() => {}}>
      {loading && <p>Bezig met laden...</p>}
      {error && <p className="text-red-400">Er is een fout opgetreden.</p>}
      {!loading && !error && rekeningen.length === 0 && <p>Geen gegevens gevonden.</p>}
      {!loading && !error && rekeningen.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead className="text-moneylith-muted border-b border-white/10">
            <tr>
              <th className="py-2 pr-3">Rekening</th>
              <th className="py-2 pr-3 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {rekeningen.map((rek) => (
              <tr key={rek.naam} className="border-b border-white/5 last:border-0">
                <td className="py-2 pr-3">{rek.naam}</td>
                <td className="py-2 pr-3 text-right font-semibold">{formatEuro(rek.saldo)}</td>
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
