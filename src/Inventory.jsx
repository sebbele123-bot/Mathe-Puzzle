import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Grid3x3, Plus } from "lucide-react";
import { PALETTE_CATEGORIES } from "./data/openmath.js";
import { CAT_COLOR } from "./OpenMathPalette.jsx";
import { SYM_ALL, SYM_BY_ID, symLabel } from "./data/symbols.js";

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

// gemeinsame Symbolliste (mit Inventar-Werkbank geteilt)
const ALL = SYM_ALL;
const BY_ID = SYM_BY_ID;
const deLabel = symLabel;
// kurze Kategorie-Etiketten für die Filter-Chips
const CATS = PALETTE_CATEGORIES.map((c) => ({
  id: c.id,
  title: c.title.replace(/\s*\(.*?\)\s*/g, "").trim(),
  color: CAT_COLOR[c.id] || "#31597F",
  n: c.symbols.length,
}));

// Inventar startet leer — der Spieler sammelt seine Bausteine selbst ein.
const DEFAULT_HOTBAR = Array(SLOTS).fill(null);

export default function Inventory({ onActive, collection = [], onDiscard, onBrowse }) {
  const [hotbar, setHotbar] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      if (Array.isArray(saved) && saved.length === SLOTS) return saved;
    } catch { /* ignore */ }
    return DEFAULT_HOTBAR.slice();
  });
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState(null); // aktive Kategorie-Filterung (null = alle)
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

  // aktives Symbol nach außen melden (z. B. an die Werkbank zum Stempeln)
  useEffect(() => { onActive?.(hotbar[active] ?? null); }, [hotbar, active, onActive]);

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

  // nur die gesammelten Bausteine (Minecraft-Lager) — nicht der ganze Katalog
  const owned = useMemo(() => collection.map((id) => BY_ID[id]).filter(Boolean), [collection]);
  // Kategorie-Chips nur für vorhandene Kategorien
  const ownedCats = useMemo(() => {
    const present = new Set(owned.map((s) => s.cat));
    return CATS.filter((c) => present.has(c.id));
  }, [owned]);

  const results = useMemo(() => (cat ? owned.filter((s) => s.cat === cat) : owned), [cat, owned]);

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

  // Fokus zurücksetzen, wenn sich Suche/Kategorie ändert oder das Inventar öffnet
  useEffect(() => { setFocusIdx(0); }, [cat, open]);
  // fokussiertes Item ins Sichtfeld scrollen
  useEffect(() => { focusRef.current?.scrollIntoView({ block: "nearest" }); }, [focusIdx]);

  return (
    <>
      {/* Hotbar (fix am unteren Rand) — passt sich der Bildschirmbreite an */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 45, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
        <div className="flex items-end gap-1.5 px-2 py-2" style={{ pointerEvents: "auto", width: "min(100vw, 520px)" }}>
          {/* 8 gleich breite Slots, die zusammen schrumpfen statt abgeschnitten zu werden */}
          <div className="rounded-xl p-1" style={{ flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4, background: "rgba(27,36,48,0.86)", backdropFilter: "blur(6px)", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
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
                    width: "100%", aspectRatio: "1 / 1", minWidth: 0,
                    background: b ? `linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0)), ${b.color}` : "rgba(255,255,255,0.06)",
                    border: isActive ? "2px solid #fff" : "2px solid rgba(255,255,255,0.12)",
                    color: "#fff", cursor: "pointer",
                  }}>
                  <span style={{ position: "absolute", top: 0, left: 2, fontSize: 7, opacity: 0.7, fontFamily: "ui-monospace, monospace" }}>{i + 1}</span>
                  {b ? <span style={{ fontFamily: "Georgia, serif", fontSize: "clamp(13px, 4vw, 18px)", lineHeight: 1 }}>{b.glyph}</span>
                     : <span style={{ opacity: 0.3, fontSize: 14 }}>·</span>}
                </button>
              );
            })}
          </div>
          <button onClick={() => setOpen((o) => !o)} title="Inventar öffnen (Taste E)"
            className="rounded-lg flex flex-col items-center justify-center shrink-0"
            style={{ width: 46, height: 52, background: "rgba(27,36,48,0.86)", color: "#fff", backdropFilter: "blur(6px)", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
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
            style={{ maxWidth: 900, height: "90vh", maxHeight: "90vh", background: C.paper, boxShadow: "0 -8px 40px rgba(0,0,0,0.35)", display: "flex", flexDirection: "column" }}>
            {/* Kopf: Titel + Schließen, darunter volle Suchzeile */}
            <div className="px-3 pt-2.5 pb-2 border-b" style={{ borderColor: "#C4D0DB" }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontFamily: "Georgia, serif", color: C.ink }} className="text-base font-semibold">Inventar</span>
                <span className="hidden sm:inline text-[11px] text-slate-500" style={{ fontFamily: "ui-monospace, monospace" }}>· {owned.length} gesammelt · Klick → Slot <b>{active + 1}</b></span>
                <button onClick={() => { setOpen(false); onBrowse?.(); }} title="in den Bausteinen sammeln"
                  className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs border transition-colors"
                  style={{ fontFamily: "ui-monospace, monospace", background: "#fff", borderColor: "#B7C3CF", color: C.ink }}>
                  <Plus size={13} /> sammeln
                </button>
                <button onClick={() => setOpen(false)} aria-label="schließen" className="rounded-lg p-1.5 hover:bg-slate-200 transition-colors"><X size={16} /></button>
              </div>
            </div>

            {/* Kategorie-Chips — nur für Kategorien, die im Lager vorkommen */}
            {ownedCats.length > 0 && (
              <div className="flex gap-1.5 px-3 py-2 border-b overflow-x-auto" style={{ borderColor: "#C4D0DB", scrollbarWidth: "none" }}>
                <button onClick={() => setCat(null)}
                  className="shrink-0 rounded-full px-2.5 py-1 text-[11px] transition-colors border"
                  style={{ fontFamily: "ui-monospace, monospace",
                    background: cat === null ? C.ink : "#fff", color: cat === null ? "#fff" : C.ink,
                    borderColor: cat === null ? C.ink : "#C4D0DB" }}>alle</button>
                {ownedCats.map((c) => (
                  <button key={c.id} onClick={() => setCat((x) => (x === c.id ? null : c.id))}
                    title={c.title}
                    className="shrink-0 rounded-full pl-1.5 pr-2.5 py-1 text-[11px] transition-colors border flex items-center gap-1.5"
                    style={{ fontFamily: "ui-monospace, monospace",
                      background: cat === c.id ? c.color : "#fff", color: cat === c.id ? "#fff" : C.ink,
                      borderColor: cat === c.id ? c.color : "#C4D0DB" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: c.color, display: "inline-block", opacity: cat === c.id ? 0 : 1 }} />
                    {c.title}
                  </button>
                ))}
              </div>
            )}

            {/* aktive Slots-Vorschau (kompakt) */}
            <div className="flex gap-1 px-3 py-1.5 border-b overflow-x-auto" style={{ borderColor: "#C4D0DB", scrollbarWidth: "none" }}>
              {hotbar.map((id, i) => {
                const b = id ? BY_ID[id] : null;
                return (
                  <button key={i} onClick={() => setActive(i)} title={`Slot ${i + 1} wählen`}
                    className="relative rounded-md flex items-center justify-center shrink-0"
                    style={{ width: 32, height: 32, background: b ? b.color : "#dfe5ea", border: i === active ? "2px solid #1B2430" : "2px solid transparent", color: "#fff", cursor: "pointer" }}>
                    <span style={{ position: "absolute", top: -1, left: 2, fontSize: 7, opacity: 0.7, fontFamily: "ui-monospace, monospace" }}>{i + 1}</span>
                    {b && <span style={{ fontFamily: "Georgia, serif", fontSize: 14 }}>{b.glyph}</span>}
                  </button>
                );
              })}
            </div>

            {/* leeres Lager: freundlicher Hinweis + Sammeln-Knopf */}
            {owned.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="grid" style={{ gridTemplateColumns: "repeat(4, 44px)", gap: 6 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-md" style={{ width: 44, height: 44, background: "rgba(27,36,48,0.04)", border: "1px dashed #C4D0DB" }} />
                  ))}
                </div>
                <div className="text-sm text-slate-500" style={{ fontFamily: "Georgia, serif" }}>Dein Inventar ist leer.</div>
                <button onClick={() => { setOpen(false); onBrowse?.(); }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm" style={{ background: C.ink, color: "#fff", fontFamily: "ui-monospace, monospace" }}>
                  <Plus size={14} /> Bausteine sammeln
                </button>
                <div className="text-[11px] text-slate-400" style={{ fontFamily: "ui-monospace, monospace" }}>In den <b>Bausteinen</b> ein Symbol mit <b>+</b> einsammeln — es landet hier.</div>
              </div>
            ) : (
              <>
                {/* Lager-Raster: gesammelte Bausteine + leere Slots (Truhen-Optik) */}
                <div ref={gridRef} className="overflow-y-auto p-2 flex-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(50px, 1fr))", gridAutoRows: 52, alignContent: "start", gap: 4 }}>
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
                      onContextMenu={(e) => { e.preventDefault(); onDiscard?.(s.id); flash(`${s.glyph} abgelegt`); }}
                      title={`${s.glyph} ${deLabel(s)} — Klick: Slot ${active + 1} · Shift/Halten: einsammeln · Rechtsklick: ablegen`}
                      className="rounded-md flex flex-col items-center justify-center transition-all"
                      style={{ minHeight: 44, padding: "3px 1px", color: "#fff",
                        background: `linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0)), ${s.color}`,
                        border: (hovered === s.id || focused) ? "2px solid #fff" : "1px solid rgba(255,255,255,0.18)",
                        outline: focused ? "2px solid rgba(255,255,255,0.55)" : "none", outlineOffset: 1,
                        cursor: "pointer", touchAction: "none" }}>
                      <span style={{ fontFamily: "Georgia, serif", fontSize: 16, lineHeight: 1 }}>{s.glyph}</span>
                      <span style={{ fontSize: 7, opacity: 0.85, marginTop: 1, maxWidth: "100%" }} className="truncate px-0.5 text-center">{deLabel(s)}</span>
                    </button>
                    );
                  })}
                  {/* leere Slots zum Auffüllen (nur in der ungefilterten Gesamtansicht) */}
                  {!cat && Array.from({ length: Math.max(0, 24 - results.length) }).map((_, i) => (
                    <button key={`empty-${i}`} onClick={() => { setOpen(false); onBrowse?.(); }} title="leerer Slot — sammeln"
                      className="rounded-md" style={{ minHeight: 44, background: "rgba(27,36,48,0.035)", border: "1px dashed #C4D0DB", cursor: "pointer" }} />
                  ))}
                  {results.length === 0 && <span className="text-sm text-slate-400 p-2" style={{ fontFamily: "Georgia, serif" }}>Nichts gefunden.</span>}
                </div>

                <div className="px-4 py-2 border-t text-[11px] text-slate-500" style={{ borderColor: "#C4D0DB", fontFamily: "ui-monospace, monospace" }}>
                  <b>Pfeiltasten</b> navigieren · <b>Enter</b> → Slot {active + 1} · <b>Taste 1–8</b> → in diesen Slot · <b>Rechtsklick</b>/Kontextmenü → ablegen. Neue Bausteine per <b>+ sammeln</b>.
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
