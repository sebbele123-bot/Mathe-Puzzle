import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Grid3x3 } from "lucide-react";
import { PALETTE_CATEGORIES, PALETTE_META, DE } from "./data/openmath.js";
import { CAT_COLOR } from "./OpenMathPalette.jsx";

/* ====================================================================
 *  Minecraft-artiges Inventar
 *  - Hotbar mit 8 Slots, wählbar über Tasten 1–8 (oder Tippen)
 *  - Volles Inventar per Taste E (oder Button) — Baustein antippen legt
 *    ihn in den aktiven Slot
 *  - Slot antippen kopiert sein Zeichen
 * ==================================================================== */

const C = { ink: "#1B2430", paper: "#EAEEF2" };
const SLOTS = 8;
const LS_KEY = "mp_hotbar_v2"; // v2: startet leer (kein Auto-Auffüllen)

// flache Bausteinliste mit id + Farbe
const ALL = PALETTE_CATEGORIES.flatMap((c) =>
  c.symbols.map((s) => ({ ...s, id: `${s.cd}.${s.name}`, color: CAT_COLOR[c.id] || "#31597F" }))
);
const BY_ID = Object.fromEntries(ALL.map((s) => [s.id, s]));
const deLabel = (s) => DE[s.id] || s.name;

// Inventar startet leer — der Spieler sammelt seine Bausteine selbst ein.
const DEFAULT_HOTBAR = Array(SLOTS).fill(null);

export default function Inventory() {
  const [hotbar, setHotbar] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      if (Array.isArray(saved) && saved.length === SLOTS) return saved;
    } catch { /* ignore */ }
    return DEFAULT_HOTBAR.slice();
  });
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [hovered, setHovered] = useState(null); // Item-id, über dem der Zeiger schwebt (Desktop)
  const [focusIdx, setFocusIdx] = useState(0); // Tastatur-Fokus im Raster (Pfeiltasten)
  const toastTimer = useRef(null);
  const pressTimer = useRef(null);
  const longRef = useRef(false);
  const gridRef = useRef(null);
  const focusRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(hotbar)); } catch { /* ignore */ }
  }, [hotbar]);

  const flash = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1200);
  };

  const copySlot = (i) => {
    const b = BY_ID[hotbar[i]];
    if (!b) return;
    try { navigator.clipboard?.writeText(b.glyph); } catch { /* ignore */ }
    flash(`${b.glyph} kopiert`);
  };
  const selectSlot = (i) => { setActive(i); };
  const assignTo = (i, blockId) => {
    setHotbar((h) => h.map((x, k) => (k === i ? blockId : x)));
    flash(`${BY_ID[blockId].glyph} → Slot ${i + 1}`);
  };
  const assign = (blockId) => assignTo(active, blockId);
  // schnelles Einsammeln: in den ersten freien Slot; sonst aktiven Slot + weiterrücken
  const quickMove = (blockId) => {
    let idx = hotbar.indexOf(null);
    if (idx === -1) { idx = active; setActive((active + 1) % SLOTS); }
    setHotbar((h) => h.map((x, k) => (k === idx ? blockId : x)));
    flash(`${BY_ID[blockId].glyph} eingesammelt → Slot ${idx + 1}`);
  };
  const clearSlot = (i) => setHotbar((h) => h.map((x, k) => (k === i ? null : x)));

  // Langdruck (Mobil) = einsammeln; unterdrückt den folgenden Klick
  const startPress = (id) => {
    longRef.current = false;
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => { longRef.current = true; quickMove(id); }, 420);
  };
  const endPress = () => clearTimeout(pressTimer.current);
  const itemClick = (e, id) => {
    if (longRef.current) { longRef.current = false; return; } // Langdruck hat schon eingesammelt
    if (e.shiftKey) quickMove(id); else assign(id);
  };

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return ALL;
    return ALL.filter((s) => s.name.toLowerCase().includes(q) || s.glyph.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q) || deLabel(s).toLowerCase().includes(q));
  }, [q]);

  // aktuelle Spaltenzahl des Rasters (für Pfeil-hoch/runter)
  const cols = () => {
    const el = gridRef.current;
    if (!el) return 1;
    const tc = getComputedStyle(el).gridTemplateColumns;
    return Math.max(1, tc.split(" ").filter(Boolean).length);
  };

  // Tastatur: 1–8 wählt Slot, E öffnet/schließt, Pfeile navigieren, Enter legt ab
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "Escape" && open) { setOpen(false); e.preventDefault(); return; } // schließt immer, auch aus dem Suchfeld
      // Pfeiltasten / Enter steuern das offene Raster (auch aus dem Suchfeld heraus)
      if (open && results.length) {
        if (e.key === "ArrowRight") { setFocusIdx((k) => Math.min(results.length - 1, k + 1)); e.preventDefault(); return; }
        if (e.key === "ArrowLeft")  { setFocusIdx((k) => Math.max(0, k - 1)); e.preventDefault(); return; }
        if (e.key === "ArrowDown")  { const n = cols(); setFocusIdx((k) => Math.min(results.length - 1, k + n)); e.preventDefault(); return; }
        if (e.key === "ArrowUp")    { const n = cols(); setFocusIdx((k) => Math.max(0, k - n)); e.preventDefault(); return; }
        if (e.key === "Enter") {
          const s = results[focusIdx];
          if (s) { if (e.shiftKey) quickMove(s.id); else assign(s.id); }
          e.preventDefault(); return;
        }
        // 1–8 legt das fokussierte (oder überschwebte) Item in genau diesen Slot —
        // funktioniert auch aus dem Suchfeld, damit das Auswählen flüssig bleibt.
        if (e.key >= "1" && e.key <= String(SLOTS)) {
          const s = hovered ? { id: hovered } : results[focusIdx];
          if (s) assignTo(Number(e.key) - 1, s.id);
          e.preventDefault(); return;
        }
      }
      if (typing) return; // ab hier keine Tipp-Tasten abfangen
      if (e.key >= "1" && e.key <= String(SLOTS)) {
        setActive(Number(e.key) - 1); // Inventar zu: Ziffer wählt aktiven Slot
        e.preventDefault();
      } else if (e.key === "e" || e.key === "E") { setOpen((o) => !o); e.preventDefault(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hovered, hotbar, active, results, focusIdx]); // eslint-disable-line

  // Fokus zurücksetzen, wenn sich Suche ändert oder das Inventar öffnet
  useEffect(() => { setFocusIdx(0); }, [q, open]);
  // fokussiertes Item ins Sichtfeld scrollen
  useEffect(() => { focusRef.current?.scrollIntoView({ block: "nearest" }); }, [focusIdx]);

  return (
    <>
      {/* Hotbar (fix am unteren Rand) */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 45, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
        <div className="flex items-end gap-2 px-3 py-2" style={{ pointerEvents: "auto" }}>
          <div className="flex gap-1.5 rounded-xl p-1.5" style={{ background: "rgba(27,36,48,0.86)", backdropFilter: "blur(6px)", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
            {hotbar.map((id, i) => {
              const b = id ? BY_ID[id] : null;
              const isActive = i === active;
              return (
                <button key={i}
                  onClick={() => (isActive ? copySlot(i) : selectSlot(i))}
                  onContextMenu={(e) => { e.preventDefault(); clearSlot(i); }}
                  title={b ? `${b.glyph} ${deLabel(b)} — Slot ${i + 1} (Taste ${i + 1}); klicken kopiert` : `Slot ${i + 1} — leer`}
                  className="relative rounded-lg flex items-center justify-center transition-all"
                  style={{
                    width: 46, height: 46,
                    background: b ? `linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0)), ${b.color}` : "rgba(255,255,255,0.06)",
                    border: isActive ? "2px solid #fff" : "2px solid rgba(255,255,255,0.12)",
                    color: "#fff", cursor: "pointer",
                  }}>
                  <span style={{ position: "absolute", top: 1, left: 3, fontSize: 8, opacity: 0.7, fontFamily: "ui-monospace, monospace" }}>{i + 1}</span>
                  {b ? <span style={{ fontFamily: "Georgia, serif", fontSize: 18, lineHeight: 1 }}>{b.glyph}</span>
                     : <span style={{ opacity: 0.3, fontSize: 16 }}>·</span>}
                </button>
              );
            })}
          </div>
          <button onClick={() => setOpen((o) => !o)} title="Inventar öffnen (Taste E)"
            className="rounded-lg flex flex-col items-center justify-center px-2.5"
            style={{ height: 58, background: "rgba(27,36,48,0.86)", color: "#fff", backdropFilter: "blur(6px)", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
            <Grid3x3 size={16} />
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 8, marginTop: 2 }}>E</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 78, zIndex: 46, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <span className="rounded-full px-3 py-1 text-xs" style={{ background: "rgba(27,36,48,0.92)", color: "#fff", fontFamily: "ui-monospace, monospace" }}>{toast}</span>
        </div>
      )}

      {/* Volles Inventar (E) */}
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(20,26,34,0.55)", backdropFilter: "blur(2px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-2xl"
            style={{ maxWidth: 900, maxHeight: "82vh", background: C.paper, boxShadow: "0 -8px 40px rgba(0,0,0,0.35)", display: "flex", flexDirection: "column" }}>
            {/* Kopf */}
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "#C4D0DB" }}>
              <span style={{ fontFamily: "Georgia, serif", color: C.ink }} className="text-base font-semibold">Inventar</span>
              <span className="text-[11px] text-slate-500" style={{ fontFamily: "ui-monospace, monospace" }}>· {PALETTE_META.count} Bausteine · Klick → Slot <b>{active + 1}</b> · Halten/Shift → einsammeln</span>
              <div className="ml-auto flex items-center gap-2 rounded-lg px-2.5 py-1.5 border" style={{ background: "#fff", borderColor: "#B7C3CF" }}>
                <Search size={14} className="text-slate-400" />
                <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="suchen …"
                  className="bg-transparent outline-none text-sm" style={{ fontFamily: "ui-monospace, monospace", width: 130 }} />
              </div>
              <button onClick={() => setOpen(false)} aria-label="schließen" className="rounded-lg p-1.5 hover:bg-slate-200 transition-colors"><X size={16} /></button>
            </div>

            {/* aktive Slots-Vorschau */}
            <div className="flex gap-1.5 px-4 py-2 border-b overflow-x-auto" style={{ borderColor: "#C4D0DB" }}>
              {hotbar.map((id, i) => {
                const b = id ? BY_ID[id] : null;
                return (
                  <button key={i} onClick={() => setActive(i)} title={`Slot ${i + 1} wählen`}
                    className="relative rounded-md flex items-center justify-center shrink-0"
                    style={{ width: 38, height: 38, background: b ? b.color : "#dfe5ea", border: i === active ? "2px solid #1B2430" : "2px solid transparent", color: "#fff", cursor: "pointer" }}>
                    <span style={{ position: "absolute", top: 0, left: 2, fontSize: 7, opacity: 0.7, fontFamily: "ui-monospace, monospace" }}>{i + 1}</span>
                    {b && <span style={{ fontFamily: "Georgia, serif", fontSize: 15 }}>{b.glyph}</span>}
                  </button>
                );
              })}
            </div>

            {/* Baustein-Raster */}
            <div ref={gridRef} className="overflow-y-auto p-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: 5 }}>
              {results.map((s, i) => {
                const focused = i === focusIdx;
                return (
                <button key={s.id}
                  ref={focused ? focusRef : null}
                  onClick={(e) => itemClick(e, s.id)}
                  onPointerDown={() => startPress(s.id)}
                  onPointerUp={endPress}
                  onPointerEnter={() => { setHovered(s.id); setFocusIdx(i); }}
                  onPointerLeave={() => { endPress(); setHovered((h) => (h === s.id ? null : h)); }}
                  onContextMenu={(e) => e.preventDefault()}
                  title={`${s.glyph} ${deLabel(s)} — Klick: Slot ${active + 1} · Shift/Halten: einsammeln`}
                  className="rounded-lg flex flex-col items-center justify-center transition-all"
                  style={{ minHeight: 52, padding: "5px 2px", color: "#fff",
                    background: `linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0)), ${s.color}`,
                    border: (hovered === s.id || focused) ? "2px solid #fff" : "1px solid rgba(255,255,255,0.18)",
                    outline: focused ? "2px solid rgba(255,255,255,0.55)" : "none", outlineOffset: 1,
                    cursor: "pointer", touchAction: "none" }}>
                  <span style={{ fontFamily: "Georgia, serif", fontSize: 18, lineHeight: 1 }}>{s.glyph}</span>
                  <span style={{ fontSize: 7.5, opacity: 0.85, marginTop: 2, maxWidth: "100%" }} className="truncate px-0.5 text-center">{deLabel(s)}</span>
                </button>
                );
              })}
              {results.length === 0 && <span className="text-sm text-slate-400 p-2" style={{ fontFamily: "Georgia, serif" }}>Nichts gefunden.</span>}
            </div>

            <div className="px-4 py-2 border-t text-[11px] text-slate-500" style={{ borderColor: "#C4D0DB", fontFamily: "ui-monospace, monospace" }}>
              Navigieren: <b>Pfeiltasten</b> · <b>Enter</b> → Slot {active + 1} (Shift+Enter → einsammeln) · <b>Taste 1–8</b> → in genau diesen Slot. Maus: Klick → aktiver Slot · <b>gedrückt halten</b>/​<b>Shift+Klick</b> → einsammeln.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
