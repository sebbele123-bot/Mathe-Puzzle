import React, { useMemo, useState, useCallback } from "react";
import { Play, X, ArrowRight, Star, Library, BookOpen, GitBranch } from "lucide-react";
import { CATALOG_BY_ID, FACH_COLOR, TYP_LABEL, TYP_COLOR, loadRotation, saveRotation } from "./data/catalog.js";
import { loadStats, strengthOf } from "./data/stats.js";

const C = { paper: "#EAEEF2", ink: "#1B2430", line: "#C4D0DB", rot: "#B26A1E", muted: "#5b6875" };

// Stärke-Skala: grau = ungeübt, rot → gelb → grün
const dotColor = (s) => (s == null ? "#C4D0DB" : s < 0.34 ? "#C4623E" : s < 0.67 ? "#C08A2E" : "#1F7A63");
const stufe = (s) => (s == null ? "neu" : s < 0.34 ? "schwach" : s < 0.67 ? "mittel" : "stark");

/* ====================================================================
 *  Training — die Übungen der Rotation.
 *  „starten“ zieht gewichtet zufällig (Schwächen häufiger).
 * ==================================================================== */
export default function Training({ onOpen, onStart, onBrowse }) {
  const [rotation, setRotation] = useState(() => loadRotation());
  const stats = loadStats();

  const remove = useCallback((id) => {
    setRotation((r) => { const next = r.filter((x) => x !== id); saveRotation(next); return next; });
  }, []);

  const items = useMemo(() => rotation.map((id) => CATALOG_BY_ID[id]).filter(Boolean), [rotation]);

  // schwächste zuerst — der Zug ist zufällig, die Liste zeigt den Bedarf
  const sorted = useMemo(() => {
    const rank = (c) => { const s = strengthOf(c.id, stats); return s == null ? -1 : s; };
    return [...items].sort((a, b) => rank(a) - rank(b));
  }, [items, stats]);

  const counts = useMemo(() => {
    const c = { neu: 0, schwach: 0, mittel: 0, stark: 0 };
    for (const it of items) c[stufe(strengthOf(it.id, stats))] += 1;
    return c;
  }, [items, stats]);

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100%", fontFamily: "system-ui, sans-serif" }} className="w-full">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <header className="mb-4">
          <div style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.18em" }} className="text-[11px] uppercase text-slate-500 mb-1">
            Rotation · {items.length}
          </div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl sm:text-4xl font-semibold leading-tight">Training</h1>
        </header>

        {items.length === 0 ? (
          <div className="rounded-2xl border flex flex-col items-center justify-center gap-3 py-10 px-6 text-center" style={{ background: "#fff", borderColor: C.line }}>
            <Star size={22} style={{ color: C.rot }} />
            <div className="text-sm text-slate-500" style={{ fontFamily: "Georgia, serif" }}>Die Rotation ist leer.</div>
            <button onClick={onBrowse}
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm"
              style={{ background: C.ink, color: "#fff", fontFamily: "ui-monospace, monospace" }}>
              <Library size={14} /> zur Bibliothek
            </button>
          </div>
        ) : (
          <>
            {/* Start + Stärke-Verteilung */}
            <section className="rounded-2xl border px-3 py-3 mb-4" style={{ background: "#fff", borderColor: "#E0B77A" }}>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={onStart}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
                  style={{ background: C.rot, color: "#fff", fontFamily: "ui-monospace, monospace", boxShadow: "0 2px 0 rgba(0,0,0,0.18)" }}>
                  <Play size={15} /> starten
                </button>
                <div className="flex items-center gap-2.5 flex-wrap ml-auto text-[11px]" style={{ fontFamily: "ui-monospace, monospace" }}>
                  {["neu", "schwach", "mittel", "stark"].map((k) => (
                    <span key={k} className="inline-flex items-center gap-1" style={{ color: C.muted }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: dotColor(k === "neu" ? null : k === "schwach" ? 0.1 : k === "mittel" ? 0.5 : 0.9) }} />
                      {k} {counts[k]}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Übungen der Rotation */}
            <div className="flex flex-col gap-2">
              {sorted.map((c) => {
                const s = strengthOf(c.id, stats);
                const st = stats[c.id];
                return (
                  <div key={c.id} className="rounded-xl border flex items-stretch overflow-hidden" style={{ background: "#fff", borderColor: C.line }}>
                    <button onClick={() => onOpen(c.mode, c.targetId)} className="shrink-0 flex items-center justify-center px-2.5"
                      style={{ minWidth: 56, background: `${FACH_COLOR[c.fach]}14`, borderRight: `1px solid ${C.line}` }}>
                      <span className="text-[11px] font-semibold text-center leading-tight" style={{ fontFamily: "ui-monospace, monospace", color: FACH_COLOR[c.fach] }}>{c.code}</span>
                    </button>
                    <button onClick={() => onOpen(c.mode, c.targetId)} className="flex-1 min-w-0 text-left px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span style={{ width: 8, height: 8, borderRadius: 99, background: dotColor(s), flexShrink: 0 }} title={stufe(s)} />
                        <span className="text-sm leading-snug truncate" style={{ fontFamily: "Georgia, serif" }}>{c.titel}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1 text-[10px]" style={{ fontFamily: "ui-monospace, monospace" }}>
                        <span className="inline-flex items-center gap-1" style={{ color: TYP_COLOR[c.typ] }}>
                          {c.typ === "beweis" ? <GitBranch size={10} /> : <BookOpen size={10} />}{TYP_LABEL[c.typ]}
                        </span>
                        <span style={{ color: C.muted }}>{stufe(s)}</span>
                        {st?.attempts ? <span style={{ color: "#9aa7b4" }}>{st.attempts}× · {st.failsTotal} Fehlversuche</span> : null}
                      </div>
                    </button>
                    <div className="shrink-0 flex flex-col border-l" style={{ borderColor: C.line }}>
                      <button onClick={() => remove(c.id)} title="aus der Rotation entfernen"
                        className="flex-1 flex items-center justify-center px-2.5 text-slate-400 hover:text-slate-700 transition-colors"
                        style={{ borderBottom: `1px solid ${C.line}` }}>
                        <X size={15} />
                      </button>
                      <button onClick={() => onOpen(c.mode, c.targetId)} title="öffnen"
                        className="flex-1 flex items-center justify-center px-2.5 text-slate-500 hover:text-slate-800 transition-colors">
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
