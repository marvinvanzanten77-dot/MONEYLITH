import { useMemo } from "react";
import { useFetch } from "../../core/useFetch";
import type { Transactie, VasteLastIndex, Schuld } from "../../core/dashboardTypes";
import { DashboardCard } from "./DashboardCard";

type TransactiesResponse = { ok: boolean; transacties: Transactie[] };
type VasteLastResponse = { ok: boolean; lijst: VasteLastIndex[] };
type SchuldenResponse = { ok: boolean; lijst: Schuld[] };

export function DashboardSummary() {
  const { data: txData, loading: txLoading, error: txError } =
    useFetch<TransactiesResponse>("/api/transacties");
  const { data: vlData, loading: vlLoading, error: vlError } =
    useFetch<VasteLastResponse>("/api/vaste-last-index");
  const { data: schuldData, loading: schuldLoading, error: schuldError } =
    useFetch<SchuldenResponse>("/api/schulden");

  const totaalSaldo = useMemo(() => {
    if (!txData?.transacties) return 0;
    return txData.transacties.reduce((sum, t) => sum + (t.bedrag ?? 0), 0);
  }, [txData]);

  const vasteLastenPerMaand = useMemo(() => {
    if (!vlData?.lijst) return 0;
    return vlData.lijst.reduce((sum, item) => sum + (item.bedrag ?? 0), 0);
  }, [vlData]);

  const openstaandeSchulden = useMemo(() => {
    if (!schuldData?.lijst) return 0;
    return schuldData.lijst.reduce((sum, item) => sum + (item.bedrag ?? 0), 0);
  }, [schuldData]);

  const aantalSchulden = schuldData?.lijst?.length ?? 0;

  const loading = txLoading || vlLoading || schuldLoading;
  const error = txError || vlError || schuldError;

  return (
    <DashboardCard title="Overzicht">
      {loading && <p>Bezig met laden...</p>}
      {error && <p className="text-red-400">Er is een fout opgetreden.</p>}
      {!loading && !error && (
        <div className="summary-grid">
          <SummaryTile
            label="Totaal saldo"
            value={formatEuro(totaalSaldo)}
            helper="Op basis van transacties"
          />
          <SummaryTile
            label="Vaste lasten per maand"
            value={formatEuro(vasteLastenPerMaand)}
            helper="Uit vaste lasten index"
          />
          <SummaryTile
            label="Openstaande schulden"
            value={formatEuro(openstaandeSchulden)}
            helper={`${aantalSchulden} lijnen`}
          />
        </div>
      )}
    </DashboardCard>
  );
}

function SummaryTile(props: { label: string; value: string; helper: string }) {
  const { label, value, helper } = props;
  return (
    <div className="summary-tile">
      <p className="summary-label">{label}</p>
      <p className="summary-value">{value}</p>
      <p className="summary-helper">{helper}</p>
    </div>
  );
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
}
