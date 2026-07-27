import React, { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Copy, Check, Hammer, Boxes } from "lucide-react";
import { SYM_BY_ID, symLabel } from "./data/symbols.js";
import { glyphWithLabel } from "./data/labels.js";
import { SYMBOL_TASK_BY_ID } from "./data/symboldefs.js";

/* ====================================================================
 *  Werkbank — Symbol-Crafting
 *  Frei: 8×12-Raster, Symbole aus der Hotbar, ergibt einen Ausdruck.
 *  Aufgabe: eine Definition aus ihren Symbol-Bausteinen zusammensetzen.
 * ==================================================================== */
const C = { paper: "#EAEEF2", ink: "#1B2430", line: "#C4D0DB", ziel: "#1F7A63", warn: "#B26A1E" };
const COLS = 8, ROWS = 10, N = COLS * ROWS;
const LS_KEY = "mp_werkbank_v2"; // v2: Zellen tragen { id, label }

export default function Werkbank({ hand, taskId, onOutcome, collection = [], training = false, vorgaben = 0 }) {
  const task = taskId ? SYMBOL_TASK_BY_ID[taskId] : null;
  if (task) return <TaskBench task={task} onOutcome={onOutcome} vorgaben={vorgaben} />;
  return <FreeBench hand={hand} collection={collection} training={training} />;
}

/* --- Aufgabe: Definition aus Symbol-Bausteinen zusammensetzen -------- */
const TASK_CELLS = 12;

// Vorgefertigte Teile: die ersten `n` nötigen Symbole liegen schon.
// Mindestens eines bleibt immer selbst zu legen.
const vorbelegt = (task, n) => {
  const cells = Array(TASK_CELLS).fill(null);
  const geben = Math.min(n || 0, Math.max(0, task.need.length - 1));
  for (let i = 0; i < geben; i++) cells[i] = task.need[i];
  return cells;
};

function TaskBench({ task, onOutcome, vorgaben = 0 }) {
  const [cells, setCells] = useState(() => vorbelegt(task, vorgaben));
  const [done, setDone] = useState(false);
  const [hint, setHint] = useState("");
  const fails = useRef(0);
  const reported = useRef(false);

  // Vorrat: nötige Bausteine + Distraktoren, stabil gemischt
  const pool = useMemo(() => {
    const all = [...task.need, ...task.distract];
    return all.map((id, i) => ({ id, k: (i * 7919) % all.length })).sort((a, b) => a.k - b.k).map((x) => x.id);
  }, [task]);

  useEffect(() => {
    setCells(vorbelegt(task, vorgaben)); setDone(false); setHint("");
    fails.current = 0; reported.current = false;
  }, [task.id, vorgaben]); // eslint-disable-line

  const placed = cells.filter(Boolean);
  const addSymbol = (id) => {
    if (done) return;
    setCells((c) => { const i = c.indexOf(null); if (i === -1) return c; const n = [...c]; n[i] = id; return n; });
    setHint("");
  };
  const clearCell = (i) => { if (!done) { setCells((c) => c.map((x, k) => (k === i ? null : x))); setHint(""); } };
  const clearAll = () => { if (!done) { setCells(Array(TASK_CELLS).fill(null)); setHint(""); } };

  const check = () => {
    if (done || !placed.length) return;
    const a = [...placed].sort().join("|");
    const b = [...task.need].sort().join("|");
    if (a === b) {
      setDone(true);
      if (!reported.current) { reported.current = true; onOutcome?.(task.id, fails.current); }
      return;
    }
    fails.current += 1;
    const missing = task.need.filter((n) => !placed.includes(n)).length;
    setHint(placed.length < task.need.length || missing
      ? "Das ist noch nicht die Definition — es fehlt etwas oder es ist zu viel dabei."
      : "Diese Zusammenstellung trifft die Definition nicht.");
  };

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100%", fontFamily: "system-ui, sans-serif" }} className="w-full">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <header className="mb-4">
          <div style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.18em" }} className="text-[11px] uppercase text-slate-500 mb-1">
            Werkbank · {task.ref}
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500">Bauen</span>
            <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl sm:text-4xl font-semibold leading-tight">{task.term}</h1>
          </div>
        </header>

        {/* Bauplatz */}
        <div className="rounded-2xl border-2 border-dashed p-2 mb-3" style={{ borderColor: done ? C.ziel : "#B7C3CF", background: done ? "rgba(31,122,99,0.06)" : "rgba(255,255,255,0.5)" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(72px, 1fr))`, gap: 5 }}>
            {cells.map((id, i) => {
              const s = id ? SYM_BY_ID[id] : null;
              return (
                <button key={i} onClick={() => clearCell(i)} title={s ? `${s.glyph} ${symLabel(s)}` : undefined}
                  className="rounded-lg flex flex-col items-center justify-center transition-all"
                  style={{ minHeight: 58, padding: "4px 2px",
                    background: s ? `linear-gradient(160deg, rgba(255,255,255,0.20), rgba(255,255,255,0)), ${s.color}` : "rgba(27,36,48,0.03)",
                    border: s ? "1px solid rgba(255,255,255,0.22)" : "1px dashed #C4D0DB",
                    color: "#fff", cursor: s && !done ? "pointer" : "default" }}>
                  {s ? (<>
                    <span style={{ fontFamily: "Georgia, serif", fontSize: 17, lineHeight: 1 }}>{s.glyph}</span>
                    <span style={{ fontSize: 7, opacity: 0.9, marginTop: 2, maxWidth: "100%" }} className="truncate px-0.5 text-center">{symLabel(s)}</span>
                  </>) : <span style={{ opacity: 0.16, fontSize: 12, color: C.ink }}>·</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Prüfen */}
        <div className="flex items-center gap-3 mb-4 min-h-[46px]">
          <button onClick={check} disabled={done || !placed.length}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium select-none"
            style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.04em",
              background: done || !placed.length ? "#C4D0DB" : C.ziel, color: done || !placed.length ? "#8595a4" : "#fff",
              cursor: done || !placed.length ? "default" : "pointer", boxShadow: done || !placed.length ? "none" : "0 2px 0 rgba(0,0,0,0.18)" }}>
            <Hammer size={16} /> Hammer
          </button>
          {!done && placed.length > 0 && (
            <button onClick={clearAll} className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors" style={{ fontFamily: "ui-monospace, monospace" }}>
              <RotateCcw size={12} /> leeren
            </button>
          )}
          {hint && !done && <p className="text-xs" style={{ color: C.warn }}>{hint}</p>}
        </div>

        {/* geschafft: kurze Beschreibung */}
        {done && (
          <div className="mb-4 rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: "rgba(31,122,99,0.10)", border: `1px solid ${C.ziel}` }}>
            <div className="mt-0.5 shrink-0 rounded-full p-1" style={{ background: C.ziel }}><Check size={14} color="#fff" /></div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500">Gebaut</span>
                <span style={{ fontFamily: "Georgia, serif", color: C.ziel }} className="text-lg font-semibold">{task.term}</span>
              </div>
              <p className="text-[15px] text-slate-800 mt-1.5 leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>{task.beschreibung}</p>
            </div>
          </div>
        )}

        {/* Vorrat */}
        {!done && (
          <section className="rounded-2xl p-3 border-2 border-dashed" style={{ borderColor: "#B7C3CF", background: "rgba(255,255,255,0.35)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span style={{ background: C.ziel, width: 10, height: 10, borderRadius: 3 }} />
              <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.12em" }} className="text-[11px] uppercase text-slate-500">Bausteine</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 6 }}>
              {pool.map((id) => {
                const s = SYM_BY_ID[id];
                if (!s) return null;
                const used = placed.filter((x) => x === id).length;
                return (
                  <button key={id} onClick={() => addSymbol(id)} title={`${s.glyph} ${symLabel(s)}`}
                    className="rounded-lg flex flex-col items-center justify-center transition-all"
                    style={{ minHeight: 58, padding: "5px 3px", color: "#fff", opacity: used ? 0.45 : 1,
                      background: `linear-gradient(160deg, rgba(255,255,255,0.20), rgba(255,255,255,0)), ${s.color}`,
                      border: "1px solid rgba(255,255,255,0.18)", cursor: "pointer",
                      boxShadow: "0 2px 0 rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25)" }}>
                    <span style={{ fontFamily: "Georgia, serif", fontSize: 18, lineHeight: 1 }}>{s.glyph}</span>
                    <span style={{ fontSize: 7.5, opacity: 0.9, marginTop: 2, maxWidth: "100%" }} className="truncate px-0.5 text-center">{symLabel(s)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* --- Freies Symbol-Crafting (8×12) ---------------------------------- */
function FreeBench({ hand, collection = [], training = false }) {
  const [cells, setCells] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      // auf die aktuelle Rasterhöhe bringen (gekürzt/aufgefüllt), statt zu verwerfen
      if (Array.isArray(s)) return Array.from({ length: N }, (_, i) => s[i] ?? null);
    } catch { /* ignore */ }
    return Array(N).fill(null);
  });
  const [sel, setSel] = useState(0);
  const [copied, setCopied] = useState(false);
  // „an die Werkbank setzen": das gesamte Inventar liegt unter der Werkbank
  // in Reichweite. Im Training ist es von vornherein aufgeklappt.
  const [sitting, setSitting] = useState(training);
  const gridRef = useRef(null);

  useEffect(() => { if (training) setSitting(true); }, [training]);

  useEffect(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(cells)); } catch { /* ignore */ } }, [cells]);

  const active = hand?.id ? SYM_BY_ID[hand.id] : null;

  const setCell = (i, val) => setCells((c) => c.map((x, k) => (k === i ? val : x)));
  // die Hand stempelt Baustein + aktuelles Etikett
  const place = (i) => { if (active) { setCell(i, { id: active.id, label: hand.label ?? null }); return true; } return false; };
  const nextEmptyAfter = (i) => {
    for (let k = i + 1; k < N; k++) if (!cells[k]) return k;
    return Math.min(i + 1, N - 1);
  };

  const clickCell = (i) => {
    setSel(i);
    if (cells[i]) setCell(i, null);          // gefüllt → leeren
    else if (active) { place(i); setSel(nextEmptyAfter(i)); } // leer → Hand-Baustein setzen
  };

  // aus dem Inventar unter der Werkbank direkt in die gewählte Zelle setzen
  const placeFromLager = (id) => {
    setCell(sel, { id, label: null });
    setSel(nextEmptyAfter(sel));
  };

  const clearAll = () => setCells(Array(N).fill(null));

  // gesammelte Bausteine in Inventar-Reihenfolge
  const lager = useMemo(
    () => collection.map((id) => SYM_BY_ID[id]).filter(Boolean),
    [collection]
  );

  // Ausdruck = Zeichen in Lesereihenfolge (leere Zellen übersprungen)
  const expr = useMemo(
    () => cells.map((c) => (c ? glyphWithLabel(SYM_BY_ID[c.id], c.label) : null)).filter(Boolean).join(" "),
    [cells]
  );
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
                <span style={{ fontFamily: "Georgia, serif", fontSize: 18, color: active.color }}>{glyphWithLabel(active, hand?.label)}</span>
                <span className="text-xs text-slate-600">{symLabel(active)}</span>
              </>
            ) : (
              <span className="text-xs text-slate-400">—</span>
            )}
          </span>
          <button
            onClick={() => setSitting((s) => !s)}
            aria-pressed={sitting}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] transition-colors border"
            style={{
              fontFamily: "ui-monospace, monospace",
              background: sitting ? C.ink : "rgba(255,255,255,0.6)",
              color: sitting ? "#fff" : C.ink,
              borderColor: sitting ? C.ink : "#B7C3CF",
            }}>
            <Boxes size={12} /> {sitting ? "aufstehen" : "an die Werkbank setzen"}
          </button>
          <button onClick={clearAll} className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors" style={{ fontFamily: "ui-monospace, monospace" }}>
            <RotateCcw size={12} /> leeren
          </button>
        </div>

        {/* 8×12-Raster */}
        <div ref={gridRef} className="rounded-2xl border-2 p-2 mb-3" style={{ borderColor: C.line, background: "rgba(255,255,255,0.5)" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 4 }}>
            {cells.map((cell, i) => {
              const s = cell ? SYM_BY_ID[cell.id] : null;
              const shown = s ? glyphWithLabel(s, cell.label) : null;
              const isSel = i === sel;
              return (
                <button key={i} onClick={() => clickCell(i)}
                  title={s ? `${shown} ${symLabel(s)} — tippen leert` : (active ? `${glyphWithLabel(active, hand?.label)} setzen` : "leer")}
                  className="relative rounded-md flex items-center justify-center transition-all"
                  style={{
                    aspectRatio: "1 / 1", minWidth: 0,
                    background: s ? `linear-gradient(160deg, rgba(255,255,255,0.20), rgba(255,255,255,0)), ${s.color}` : "rgba(27,36,48,0.04)",
                    border: isSel ? "2px solid #1B2430" : `1px solid ${s ? "rgba(255,255,255,0.25)" : C.line}`,
                    color: "#fff", cursor: "pointer",
                  }}>
                  {s ? <span style={{ fontFamily: "Georgia, serif", fontSize: "clamp(11px, 3vw, 17px)", lineHeight: 1 }}>{shown}</span>
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

        {/* An der Werkbank: das gesamte Inventar in Reichweite, kleiner Abstand */}
        {sitting && (
          <div className="mt-3 rounded-2xl border p-2" style={{ borderColor: C.line, background: "rgba(255,255,255,0.5)" }}>
            <div className="flex items-center gap-2 px-1 pb-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500" style={{ fontFamily: "ui-monospace, monospace" }}>Inventar</span>
              <span className="text-[10px] text-slate-400" style={{ fontFamily: "ui-monospace, monospace" }}>{lager.length}</span>
            </div>
            {lager.length === 0 ? (
              <p className="text-sm text-slate-400 text-center px-6 py-4" style={{ fontFamily: "Georgia, serif" }}>
                Dein Inventar ist leer.
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(50px, 1fr))", gap: 4 }}>
                {lager.map((s) => (
                  <button key={s.id} onClick={() => placeFromLager(s.id)}
                    title={`${s.glyph} ${symLabel(s)} — in Zelle ${sel + 1} setzen`}
                    className="rounded-md flex flex-col items-center justify-center transition-all"
                    style={{ minHeight: 44, padding: "3px 1px", color: "#fff",
                      background: `linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0)), ${s.color}`,
                      border: "1px solid rgba(255,255,255,0.18)", cursor: "pointer" }}>
                    <span style={{ fontFamily: "Georgia, serif", fontSize: 16, lineHeight: 1, maxWidth: "100%" }} className="truncate px-0.5">{s.glyph}</span>
                    <span style={{ fontSize: 7, opacity: 0.85, marginTop: 1, maxWidth: "100%" }} className="truncate px-0.5 text-center">{symLabel(s)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
