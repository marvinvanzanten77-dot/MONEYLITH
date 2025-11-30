import { DashboardCard } from "./DashboardCard";
import { useFetch } from "../../core/useFetch";
import type { VasteLastIndex } from "../../core/dashboardTypes";

type VasteLastResponse = { ok: boolean; lijst: VasteLastIndex[] };

export function AbonnementenCard() {
  const { data, loading, error } = useFetch<VasteLastResponse>("/api/vaste-last-index");
  const rows = data?.lijst?.slice(0, 6) ?? [];
  const totaal = data?.lijst?.reduce((sum, item) => sum + (item.bedrag ?? 0), 0) ?? 0;

  return (
    <DashboardCard title="Abonnementen & vaste lasten" actionLabel="Bekijk alles" onAction={() => {}}>
      {loading && <p>Bezig met laden...</p>}
      {error && <p className="text-red-400">Er is een fout opgetreden.</p>}
      {!loading && !error && rows.length === 0 && <p>Geen gegevens gevonden.</p>}
      {!loading && !error && rows.length > 0 && (
        <>
          <p className="text-xs text-moneylith-muted mb-2">Totaal vaste lasten per maand: {formatEuro(totaal)}</p>
          <table className="w-full text-left text-sm">
            <thead className="text-moneylith-muted border-b border-white/10">
              <tr>
                <th className="py-2 pr-3">Naam</th>
                <th className="py-2 pr-3 text-right">Bedrag per maand</th>
                <th className="py-2 pr-3">Frequentie</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-b border-white/5 last:border-0">
                  <td className="py-2 pr-3">{item.naam}</td>
                  <td className="py-2 pr-3 text-right">{formatEuro(item.bedrag)}</td>
                  <td className="py-2 pr-3">{item.frequentie || "Onbekend"}</td>
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
