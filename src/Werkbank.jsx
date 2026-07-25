import React, { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Copy, Check } from "lucide-react";
import { SYM_BY_ID, symLabel } from "./data/symbols.js";

/* ====================================================================
 *  Werkbank — Symbol-Crafting
 *  8×12-Raster. In jede Zelle kommt ein Symbol-Baustein (aus der Hotbar).
 *  Reihenweise gelesen ergeben die Zellen einen Ausdruck.
 * ==================================================================== */
const C = { paper: "#EAEEF2", ink: "#1B2430", line: "#C4D0DB", ziel: "#1F7A63" };
const COLS = 8, ROWS = 12, N = COLS * ROWS;
const LS_KEY = "mp_werkbank_v1";

export default function Werkbank({ activeSymbolId }) {
  const [cells, setCells] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      if (Array.isArray(s) && s.length === N) return s;
    } catch { /* ignore */ }
    return Array(N).fill(null);
  });
  const [sel, setSel] = useState(0);
  const [copied, setCopied] = useState(false);
  const gridRef = useRef(null);

  useEffect(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(cells)); } catch { /* ignore */ } }, [cells]);

  const active = activeSymbolId ? SYM_BY_ID[activeSymbolId] : null;

  const setCell = (i, val) => setCells((c) => c.map((x, k) => (k === i ? val : x)));
  const place = (i) => { if (active) { setCell(i, active.id); return true; } return false; };
  const nextEmptyAfter = (i) => {
    for (let k = i + 1; k < N; k++) if (!cells[k]) return k;
    return Math.min(i + 1, N - 1);
  };

  const clickCell = (i) => {
    setSel(i);
    if (cells[i]) setCell(i, null);          // gefüllt → leeren
    else if (active) { place(i); setSel(nextEmptyAfter(i)); } // leer → aktives Symbol setzen
  };

  const clearAll = () => setCells(Array(N).fill(null));

  // Ausdruck = Glyphen in Lesereihenfolge (leere Zellen übersprungen)
  const expr = useMemo(() => cells.map((id) => (id ? SYM_BY_ID[id]?.glyph : null)).filter(Boolean).join(" "), [cells]);
  const filledCount = cells.filter(Boolean).length;

  const copyExpr = () => {
    try { navigator.clipboard?.writeText(expr); } catch { /* ignore */ }
    setCopied(true); setTimeout(() => setCopied(false), 1200);
  };

  // Tastatur: Pfeile bewegen die Auswahl, Enter/Leer stempelt, Backspace löscht
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight") { setSel((s) => Math.min(N - 1, s + 1)); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { setSel((s) => Math.max(0, s - 1)); e.preventDefault(); }
      else if (e.key === "ArrowDown") { setSel((s) => Math.min(N - 1, s + COLS)); e.preventDefault(); }
      else if (e.key === "ArrowUp") { setSel((s) => Math.max(0, s - COLS)); e.preventDefault(); }
      else if (e.key === "Enter" || e.key === " ") {
        setSel((s) => {
          if (cells[s]) { setCell(s, null); return s; }
          if (active) { place(s); return nextEmptyAfter(s); }
          return s;
        });
        e.preventDefault();
      } else if (e.key === "Backspace" || e.key === "Delete") {
        setSel((s) => { setCell(s, null); return e.key === "Backspace" ? Math.max(0, s - 1) : s; });
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cells, active]); // eslint-disable-line

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100%", fontFamily: "system-ui, sans-serif" }} className="w-full">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        {/* Kopf */}
        <header className="mb-4">
          <div style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.18em" }} className="text-[11px] uppercase text-slate-500 mb-1">
            Symbol-Crafting · {COLS}×{ROWS}
          </div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl sm:text-4xl font-semibold leading-tight">Werkbank</h1>
        </header>

        {/* aktives Symbol + Ausdruck */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[11px] uppercase tracking-wider text-slate-500" style={{ fontFamily: "ui-monospace, monospace" }}>aktiv</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 border" style={{ background: "#fff", borderColor: active ? active.color : C.line, minHeight: 30 }}>
            {active ? (
              <>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 18, color: active.color }}>{active.glyph}</span>
                <span className="text-xs text-slate-600">{symLabel(active)}</span>
              </>
            ) : (
              <span className="text-xs text-slate-400">—</span>
            )}
          </span>
          <button onClick={clearAll} className="ml-auto inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors" style={{ fontFamily: "ui-monospace, monospace" }}>
            <RotateCcw size={12} /> leeren
          </button>
        </div>

        {/* 8×12-Raster */}
        <div ref={gridRef} className="rounded-2xl border-2 p-2 mb-3" style={{ borderColor: C.line, background: "rgba(255,255,255,0.5)" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 4 }}>
            {cells.map((id, i) => {
              const s = id ? SYM_BY_ID[id] : null;
              const isSel = i === sel;
              return (
                <button key={i} onClick={() => clickCell(i)}
                  title={s ? `${s.glyph} ${symLabel(s)} — tippen leert` : (active ? `${active.glyph} setzen` : "leer")}
                  className="relative rounded-md flex items-center justify-center transition-all"
                  style={{
                    aspectRatio: "1 / 1", minWidth: 0,
                    background: s ? `linear-gradient(160deg, rgba(255,255,255,0.20), rgba(255,255,255,0)), ${s.color}` : "rgba(27,36,48,0.04)",
                    border: isSel ? "2px solid #1B2430" : `1px solid ${s ? "rgba(255,255,255,0.25)" : C.line}`,
                    color: "#fff", cursor: "pointer",
                  }}>
                  {s ? <span style={{ fontFamily: "Georgia, serif", fontSize: "clamp(13px, 3.6vw, 20px)", lineHeight: 1 }}>{s.glyph}</span>
                     : <span style={{ opacity: 0.18, fontSize: 12, color: C.ink }}>·</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ausdruck-Vorschau */}
        <div className="rounded-xl border px-3 py-2.5 flex items-center gap-2" style={{ background: "#fff", borderColor: C.line }}>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 shrink-0" style={{ fontFamily: "ui-monospace, monospace" }}>Ausdruck</span>
          <span className="flex-1 min-w-0 truncate" style={{ fontFamily: "Georgia, serif", fontSize: 18 }}>
            {expr || <span className="text-slate-300">— leer —</span>}
          </span>
          <span className="text-[10px] text-slate-400 shrink-0" style={{ fontFamily: "ui-monospace, monospace" }}>{filledCount}</span>
          <button onClick={copyExpr} disabled={!expr} title="Ausdruck kopieren"
            className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs border transition-colors"
            style={{ borderColor: C.line, background: expr ? "#fff" : "#f1f4f7", color: expr ? C.ink : "#9aa7b4", cursor: expr ? "pointer" : "default" }}>
            {copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "kopiert" : "kopieren"}
          </button>
        </div>
      </div>
    </div>
  );
}
