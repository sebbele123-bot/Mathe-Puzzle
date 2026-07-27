import React, { useMemo, useState, useEffect } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Check, BookOpen } from "lucide-react";
import { DEFINITIONS, DEF_BY_ID, DEF_THEMES } from "./data/definitions.js";
import { loadRotation, saveRotation } from "./data/catalog.js";
import { splitDefinition } from "./data/defsatz.js";

const C = { paper: "#EAEEF2", ink: "#1B2430", line: "#C4D0DB", begriff: "#6B4E9E", ziel: "#1F7A63" };
const THEME_COLOR = ["#31597F", "#6B4E9E", "#1F7A63", "#B26A1E", "#2E6B7D"];

/* ====================================================================
 *  Steckbrief — Lese-Ansicht einer Kern-Definition.
 *  Blättern durch alle Definitionen, in die Rotation legbar.
 * ==================================================================== */
export default function Steckbrief({ defId, onBack, onReview }) {
  const startIdx = Math.max(0, DEFINITIONS.findIndex((d) => d.id === defId));
  const [idx, setIdx] = useState(startIdx);
  const d = DEFINITIONS[idx] || DEF_BY_ID[defId] || DEFINITIONS[0];
  const color = THEME_COLOR[d.t] || C.begriff;

  // jede angezeigte Definition als "gesehen" werten (fließt in die Rotations-Gewichtung)
  useEffect(() => { if (d) onReview?.(d.id); }, [d?.id]); // eslint-disable-line

  const [rotation, setRotation] = useState(() => loadRotation());
  const rotId = `defcard:${d.id}`;
  const inRot = rotation.includes(rotId);
  const toggleRot = () => setRotation((r) => {
    const next = r.includes(rotId) ? r.filter((x) => x !== rotId) : [...r, rotId];
    saveRotation(next);
    return next;
  });

  const go = (delta) => setIdx((i) => Math.min(DEFINITIONS.length - 1, Math.max(0, i + delta)));

  // Definitionen desselben Themas für die Sprungleiste
  const sameTheme = useMemo(() => DEFINITIONS.filter((x) => x.t === d.t), [d.t]);

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100%", fontFamily: "system-ui, sans-serif" }} className="w-full">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        {/* Kopfzeile: zurück + blättern */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm border" style={{ background: "#fff", borderColor: C.line, fontFamily: "ui-monospace, monospace" }}>
            <ArrowLeft size={14} /> Bibliothek
          </button>
          <span className="ml-auto text-[11px] text-slate-500" style={{ fontFamily: "ui-monospace, monospace" }}>{idx + 1} / {DEFINITIONS.length}</span>
          <button onClick={() => go(-1)} disabled={idx === 0} className="rounded-lg p-1.5 border disabled:opacity-40" style={{ background: "#fff", borderColor: C.line }}><ChevronLeft size={16} /></button>
          <button onClick={() => go(1)} disabled={idx === DEFINITIONS.length - 1} className="rounded-lg p-1.5 border disabled:opacity-40" style={{ background: "#fff", borderColor: C.line }}><ChevronRight size={16} /></button>
        </div>

        {/* Karte */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: C.line }}>
          <div className="px-4 py-3 flex items-center gap-2 flex-wrap" style={{ background: `${color}12`, borderBottom: `1px solid ${C.line}` }}>
            <span className="inline-flex items-center justify-center rounded-lg text-[12px] font-semibold px-2 py-1" style={{ fontFamily: "ui-monospace, monospace", background: color, color: "#fff" }}>D{d.nr}</span>
            <span className="text-[11px] uppercase tracking-wider" style={{ fontFamily: "ui-monospace, monospace", color }}>{d.thema}</span>
            {d.uebung && <span className="text-[11px] text-slate-500" style={{ fontFamily: "ui-monospace, monospace" }}>· {d.uebung}</span>}
          </div>

          <div className="px-4 py-4">
            <div className="flex items-start gap-2 mb-2">
              <BookOpen size={18} style={{ color }} className="mt-1 shrink-0" />
              <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl sm:text-3xl font-semibold leading-tight">{d.term}</h1>
            </div>
            {/* Definitionszeichen zwischen Definiendum und Aussage:
                „s := symmetrische …", nicht „:= s: symmetrische …" */}
            {(() => {
              const { definiendum, definiens } = splitDefinition(d.statement);
              return (
                <div className="mt-3">
                  <div className="text-[8px] uppercase tracking-wider text-slate-400 mb-0.5" style={{ fontFamily: "ui-monospace, monospace" }}>Definition</div>
                  <div className="flex items-baseline gap-2">
                    {definiendum && (
                      <span className="shrink-0 text-base sm:text-lg text-slate-800" style={{ fontFamily: "Georgia, serif" }}>{definiendum}</span>
                    )}
                    <span className="shrink-0 text-xl" style={{ color, fontFamily: "ui-monospace, monospace" }}>:=</span>
                    <p className="text-base sm:text-lg text-slate-800" style={{ fontFamily: "Georgia, serif", lineHeight: 1.5 }}>{definiens}</p>
                  </div>
                </div>
              );
            })()}

            {d.tags?.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-4">
                {d.tags.map((t) => (
                  <span key={t} className="text-[10px] rounded px-1.5 py-0.5" style={{ background: "#EEF2F6", color: "#5b6875", fontFamily: "ui-monospace, monospace" }}>{t}</span>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderTop: `1px solid ${C.line}` }}>
            <button onClick={toggleRot}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm border transition-colors"
              style={{ fontFamily: "ui-monospace, monospace",
                background: inRot ? "#B26A1E" : "#fff", color: inRot ? "#fff" : "#B26A1E",
                borderColor: inRot ? "#B26A1E" : "#E0B77A" }}>
              {inRot ? <><Check size={14} /> in Rotation</> : <><Plus size={14} /> in Rotation</>}
            </button>
          </div>
        </div>

        {/* Sprungleiste: Definitionen desselben Themas */}
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5" style={{ fontFamily: "ui-monospace, monospace" }}>{DEF_THEMES[d.t]}</div>
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {sameTheme.map((x) => {
              const on = x.id === d.id;
              return (
                <button key={x.id} onClick={() => setIdx(DEFINITIONS.findIndex((y) => y.id === x.id))} title={x.term}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs border transition-colors"
                  style={{ fontFamily: "ui-monospace, monospace", background: on ? color : "#fff", color: on ? "#fff" : C.ink, borderColor: on ? color : C.line }}>
                  <b>D{x.nr}</b>
                  <span className="max-w-[130px] truncate" style={{ fontFamily: "Georgia, serif" }}>{x.term}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
