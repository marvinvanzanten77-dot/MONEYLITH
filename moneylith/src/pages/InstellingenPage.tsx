import { useEffect, useState } from "react";

type Regel = {
  id: number;
  naam: string;
  actief: number;
  rekening?: string | null;
  omschrijving_pattern?: string | null;
  min_bedrag?: number | null;
  max_bedrag?: number | null;
  categorie_actie?: string | null;
  markeer_vaste_last?: number | null;
  laatst_getriggerd_op?: string | null;
  aangemaakt_op?: string;
};

type FlagStore = Record<string, string>;

type Patroon = {
  categorie: string;
  totaal: number;
  redenering: string;
};

type VasteLast = {
  id: number;
  naam: string;
  bedrag: number;
  rekening?: string | null;
  frequentie?: string | null;
  omschrijving?: string | null;
  actief: number;
};

type Schuld = {
  id: number;
  naam: string;
  bedrag: number;
  rente?: number;
  maandbedrag?: number;
  looptijd?: string;
  status?: string;
};

const emptyForm: Omit<Regel, "id"> & { id?: number } = {
  naam: "",
  actief: 1,
  rekening: null,
  omschrijving_pattern: null,
  min_bedrag: null,
  max_bedrag: null,
  categorie_actie: null,
  markeer_vaste_last: null,
};

export function InstellingenPage() {
  const [regels, setRegels] = useState<Regel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [flags, setFlags] = useState<FlagStore | null>(null);
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [flagsError, setFlagsError] = useState<string | null>(null);
  const [flagsSaving, setFlagsSaving] = useState(false);

  const [patronen, setPatronen] = useState<Patroon[]>([]);
  const [patternLoading, setPatternLoading] = useState(true);
  const [patternError, setPatternError] = useState<string | null>(null);

  const [vasteLasten, setVasteLasten] = useState<VasteLast[]>([]);
  const [vlLoading, setVlLoading] = useState(true);
  const [vlError, setVlError] = useState<string | null>(null);
  const [vlForm, setVlForm] = useState<{
    naam: string;
    bedrag: string;
    frequentie: string;
    omschrijving: string;
    rekening: string;
    actief: boolean;
  }>({
    naam: "",
    bedrag: "",
    frequentie: "",
    omschrijving: "",
    rekening: "",
    actief: true,
  });

  const [schulden, setSchulden] = useState<Schuld[]>([]);
  const [schuldError, setSchuldError] = useState<string | null>(null);
  const [schuldUploading, setSchuldUploading] = useState(false);
  const [schuldMessage, setSchuldMessage] = useState<string | null>(null);
  const [schuldFile, setSchuldFile] = useState<File | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const resp = await fetch("/api/instellingen/regels");
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
          throw new Error(data.error || "Kon regels niet laden");
        }
        if (mounted) {
          setRegels(data.regels ?? []);
          setError(null);
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Onbekende fout");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadFlags = async () => {
      setFlagsLoading(true);
      setFlagsError(null);
      try {
        const resp = await fetch("/api/instellingen/flags");
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
          throw new Error(data.error || "Kon instellingen niet laden");
        }
        if (!cancelled) {
          setFlags(data.flags || {});
        }
      } catch (err) {
        if (!cancelled) {
          setFlagsError(err instanceof Error ? err.message : "Fout bij laden instellingen");
        }
      } finally {
        if (!cancelled) {
          setFlagsLoading(false);
        }
      }
    };
    loadFlags();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadPatterns = async () => {
      setPatternLoading(true);
      setPatternError(null);
      try {
        const resp = await fetch("/api/patronen/maand?year=2025&month=11");
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
          throw new Error(data.error || "Kon patronen niet laden");
        }
        if (!cancelled) {
          setPatronen(data.regels ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setPatternError(err instanceof Error ? err.message : "Fout bij laden patronen");
        }
      } finally {
        if (!cancelled) {
          setPatternLoading(false);
        }
      }
    };
    loadPatterns();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadVasteLasten = async () => {
      setVlLoading(true);
      setVlError(null);
      try {
        const resp = await fetch("/api/vaste-last-index");
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
          throw new Error(data.error || "Kon vaste lasten niet laden");
        }
        if (!cancelled) {
          setVasteLasten(data.lijst ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setVlError(err instanceof Error ? err.message : "Fout bij laden vaste lasten");
        }
      } finally {
        if (!cancelled) {
          setVlLoading(false);
        }
      }
    };
    loadVasteLasten();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadSchulden = async () => {
      try {
        const resp = await fetch("/api/schulden");
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
          throw new Error(data.error || "Kon schulden niet laden");
        }
        if (!cancelled) {
          setSchulden(data.lijst ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setSchuldError(err instanceof Error ? err.message : "Fout bij laden schulden");
        }
      }
    };
    loadSchulden();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (field: keyof typeof emptyForm, value: string | number | boolean | null) => {
    setForm((prev) => ({
      ...prev,
      [field]: typeof value === "string" && value.trim() === "" ? null : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.naam.trim()) {
      setSaveError("Naam is verplicht");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const payload = {
        id: editingId ?? undefined,
        naam: form.naam.trim(),
        actief: form.actief ? 1 : 0,
        rekening: form.rekening || null,
        omschrijving_pattern: form.omschrijving_pattern || null,
        min_bedrag: form.min_bedrag ?? null,
        max_bedrag: form.max_bedrag ?? null,
        categorie_actie: form.categorie_actie || null,
        markeer_vaste_last:
          form.markeer_vaste_last == null ? null : form.markeer_vaste_last ? 1 : 0,
      };
      const resp = await fetch("/api/instellingen/regels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        throw new Error(data.error || "Opslaan mislukt");
      }
      const regel: Regel = data.regel;
      setRegels((prev) =>
        editingId ? prev.map((item) => (item.id === regel.id ? regel : item)) : [regel, ...prev]
      );
      setEditingId(null);
      setForm(emptyForm);
    } catch (err) {
      console.error(err);
      setSaveError(err instanceof Error ? err.message : "Opslaan mislukt");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAutoRegels = async () => {
    if (!flags) return;
    const huidige = flags["regels_automatisch_toepassen"] === "1";
    const nieuw = huidige ? "0" : "1";
    setFlagsSaving(true);
    try {
      const resp = await fetch("/api/instellingen/flags/regels_automatisch_toepassen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: nieuw }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        throw new Error(data.error || "Kon instelling niet opslaan");
      }
      setFlags((prev) => ({ ...(prev ?? {}), regels_automatisch_toepassen: nieuw }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Fout bij opslaan instelling");
    } finally {
      setFlagsSaving(false);
    }
  };

  const handleVlSubmit = async () => {
    if (!vlForm.naam || !vlForm.bedrag) {
      return;
    }
    try {
      const resp = await fetch("/api/vaste-last-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naam: vlForm.naam,
          bedrag: Number(vlForm.bedrag),
          frequentie: vlForm.frequentie || null,
          omschrijving: vlForm.omschrijving || null,
          rekening: vlForm.rekening || null,
          actief: vlForm.actief ? 1 : 0,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) throw new Error(data.error || "Kon vaste last niet opslaan");
      setVasteLasten((prev) => [data.regel, ...prev]);
      setVlForm({
        naam: "",
        bedrag: "",
        frequentie: "",
        omschrijving: "",
        rekening: "",
        actief: true,
      });
    } catch (err) {
      setVlError(err instanceof Error ? err.message : "Fout bij opslaan vaste last");
    }
  };

  const handleSchuldUpload = async () => {
    if (!schuldFile) return;
    setSchuldError(null);
    setSchuldMessage(null);
    setSchuldUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", schuldFile);
      const resp = await fetch("/api/schulden/upload", {
        method: "POST",
        body: formData,
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) throw new Error(data.error || "Upload mislukt");
      setSchuldMessage(`Schulden geladen (${data.inserted ?? 0})`);
      const lijstResp = await fetch("/api/schulden");
      const lijstData = await lijstResp.json();
      if (!lijstResp.ok || !lijstData.ok) throw new Error(lijstData.error || "Kon schulden niet ophalen");
      setSchulden(lijstData.lijst ?? []);
    } catch (err) {
      setSchuldError(err instanceof Error ? err.message : "Upload mislukt");
    } finally {
      setSchuldUploading(false);
    }
  };

  const autoRegelsEnabled = flags?.["regels_automatisch_toepassen"] === "1";

  return (
    <section className="moneylith-card space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.45em] text-moneylith-muted">Instellingen</p>
        <h1 className="h1-label">Automatische regels & patronen</h1>
        <p className="text-moneylith-muted max-w-2xl">
          Alles in de stijl van Moneylith: donkere kaarten, afgeronde hoeken en zachte accenten.
        </p>
      </header>

      <div className="rounded-2xl border border-white/10 bg-[#050d18]/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Automatische regels toepassen</h2>
            <p className="text-sm text-moneylith-muted">
              Schakel uit als je eerst wilt controleren voordat regels automatisch worden toegekend.
            </p>
            {flagsError && <p className="text-xs text-red-400 mt-2">{flagsError}</p>}
          </div>
          <button
            type="button"
            onClick={toggleAutoRegels}
            disabled={flagsLoading || flagsSaving || !flags}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              autoRegelsEnabled
                ? "border-emerald-500 text-emerald-200 bg-emerald-500/10"
                : "border-slate-600 text-slate-300 bg-slate-800"
            }`}
          >
            {flagsLoading ? "Laden..." : autoRegelsEnabled ? "Aan" : "Uit"}
          </button>
        </div>
      </div>

      <form className="rounded-2xl border border-white/10 bg-[#050d18]/70 p-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-lg font-semibold">Regel bewerken / toevoegen</h2>
          <p className="text-sm text-moneylith-muted">Alle velden optioneel behalve Naam.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-moneylith-muted">
            Naam
            <input
              className="moneylith-input"
              value={form.naam}
              onChange={(event) => handleChange("naam", event.target.value)}
              required
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-moneylith-muted">
            <input
              type="checkbox"
              checked={form.actief === 1}
              onChange={(event) => setForm((prev) => ({ ...prev, actief: event.target.checked ? 1 : 0 }))}
            />
            Actief
          </label>
          <label className="flex flex-col gap-1 text-sm text-moneylith-muted">
            Rekening
            <input className="moneylith-input" value={form.rekening ?? ""} onChange={(event) => handleChange("rekening", event.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-moneylith-muted">
            Omschrijving bevat
            <input
              className="moneylith-input"
              value={form.omschrijving_pattern ?? ""}
              onChange={(event) => handleChange("omschrijving_pattern", event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-moneylith-muted">
            Bedrag van
            <input
              type="number"
              className="moneylith-input"
              value={form.min_bedrag ?? ""}
              onChange={(event) => handleChange("min_bedrag", event.target.value === "" ? null : Number(event.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-moneylith-muted">
            Bedrag tot
            <input
              type="number"
              className="moneylith-input"
              value={form.max_bedrag ?? ""}
              onChange={(event) => handleChange("max_bedrag", event.target.value === "" ? null : Number(event.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-moneylith-muted">
            Categorie actie
            <input
              className="moneylith-input"
              value={form.categorie_actie ?? ""}
              onChange={(event) => handleChange("categorie_actie", event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-moneylith-muted">
            <input
              type="checkbox"
              checked={form.markeer_vaste_last === 1}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  markeer_vaste_last: event.target.checked ? 1 : 0,
                }))
              }
            />
            Markeer als vaste last
          </label>
        </div>
        {saveError && <p className="text-sm text-red-400">{saveError}</p>}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="moneylith-pill moneylith-pill--primary" disabled={!form.naam.trim() || isSaving}>
            {editingId ? "Wijzigingen opslaan" : "Nieuwe regel opslaan"}
          </button>
          {editingId && (
            <button
              type="button"
              className="moneylith-pill moneylith-pill--ghost"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
                setSaveError(null);
              }}
            >
              Annuleren
            </button>
          )}
        </div>
      </form>

      <div className="rounded-2xl border border-white/10 bg-[#050d18]/70 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Overzicht van regels</h2>
          {deleteError && <p className="text-sm text-red-400">{deleteError}</p>}
        </div>
        {isLoading ? (
          <p className="text-sm text-moneylith-muted">Laden…</p>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-moneylith-muted">
                  <th className="py-2 pr-4">Actief</th>
                  <th className="py-2 pr-4">Naam</th>
                  <th className="py-2 pr-4">Rekening</th>
                  <th className="py-2 pr-4">Omschrijving</th>
                  <th className="py-2 pr-4">Bedrag</th>
                  <th className="py-2 pr-4">Actie</th>
                  <th className="py-2 pr-4">Acties</th>
                </tr>
              </thead>
              <tbody>
                {regels.map((regel) => (
                  <tr key={regel.id} className="border-t border-white/5">
                    <td className="py-3 pr-4">{regel.actief === 1 ? <span className="text-emerald-400">Ja</span> : <span className="text-red-400">Nee</span>}</td>
                    <td className="py-3 pr-4 font-semibold">{regel.naam}</td>
                    <td className="py-3 pr-4 text-moneylith-muted">{regel.rekening || "–"}</td>
                    <td className="py-3 pr-4 text-moneylith-muted">{regel.omschrijving_pattern || "–"}</td>
                    <td className="py-3 pr-4 text-moneylith-muted">
                      {regel.min_bedrag != null || regel.max_bedrag != null
                        ? `${regel.min_bedrag ?? "-"} tot ${regel.max_bedrag ?? "-"}`
                        : "–"}
                    </td>
                    <td className="py-3 pr-4 text-moneylith-muted">
                      {regel.categorie_actie ? `Categorie → ${regel.categorie_actie}` : "–"}{" "}
                      {regel.markeer_vaste_last !== null ? `· Vaste last → ${regel.markeer_vaste_last ? "Ja" : "Nee"}` : ""}
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        className="moneylith-pill moneylith-pill--ghost px-3 py-1 text-xs"
                        onClick={() => {
                          setEditingId(regel.id);
                          setForm({
                            id: regel.id,
                            naam: regel.naam,
                            actief: regel.actief,
                            rekening: regel.rekening ?? null,
                            omschrijving_pattern: regel.omschrijving_pattern ?? null,
                            min_bedrag: regel.min_bedrag ?? null,
                            max_bedrag: regel.max_bedrag ?? null,
                            categorie_actie: regel.categorie_actie ?? null,
                            markeer_vaste_last: regel.markeer_vaste_last ?? null,
                          });
                        }}
                      >
                        Bewerken
                      </button>
                      <button
                        type="button"
                        className="moneylith-pill moneylith-pill--ghost px-3 py-1 text-xs text-red-400"
                        onClick={async () => {
                          if (!window.confirm("Weet je zeker dat je deze regel wilt verwijderen?")) return;
                          setDeleteError(null);
                          try {
                            const resp = await fetch(`/api/instellingen/regels/${regel.id}`, { method: "DELETE" });
                            const data = await resp.json();
                            if (!resp.ok || !data.ok) throw new Error(data.error || "Verwijderen mislukt");
                            setRegels((prev) => prev.filter((item) => item.id !== regel.id));
                            if (editingId === regel.id) {
                              setEditingId(null);
                              setForm(emptyForm);
                            }
                          } catch (err) {
                            setDeleteError(err instanceof Error ? err.message : "Verwijderen mislukt");
                          }
                        }}
                      >
                        Verwijderen
                      </button>
                    </td>
                  </tr>
                ))}
                {regels.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-moneylith-muted">
                      Geen regels gevonden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#050d18]/70 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Patronen & visuele signalen</h2>
          <button
            type="button"
            className="moneylith-pill moneylith-pill--ghost text-xs px-3"
            onClick={async () => {
              setPatternLoading(true);
              setPatternError(null);
              try {
                const resp = await fetch("/api/patronen/maand?year=2025&month=11");
                const data = await resp.json();
                if (!resp.ok || !data.ok) throw new Error(data.error || "Kon patronen niet laden");
                setPatronen(data.regels ?? []);
              } catch (err) {
                setPatternError(err instanceof Error ? err.message : "Verversen mislukt");
              } finally {
                setPatternLoading(false);
              }
            }}
          >
            Vernieuwen
          </button>
        </div>
        {patternLoading ? (
          <p className="text-sm text-moneylith-muted">Laden…</p>
        ) : patternError ? (
          <p className="text-sm text-red-400">{patternError}</p>
        ) : (
          <div className="grid gap-3">
            {patronen.map((patroon) => (
              <article key={patroon.categorie} className="rounded-xl border border-white/5 bg-[#030b18]/80 p-3 text-sm text-moneylith-muted">
                <p className="text-base font-semibold text-white">{patroon.categorie}</p>
                <p className="text-xs">€{patroon.totaal.toFixed(2)}</p>
                <p className="text-xs text-moneylith-muted">{patroon.redenering}</p>
              </article>
            ))}
            {patronen.length === 0 && <p className="text-sm text-moneylith-muted">Nog geen patronen beschikbaar.</p>}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#050d18]/70 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Vaste lasten indexeren</h2>
          {vlError && <p className="text-sm text-red-400">{vlError}</p>}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="moneylith-input"
            placeholder="Naam"
            value={vlForm.naam}
            onChange={(event) => setVlForm((prev) => ({ ...prev, naam: event.target.value }))}
          />
          <input
            className="moneylith-input"
            placeholder="Bedrag"
            type="number"
            value={vlForm.bedrag}
            onChange={(event) => setVlForm((prev) => ({ ...prev, bedrag: event.target.value }))}
          />
          <input
            className="moneylith-input"
            placeholder="Frequentie"
            value={vlForm.frequentie}
            onChange={(event) => setVlForm((prev) => ({ ...prev, frequentie: event.target.value }))}
          />
          <input
            className="moneylith-input"
            placeholder="Rekening"
            value={vlForm.rekening}
            onChange={(event) => setVlForm((prev) => ({ ...prev, rekening: event.target.value }))}
          />
          <input
            className="moneylith-input"
            placeholder="Omschrijving"
            value={vlForm.omschrijving}
            onChange={(event) => setVlForm((prev) => ({ ...prev, omschrijving: event.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm text-moneylith-muted">
            <input
              type="checkbox"
              checked={vlForm.actief}
              onChange={(event) => setVlForm((prev) => ({ ...prev, actief: event.target.checked }))}
            />
            Actief
          </label>
        </div>
        <button
          type="button"
          className="moneylith-pill moneylith-pill--primary"
          onClick={handleVlSubmit}
          disabled={!vlForm.naam || !vlForm.bedrag}
        >
          Opslaan
        </button>
        <div className="mt-4 space-y-2">
          {vlLoading ? (
            <p className="text-sm text-moneylith-muted">Laden…</p>
          ) : (
            vasteLasten.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/5 bg-[#020b18]/80 px-4 py-2 text-sm flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{item.naam}</p>
                  <p className="text-moneylith-muted text-xs">
                    €{item.bedrag.toFixed(2)} • {item.frequentie || "Onbekend"}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${item.actief ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
                  {item.actief ? "actief" : "inactief"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#050d18]/70 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Schuldenlijst uploaden</h2>
          <div className="flex items-center gap-2">
            {schuldUploading && <span className="text-xs text-moneylith-muted">Uploaden…</span>}
            <button
              type="button"
              className="moneylith-pill moneylith-pill--ghost px-3 py-1 text-xs"
              onClick={handleSchuldUpload}
              disabled={schuldUploading || !schuldFile}
            >
              Upload CSV
            </button>
          </div>
        </div>
        <input type="file" accept=".csv" onChange={(event) => setSchuldFile(event.target.files?.[0] ?? null)} />
        {schuldError && <p className="text-xs text-red-400">{schuldError}</p>}
        {schuldMessage && <p className="text-xs text-emerald-400">{schuldMessage}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
                <tr className="text-moneylith-muted">
                  <th className="py-2 pr-4">Naam</th>
                  <th className="py-2 pr-4">Bedrag</th>
                  <th className="py-2 pr-4">Rente</th>
                  <th className="py-2 pr-4">Maand</th>
                  <th className="py-2 pr-4">Looptijd</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
            </thead>
            <tbody>
              {schulden.map((schuld) => (
                <tr key={schuld.id} className="border-t border-white/5">
                  <td className="py-3 pr-4">{schuld.naam}</td>
                  <td className="py-3 pr-4">€{schuld.bedrag.toFixed(2)}</td>
                  <td className="py-3 pr-4">{schuld.rente ?? "–"}%</td>
                  <td className="py-3 pr-4">€{schuld.maandbedrag?.toFixed(2) ?? "–"}</td>
                  <td className="py-3 pr-4">{schuld.looptijd || "–"}</td>
                  <td className="py-3 pr-4 text-moneylith-muted">{schuld.status || "–"}</td>
                </tr>
              ))}
              {schulden.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-moneylith-muted">
                    Nog geen schulden in de lijst.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
