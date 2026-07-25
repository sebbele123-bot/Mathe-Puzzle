import React, { useMemo, useState, useCallback } from "react";
import { Search, X, ArrowRight, Plus, Check, BookOpen, GitBranch, Play, Star, SlidersHorizontal, ChevronDown } from "lucide-react";
import {
  CATALOG_SORTED, FAECHER, TYPEN, FACH_LABEL, FACH_COLOR, TYP_LABEL, TYP_COLOR,
  ALL_TAGS, countBy, loadRotation, saveRotation,
} from "./data/catalog.js";

const C = { paper: "#EAEEF2", ink: "#1B2430", line: "#C4D0DB", muted: "#5b6875" };
const FACH_COUNTS = countBy("fach");
const TYP_COUNTS = countBy("typ");

/* ====================================================================
 *  Bibliothek — ein Verzeichnis über alles Material mit Filtern.
 *  onOpen(mode, targetId) springt in die passende Ansicht und lädt sie.
 * ==================================================================== */
export default function Bibliothek({ onOpen }) {
  const [fach, setFach] = useState(null);
  const [typ, setTyp] = useState(null);
  const [tag, setTag] = useState(null);
  const [query, setQuery] = useState("");
  const [rotOnly, setRotOnly] = useState(false);
  const [rotation, setRotation] = useState(() => loadRotation());
  const [filtersOpen, setFiltersOpen] = useState(false); // Filterbereich standardmäßig zugeklappt
  const [collapsedFach, setCollapsedFach] = useState({}); // eingeklappte Fach-Abschnitte in der Liste
  const toggleFach = useCallback((id) => setCollapsedFach((c) => ({ ...c, [id]: !c[id] })), []);

  const inRot = useCallback((id) => rotation.includes(id), [rotation]);
  const toggleRot = useCallback((id) => {
    setRotation((r) => {
      const next = r.includes(id) ? r.filter((x) => x !== id) : [...r, id];
      saveRotation(next);
      return next;
    });
  }, []);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    return CATALOG_SORTED.filter((c) => {
      if (fach && c.fach !== fach) return false;
      if (typ && c.typ !== typ) return false;
      if (tag && !c.tags.includes(tag)) return false;
      if (rotOnly && !rotation.includes(c.id)) return false;
      if (q) {
        const hay = `${c.titel} ${c.code} ${c.quelle} ${c.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [fach, typ, tag, q, rotOnly, rotation]);

  // nach Fach → Quelle gruppieren (Fach-Reihenfolge aus FAECHER)
  const groups = useMemo(() => {
    const out = [];
    for (const f of FAECHER) {
      const items = results.filter((c) => c.fach === f.id);
      if (!items.length) continue;
      const perQuelle = [];
      const seen = new Map();
      for (const it of items) {
        if (!seen.has(it.quelle)) { seen.set(it.quelle, perQuelle.length); perQuelle.push({ quelle: it.quelle, items: [] }); }
        perQuelle[seen.get(it.quelle)].items.push(it);
      }
      out.push({ fach: f, quellen: perQuelle });
    }
    return out;
  }, [results]);

  const rotItems = useMemo(() => CATALOG_SORTED.filter((c) => rotation.includes(c.id)), [rotation]);
  const anyFilter = fach || typ || tag || rotOnly || q;
  const activeCount = [fach, typ, tag, rotOnly].filter(Boolean).length;

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100%", fontFamily: "system-ui, sans-serif" }} className="w-full">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        {/* Kopf */}
        <header className="mb-4">
          <div style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.18em" }} className="text-[11px] uppercase text-slate-500 mb-1">
            Bibliothek · alles Material
          </div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl sm:text-4xl font-semibold leading-tight">Bibliothek</h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Definitionen, Beweise und Aufgaben über alle Fächer. Filtern, öffnen — oder mit <b>+</b> in die <b>Rotation</b> legen und gezielt üben.
          </p>
        </header>

        {/* Suche */}
        <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 border mb-3" style={{ background: "#fff", borderColor: "#B7C3CF" }}>
          <Search size={14} className="text-slate-400 shrink-0" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="suchen … (Titel, Kürzel, Stichwort)"
            className="bg-transparent outline-none text-sm flex-1 min-w-0" style={{ fontFamily: "ui-monospace, monospace" }} />
          {query && <button onClick={() => setQuery("")} className="shrink-0 text-slate-400"><X size={13} /></button>}
        </div>

        {/* Filter — standardmäßig zugeklappt, spart Platz. Aktive Filter als Kurz-Chips. */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => setFiltersOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs border transition-colors"
              style={{ fontFamily: "ui-monospace, monospace", background: filtersOpen ? C.ink : "#fff", color: filtersOpen ? "#fff" : C.ink, borderColor: filtersOpen ? C.ink : C.line }}>
              <SlidersHorizontal size={13} /> Filter{activeCount ? ` · ${activeCount}` : ""}
              <ChevronDown size={13} style={{ transform: filtersOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            {/* aktive Filter als entfernbare Chips (auch bei zugeklapptem Panel sichtbar) */}
            {fach && <SummaryChip color={FACH_COLOR[fach]} label={FACH_LABEL[fach]} onClear={() => setFach(null)} />}
            {typ && <SummaryChip color={TYP_COLOR[typ]} label={TYP_LABEL[typ]} onClear={() => setTyp(null)} />}
            {tag && <SummaryChip color={C.ink} label={tag} onClear={() => setTag(null)} />}
            {rotOnly && <SummaryChip color="#B26A1E" label="Rotation" onClear={() => setRotOnly(false)} icon={<Star size={10} />} />}
          </div>

          {filtersOpen && (
            <div className="rounded-xl border mt-2 p-2.5 flex flex-col gap-2.5" style={{ background: "#fff", borderColor: C.line }}>
              <FilterGroup label="Fächer">
                <Chip active={!fach} onClick={() => setFach(null)} label="alle" />
                {FAECHER.map((f) => (
                  <Chip key={f.id} active={fach === f.id} color={f.color} onClick={() => setFach((x) => (x === f.id ? null : f.id))}
                    label={f.label} count={FACH_COUNTS[f.id] || 0} />
                ))}
              </FilterGroup>
              <FilterGroup label="Typen">
                <Chip active={!typ} onClick={() => setTyp(null)} label="alle" />
                {TYPEN.filter((t) => TYP_COUNTS[t.id]).map((t) => (
                  <Chip key={t.id} active={typ === t.id} color={t.color} onClick={() => setTyp((x) => (x === t.id ? null : t.id))}
                    label={t.label} count={TYP_COUNTS[t.id]} />
                ))}
                <span className="mx-0.5 self-center" style={{ width: 1, height: 16, background: C.line }} />
                <Chip active={rotOnly} color="#B26A1E" onClick={() => setRotOnly((v) => !v)}
                  icon={<Star size={11} />} label="Rotation" count={rotation.length} />
              </FilterGroup>
              {ALL_TAGS.length > 0 && (
                <FilterGroup label="Themen">
                  {ALL_TAGS.map((t) => (
                    <Chip key={t} small active={tag === t} onClick={() => setTag((x) => (x === t ? null : t))} label={t} />
                  ))}
                </FilterGroup>
              )}
              {anyFilter && (
                <button onClick={() => { setFach(null); setTyp(null); setTag(null); setRotOnly(false); setQuery(""); }}
                  className="self-start text-[11px] underline text-slate-500" style={{ fontFamily: "ui-monospace, monospace" }}>alle Filter zurücksetzen</button>
              )}
            </div>
          )}
        </div>

        {/* Rotation-Schnellstart */}
        {rotItems.length > 0 && !rotOnly && (
          <section className="rounded-xl px-3 py-2.5 mb-4 mt-1" style={{ background: "rgba(178,106,30,0.08)", border: "1px solid #E0B77A" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Star size={13} style={{ color: "#B26A1E" }} />
              <span className="text-[11px] uppercase tracking-wider" style={{ fontFamily: "ui-monospace, monospace", color: "#8a531a" }}>Deine Rotation · {rotItems.length}</span>
              <button onClick={() => onOpen(rotItems[0].mode, rotItems[0].targetId)}
                className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs" style={{ background: "#B26A1E", color: "#fff", fontFamily: "ui-monospace, monospace" }}>
                <Play size={12} /> starten
              </button>
            </div>
            <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {rotItems.map((c) => (
                <button key={c.id} onClick={() => onOpen(c.mode, c.targetId)} title={c.titel}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs border" style={{ background: "#fff", borderColor: "#E0B77A", fontFamily: "ui-monospace, monospace" }}>
                  <span style={{ color: FACH_COLOR[c.fach] }}>{c.code}</span>
                  <span className="max-w-[120px] truncate" style={{ fontFamily: "Georgia, serif" }}>{c.titel}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Ergebnis-Zähler + Filter zurücksetzen */}
        <div className="flex items-center gap-2 mb-2 text-[11px] text-slate-500" style={{ fontFamily: "ui-monospace, monospace" }}>
          <span>{results.length} Einträge</span>
          {anyFilter && (
            <button onClick={() => { setFach(null); setTyp(null); setTag(null); setRotOnly(false); setQuery(""); }}
              className="inline-flex items-center gap-1 underline">Filter zurücksetzen</button>
          )}
        </div>

        {/* Gruppierte Liste */}
        {groups.length === 0 && (
          <div className="text-sm text-slate-400 py-8 text-center" style={{ fontFamily: "Georgia, serif" }}>Nichts gefunden.</div>
        )}
        {groups.map((g) => {
          const isCollapsed = !!collapsedFach[g.fach.id];
          const n = g.quellen.reduce((s, qg) => s + qg.items.length, 0);
          return (
          <section key={g.fach.id} className="mb-4">
            <button onClick={() => toggleFach(g.fach.id)} className="flex items-center gap-2 w-full text-left mb-2 hover:opacity-70 transition-opacity">
              <ChevronDown size={15} className="text-slate-500 shrink-0" style={{ transform: isCollapsed ? "rotate(-90deg)" : "none", transition: "transform .2s" }} />
              <span style={{ width: 10, height: 10, borderRadius: 3, background: g.fach.color }} />
              <h2 className="text-base font-semibold" style={{ fontFamily: "Georgia, serif" }}>{g.fach.label}</h2>
              <span className="text-[11px] text-slate-400">{n}</span>
            </button>
            {!isCollapsed && g.quellen.map((qg) => (
              <div key={qg.quelle} className="mb-3 ml-1">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 ml-0.5" style={{ fontFamily: "ui-monospace, monospace" }}>{qg.quelle}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {qg.items.map((c) => (
                    <ItemCard key={c.id} item={c} inRot={inRot(c.id)} onToggleRot={() => toggleRot(c.id)} onOpen={() => onOpen(c.mode, c.targetId)} />
                  ))}
                </div>
              </div>
            ))}
          </section>
          );
        })}
      </div>
    </div>
  );
}

function ItemCard({ item, inRot, onToggleRot, onOpen }) {
  const fc = FACH_COLOR[item.fach];
  const tc = TYP_COLOR[item.typ];
  return (
    <div className="rounded-xl border flex items-stretch overflow-hidden" style={{ background: "#fff", borderColor: inRot ? "#E0B77A" : C.line }}>
      {/* Kürzel-Badge */}
      <button onClick={onOpen} className="shrink-0 flex items-center justify-center px-2.5" style={{ minWidth: 56, background: `${fc}14`, borderRight: `1px solid ${C.line}` }}>
        <span className="text-[11px] font-semibold text-center leading-tight" style={{ fontFamily: "ui-monospace, monospace", color: fc }}>{item.code}</span>
      </button>
      {/* Inhalt */}
      <button onClick={onOpen} className="flex-1 min-w-0 text-left px-3 py-2">
        <div className="text-sm leading-snug" style={{ fontFamily: "Georgia, serif" }}>{item.titel}</div>
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          <span className="inline-flex items-center gap-1 text-[10px]" style={{ fontFamily: "ui-monospace, monospace", color: tc }}>
            {item.typ === "beweis" ? <GitBranch size={10} /> : <BookOpen size={10} />}{TYP_LABEL[item.typ]}
          </span>
          {item.hatBegriffscheck && (
            <span className="inline-flex items-center gap-1 text-[10px]" style={{ fontFamily: "ui-monospace, monospace", color: "#6B4E9E" }}>
              <BookOpen size={10} /> Begriffs-Check
            </span>
          )}
          {item.tags.map((t) => (
            <span key={t} className="text-[9.5px] rounded px-1 py-0.5" style={{ background: "#EEF2F6", color: C.muted, fontFamily: "ui-monospace, monospace" }}>{t}</span>
          ))}
        </div>
      </button>
      {/* Aktionen */}
      <div className="shrink-0 flex flex-col border-l" style={{ borderColor: C.line }}>
        <button onClick={onToggleRot} title={inRot ? "aus Rotation entfernen" : "zur Rotation hinzufügen"}
          className="flex-1 flex items-center justify-center px-2.5 transition-colors"
          style={{ background: inRot ? "#B26A1E" : "#fff", color: inRot ? "#fff" : "#B26A1E", borderBottom: `1px solid ${C.line}` }}>
          {inRot ? <Check size={15} /> : <Plus size={15} />}
        </button>
        <button onClick={onOpen} title="öffnen" className="flex-1 flex items-center justify-center px-2.5 text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 w-12 text-[10px] uppercase tracking-wider text-slate-400" style={{ fontFamily: "ui-monospace, monospace" }}>{label}</span>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-1 min-w-0" style={{ scrollbarWidth: "none" }}>{children}</div>
    </div>
  );
}

function SummaryChip({ color = "#1B2430", label, onClear, icon }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full pl-2 pr-1 py-0.5 text-[11px] border" style={{ fontFamily: "ui-monospace, monospace", background: color, color: "#fff", borderColor: color }}>
      {icon}{label}
      <button onClick={onClear} aria-label="Filter entfernen" className="rounded-full p-0.5" style={{ background: "rgba(255,255,255,0.2)" }}><X size={10} /></button>
    </span>
  );
}

function Chip({ active, color = "#1B2430", onClick, label, count, icon, small }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border transition-colors ${small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"}`}
      style={{ fontFamily: "ui-monospace, monospace",
        background: active ? color : "#fff", color: active ? "#fff" : C.ink,
        borderColor: active ? color : "#C4D0DB" }}>
      {icon}{label}
      {typeof count === "number" && (
        <span className="rounded-full px-1 text-[9px]" style={{ background: active ? "rgba(255,255,255,0.25)" : "#EEF2F6", color: active ? "#fff" : C.muted }}>{count}</span>
      )}
    </button>
  );
}
