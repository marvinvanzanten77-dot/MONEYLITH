import { DashboardCard } from "./DashboardCard";
import { useFetch } from "../../core/useFetch";
import type { Schuld } from "../../core/dashboardTypes";

type SchuldenResponse = { ok: boolean; lijst: Schuld[] };

export function SchuldenCard() {
  const { data, loading, error } = useFetch<SchuldenResponse>("/api/schulden");
  const rows = data?.lijst?.slice(0, 5) ?? [];
  const totaal = data?.lijst?.reduce((sum, s) => sum + (s.bedrag ?? 0), 0) ?? 0;

  return (
    <DashboardCard title="Schulden" actionLabel="Bekijk alles" onAction={() => {}}>
      {loading && <p>Bezig met laden...</p>}
      {error && <p className="text-red-400">Er is een fout opgetreden.</p>}
      {!loading && !error && rows.length === 0 && <p>Geen gegevens gevonden.</p>}
      {!loading && !error && rows.length > 0 && (
        <>
          <p className="text-xs text-moneylith-muted mb-2">Totaal openstaand: {formatEuro(totaal)}</p>
          <table className="w-full text-left text-sm">
            <thead className="text-moneylith-muted border-b border-white/10">
              <tr>
                <th className="py-2 pr-3">Naam schuldeiser</th>
                <th className="py-2 pr-3 text-right">Openstaand bedrag</th>
                <th className="py-2 pr-3 text-right">Maandbedrag</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((schuld) => (
                <tr key={schuld.id} className="border-b border-white/5 last:border-0">
                  <td className="py-2 pr-3">{schuld.naam}</td>
                  <td className="py-2 pr-3 text-right">{formatEuro(schuld.bedrag)}</td>
                  <td className="py-2 pr-3 text-right">
                    {schuld.maandbedrag != null ? formatEuro(schuld.maandbedrag) : "-"}
                  </td>
                  <td className="py-2 pr-3">{schuld.status || "Onbekend"}</td>
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
