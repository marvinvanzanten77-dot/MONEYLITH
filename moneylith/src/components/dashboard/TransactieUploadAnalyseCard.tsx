import { useMemo, useState } from "react";
import { DashboardCard } from "./DashboardCard";
import type { RegelPatroon } from "../../core/dashboardTypes";

type PatronenResponse = { ok: boolean; regels: RegelPatroon[] };
type UploadResponse = { ok: boolean; inserted?: number; geimporteerd?: number; totaalInDb?: number; error?: string };

export function TransactieUploadAnalyseCard() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<RegelPatroon[] | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const endpointForFile = useMemo(() => {
    if (!file) return null;
    const ext = file.name.toLowerCase();
    if (ext.endsWith(".pdf")) return "/api/upload-transacties/pdf";
    return "/api/upload-transacties/csv";
  }, [file]);

  const handleUpload = async () => {
    if (!file || !endpointForFile) return;
    setUploading(true);
    setUploadMessage(null);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch(endpointForFile, {
        method: "POST",
        body: formData,
      });
      const data: UploadResponse = await resp.json().catch(() => ({ ok: false, error: "Onbekende fout" }));
      if (!resp.ok || data.ok === false) {
        throw new Error(data.error || "Er is een fout opgetreden bij het uploaden.");
      }
      const count = data.inserted ?? data.geimporteerd ?? 0;
      setUploadMessage(`Upload geslaagd. ${count} transacties verwerkt.`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Er is een fout opgetreden bij het uploaden.");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyse = async () => {
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      // Start analyse voor huidige maand via bestaand patroon-endpoint
      await fetch("/api/patronen/maand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: currentYear, month: currentMonth }),
      });
      // Ophalen resultaten
      const resp = await fetch(`/api/patronen/maand?year=${currentYear}&month=${currentMonth}`);
      const data: PatronenResponse = await resp.json();
      if (!resp.ok || data.ok === false) {
        throw new Error((data as PatronenResponse & { error?: string }).error || "Er is een fout opgetreden bij de analyse.");
      }
      setAnalysis(data.regels || []);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Er is een fout opgetreden bij de analyse.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <DashboardCard title="Transacties upload & analyse">
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm text-moneylith-muted" htmlFor="transactie-upload">
            Bestand uploaden (CSV of PDF)
          </label>
          <input
            id="transactie-upload"
            type="file"
            accept=".csv,.pdf,.txt"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-moneylith-muted"
          />
          <p className="text-xs text-moneylith-muted">
            {file ? `Gekozen: ${file.name}` : "Geen bestand gekozen."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!file || uploading}
            onClick={handleUpload}
            className="moneylith-pill moneylith-pill--primary disabled:opacity-50"
          >
            {uploading ? "Bezig met uploaden..." : "Upload transacties"}
          </button>
          <button
            type="button"
            disabled={analyzing}
            onClick={handleAnalyse}
            className="moneylith-pill moneylith-pill--ghost disabled:opacity-50"
          >
            {analyzing ? "Analyse wordt uitgevoerd..." : "Start analyse"}
          </button>
        </div>

        {uploadMessage && <p className="text-xs text-emerald-400">{uploadMessage}</p>}
        {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
        {analysisError && <p className="text-xs text-red-400">{analysisError}</p>}

        <div className="mt-3 rounded-lg border border-white/10 bg-[#0a1224] p-3 text-sm text-moneylith-muted">
          <p className="font-semibold text-white">Analyse resultaat</p>
          {analysis ? (
            analysis.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {analysis.map((regel) => (
                  <li key={regel.categorie} className="border-b border-white/5 pb-2 last:border-0">
                    <p className="text-white text-sm">{regel.categorie}</p>
                    <p className="text-xs text-moneylith-muted">Totaal: {formatEuro(regel.totaal)}</p>
                    <p className="text-xs text-moneylith-muted mt-1">{regel.redenering}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs">Nog geen analyse uitgevoerd.</p>
            )
          ) : (
            <p className="text-xs">Nog geen analyse uitgevoerd.</p>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value || 0);
}
