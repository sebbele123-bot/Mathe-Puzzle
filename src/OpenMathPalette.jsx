import React, { useMemo, useState } from "react";
import { Search, Check, Copy, ChevronDown } from "lucide-react";
import { PALETTE_CATEGORIES, PALETTE_META } from "./data/openmath.js";

/* --- Farbwelt (konsistent mit dem Baukasten) ----------------------- */
const C = { paper: "#EAEEF2", dot: "#C4D0DB", ink: "#1B2430" };

// je Kategorie eine eigene, gedämpfte Farbe (Ergänzungen teilen die Themenfarbe)
const CAT_COLOR = {
  zahlbereiche: "#31597F",
  verknuepfungen: "#6B4E9E",
  relationen: "#1F7A63",
  mengen: "#B26A1E",
  abbildungen: "#2F6E8F",
  elementarfunktionen: "#7A5AA6",
  linalg: "#2E7D8A",
  logik: "#4C4BA6",
  eigenschaften: "#8A6BC0",
  konstanten: "#9A6A2E",
  komplex: "#3E7E63",
  extra_abbildungen: "#2F6E8F",
  extra_geometrie: "#4E7A3E",
  extra_mengen: "#B26A1E",
  extra_logik: "#4C4BA6",
  extra_relationen: "#1F7A63",
  extra_analysis: "#7A5AA6",
  extra_linalg: "#2E7D8A",
  extra_axiome: "#8A6BC0",
  extra_strukturen: "#2E6B7D",
};

export default function OpenMathPalette() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null); // Kategorie-id oder null = alle
  const [collapsed, setCollapsed] = useState({});
  const [copied, setCopied] = useState(null); // zuletzt kopierter Baustein

  const q = query.trim().toLowerCase();
  const matches = (s) =>
    !q || s.name.toLowerCase().includes(q) || s.glyph.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q);

  const cats = useMemo(
    () =>
      PALETTE_CATEGORIES.map((c) => ({ ...c, hits: c.symbols.filter(matches) })).filter(
        (c) => (!active || c.id === active) && c.hits.length > 0
      ),
    [q, active] // eslint-disable-line
  );
  const total = useMemo(() => cats.reduce((n, c) => n + c.hits.length, 0), [cats]);

  const paperBg = {
    backgroundColor: C.paper,
    backgroundImage: `radial-gradient(${C.dot} 1.3px, transparent 1.3px)`,
    backgroundSize: "22px 22px",
  };

  const copy = async (s) => {
    try { await navigator.clipboard?.writeText(s.glyph); } catch { /* ignore */ }
    setCopied(s.id);
    setTimeout(() => setCopied((v) => (v === s.id ? null : v)), 1100);
  };
  const toggle = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  return (
    <div style={{ ...paperBg, color: C.ink, minHeight: "100%", fontFamily: "system-ui, sans-serif" }} className="w-full">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Kopf */}
        <header className="mb-5">
          <div style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.18em" }} className="text-[11px] uppercase text-slate-500 mb-1">
            OpenMath · Content Dictionaries
          </div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl sm:text-4xl font-semibold leading-tight">
            Bausteine-Bibliothek
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            {PALETTE_META.count} atomare Bausteine, kategorisiert — {PALETTE_META.openmath} aus den offiziellen OpenMath-CDs
            plus {PALETTE_META.extra} <b>Ergänzungen</b> aus elementaren Einführungsskripten (Geometrie, Abbildungstypen &amp; Linearität, Analysis u. a.).
            Tippe einen Baustein an, um sein Zeichen zu kopieren.
          </p>
        </header>

        {/* Suche + Kategorie-Filter */}
        <section className="mb-5">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3 border" style={{ background: "rgba(255,255,255,0.6)", borderColor: "#B7C3CF", maxWidth: 420 }}>
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="suchen … (Name, Zeichen, Bedeutung)"
              className="w-full bg-transparent outline-none text-sm"
              style={{ fontFamily: "ui-monospace, monospace" }}
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-700 text-xs" aria-label="löschen">✕</button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip label={`Alle · ${PALETTE_META.count}`} color={C.ink} active={!active} onClick={() => setActive(null)} />
            {PALETTE_CATEGORIES.map((c) => (
              <FilterChip key={c.id} label={`${c.title} · ${c.symbols.length}`} color={CAT_COLOR[c.id]} active={active === c.id} onClick={() => setActive(active === c.id ? null : c.id)} />
            ))}
          </div>
        </section>

        {/* Ergebnis-Zeile */}
        <div className="text-[11px] text-slate-500 mb-3" style={{ fontFamily: "ui-monospace, monospace" }}>
          {q ? `${total} Treffer` : `${PALETTE_META.count} Bausteine · ${PALETTE_CATEGORIES.length} Kategorien`}
          {copied && <span className="ml-3" style={{ color: "#1F7A63" }}>✓ Zeichen kopiert</span>}
        </div>

        {/* Kategorien */}
        {cats.length === 0 && (
          <p className="text-sm text-slate-400" style={{ fontFamily: "Georgia, serif" }}>Nichts gefunden.</p>
        )}
        <div className="flex flex-col gap-5">
          {cats.map((c) => {
            const color = CAT_COLOR[c.id];
            const isCollapsed = !!collapsed[c.id];
            return (
              <section key={c.id}>
                <button onClick={() => toggle(c.id)} className="flex items-center gap-2 w-full text-left mb-2 hover:opacity-70 transition-opacity">
                  <ChevronDown size={14} className="text-slate-500 shrink-0" style={{ transform: isCollapsed ? "rotate(-90deg)" : "none", transition: "transform .2s ease" }} />
                  <span style={{ background: color, width: 11, height: 11, borderRadius: 3 }} />
                  <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.10em" }} className="text-[12px] uppercase text-slate-600 font-medium">{c.title}</span>
                  <span className="text-[11px] text-slate-400">{c.hits.length}</span>
                  {c.source === "Ergänzung" && (
                    <span className="text-[9px] uppercase tracking-wider rounded px-1.5 py-0.5" style={{ fontFamily: "ui-monospace, monospace", background: "rgba(0,0,0,0.05)", color, border: `1px solid ${color}66` }}>Ergänzung</span>
                  )}
                  <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline" style={{ fontFamily: "Georgia, serif" }}>{c.desc}</span>
                </button>
                {!isCollapsed && (
                  <div className="flex flex-wrap gap-2">
                    {c.hits.map((s) => (
                      <SymbolTile key={`${s.cd}.${s.name}`} sym={{ ...s, id: `${s.cd}.${s.name}` }} color={color} copied={copied === `${s.cd}.${s.name}`} onClick={copy} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <footer className="mt-8 text-[11px] text-slate-400" style={{ fontFamily: "ui-monospace, monospace" }}>
          Quelle: OpenMath Content Dictionaries (github.com/OpenMath/CDs) · Ergänzungen aus elementaren Einführungsskripten (Standard-Curriculum). {PALETTE_META.count} Bausteine.
        </footer>
      </div>
    </div>
  );
}

function FilterChip({ label, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition-colors border"
      style={{
        fontFamily: "ui-monospace, monospace",
        background: active ? color : "rgba(255,255,255,0.5)",
        color: active ? "#fff" : C.ink,
        borderColor: active ? color : "#B7C3CF",
      }}
    >
      {label}
    </button>
  );
}

function SymbolTile({ sym, color, copied, onClick }) {
  return (
    <button
      onClick={() => onClick(sym)}
      title={`${sym.name} (${sym.cd}) — Zeichen kopieren`}
      className="text-left rounded-xl transition-all group relative"
      style={{
        background: `linear-gradient(160deg, rgba(255,255,255,0.20), rgba(255,255,255,0)), ${color}`,
        color: "#fff",
        padding: "8px 12px",
        width: 148,
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: copied ? `0 0 0 3px ${color}55, 0 2px 0 rgba(0,0,0,0.18)` : "0 2px 0 rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25)",
        cursor: "pointer",
      }}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span style={{ fontFamily: "Georgia, serif", fontSize: 19, lineHeight: 1 }} className="font-semibold">{sym.glyph}</span>
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 8.5, opacity: 0.75 }} className="uppercase">{sym.cd}</span>
      </div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, opacity: 0.95, marginTop: 4 }}>{sym.name}</div>
      <div style={{ fontSize: 10.5, opacity: 0.9, marginTop: 1 }}>{sym.desc}</div>
      <span className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-70 transition-opacity">
        {copied ? <Check size={12} /> : <Copy size={11} />}
      </span>
    </button>
  );
}
