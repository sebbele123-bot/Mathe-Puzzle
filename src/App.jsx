import React, { useState, useEffect, useRef, useCallback } from "react";
import { Boxes, GitBranch, LayoutGrid, Library, Hammer, Target, Maximize, Minimize, ChevronRight, X } from "lucide-react";
import StrukturBaukasten from "./StrukturBaukasten.jsx";
import BeweisCrafter from "./proof/BeweisCrafter.jsx";
import OpenMathPalette from "./OpenMathPalette.jsx";
import Bibliothek from "./Bibliothek.jsx";
import Training from "./Training.jsx";
import Werkbank from "./Werkbank.jsx";
import Steckbrief from "./Steckbrief.jsx";
import Inventory from "./Inventory.jsx";
import { loadCollection, saveCollection } from "./data/symbols.js";
import { recordOutcome, loadStats, pickWeighted, strengthOf } from "./data/stats.js";
import { loadRotation, CATALOG_BY_ID } from "./data/catalog.js";
import { awardXp, loadXp, levelFromXp } from "./data/xp.js";

const C = { ink: "#1B2430", ziel: "#1F7A63", fakt: "#31597F", verkn: "#6B4E9E", warn: "#B26A1E", werk: "#2E6B7D" };

export default function App() {
  const [mode, setMode] = useState("bibliothek"); // "bibliothek" | "training" | "werkbank" | "bausteine" | "beweis" | "definition" | "steckbrief"
  const [openReq, setOpenReq] = useState({ definition: null, beweis: null, steckbrief: null, werkbank: null }); // aus der Bibliothek angeforderte Mission je Ansicht
  const [activeSymbol, setActiveSymbol] = useState(null); // aktives Hotbar-Symbol (für die Werkbank)
  const [collection, setCollection] = useState(loadCollection); // gesammeltes Inventar (leer bis eingesammelt)
  const [xpState, setXpState] = useState(() => levelFromXp(loadXp().xp)); // Level & Fortschritt
  const [award, setAward] = useState(null); // zuletzt vergebene XP (zeigt die Sitzungsleiste)
  const [session, setSession] = useState({ active: false, done: 0 }); // Trainings-Schleife
  const [fs, setFs] = useState(false);

  useEffect(() => { saveCollection(collection); }, [collection]);
  const collect = useCallback((id) => setCollection((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id])), []);
  const discard = useCallback((id) => setCollection((c) => c.filter((x) => x !== id)), []);
  const collectedSet = React.useMemo(() => new Set(collection), [collection]);
  const [fsHint, setFsHint] = useState("");
  const rootRef = useRef(null);

  // Aus der Bibliothek eine Mission öffnen: passende Ansicht wählen + laden.
  // Die Ansichten werden beim Moduswechsel neu gemountet und lesen dann initialId.
  const openFromLibrary = useCallback((targetMode, targetId) => {
    setOpenReq((r) => ({ ...r, [targetMode]: targetId }));
    setMode(targetMode);
  }, []);

  // gemessene Übung festhalten (Fehlversuche) → Rotations-Gewichtung + XP
  const recordStat = useCallback((catalogId, kind, fails) => {
    const before = strengthOf(catalogId, loadStats()); // Stärke VOR dieser Übung
    recordOutcome(catalogId, fails);
    const res = awardXp(catalogId, kind, fails, before);
    setXpState(levelFromXp(res.total));
    setAward({ ...res, id: catalogId });
    setSession((s) => (s.active ? { ...s, done: s.done + 1 } : s));
  }, []);

  // nächstes Element der Rotation: gewichteter Zufalls-Zug (Schwächen häufiger)
  const nextInRotation = useCallback((exclude = null) => {
    const ids = loadRotation();
    if (!ids.length) return false;
    const pick = pickWeighted(ids, loadStats(), exclude);
    const item = CATALOG_BY_ID[pick];
    if (!item) return false;
    setAward(null);
    openFromLibrary(item.mode, item.targetId);
    return true;
  }, [openFromLibrary]);

  // Training starten: Sitzung eröffnen und erstes Element ziehen
  const startRotation = useCallback(() => {
    setSession({ active: true, done: 0 });
    setAward(null);
    nextInRotation();
  }, [nextInRotation]);

  const endSession = useCallback(() => {
    setSession({ active: false, done: 0 });
    setAward(null);
    setMode("training");
  }, []);

  // außerhalb einer Trainings-Sitzung blendet die XP-Meldung von selbst aus
  useEffect(() => {
    if (!award || session.active) return;
    const t = setTimeout(() => setAward(null), 2600);
    return () => clearTimeout(t);
  }, [award, session.active]);

  // Vollbildstatus (auch bei Wechsel per Taste/ESC) verfolgen
  useEffect(() => {
    const onChange = () => setFs(!!(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  // läuft die App in einem (fremden) Rahmen? Dann ist echtes Vollbild oft gesperrt.
  const inFrame = (() => { try { return window.self !== window.top; } catch { return true; } })();

  const toggleFs = useCallback(async () => {
    const el = rootRef.current || document.documentElement;
    const inFs = document.fullscreenElement || document.webkitFullscreenElement;
    try {
      if (!inFs) {
        // erst das App-Element, dann als Rückfall das ganze Dokument versuchen
        const req =
          el.requestFullscreen?.bind(el) ||
          el.webkitRequestFullscreen?.bind(el) ||
          document.documentElement.requestFullscreen?.bind(document.documentElement) ||
          document.documentElement.webkitRequestFullscreen?.bind(document.documentElement);
        if (!req) throw new Error("unsupported");
        await req();
      } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        await exit?.call(document);
      }
      setFsHint("");
    } catch {
      // Rahmen ohne allow="fullscreen" (z. B. eingebettete Vorschau) oder iOS-Safari.
      setFsHint(
        inFrame
          ? "Vollbild ist in der eingebetteten Vorschau gesperrt. Öffne die Seite über „In neuem Tab öffnen“ (⇱ oben rechts) — dort funktioniert der Vollbild-Knopf."
          : "Vollbild wird von diesem Browser nicht unterstützt."
      );
    }
  }, [inFrame]);

  return (
    <div ref={rootRef} style={{ minHeight: "100%", background: "#EAEEF2", paddingBottom: 76 }}>
      {/* Modus-Umschalter */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(234,238,242,0.92)",
          backdropFilter: "blur(6px)",
          borderBottom: "1px solid #C4D0DB",
        }}
      >
        <div className="max-w-5xl mx-auto px-3 py-2 flex items-center gap-2">
          <span style={{ fontFamily: "Georgia, serif", color: C.ink }} className="hidden md:inline text-sm font-semibold mr-1 whitespace-nowrap">
            Mathe-Puzzle
          </span>
          <div className="flex gap-1.5 min-w-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <ModeButton active={mode === "bibliothek"} onClick={() => setMode("bibliothek")} icon={Library} label="Bibliothek" color={C.ink} />
            <ModeButton active={mode === "training"} onClick={() => setMode("training")} icon={Target} label="Training" color={C.warn} />
            <ModeButton active={mode === "werkbank"} onClick={() => { setOpenReq((r) => ({ ...r, werkbank: null })); setMode("werkbank"); }} icon={Hammer} label="Werkbank" color={C.werk} />
            <ModeButton active={mode === "bausteine"} onClick={() => setMode("bausteine")} icon={LayoutGrid} label="Bausteine" color={C.verkn} />
            <ModeButton active={mode === "beweis"} onClick={() => setMode("beweis")} icon={GitBranch} label="Beweise" color={C.ziel} />
            <ModeButton active={mode === "definition"} onClick={() => setMode("definition")} icon={Boxes} label="Definitionen" color={C.fakt} />
          </div>
          {/* Level & Fortschritt */}
          <button
            onClick={() => setMode("training")}
            title={`Level ${xpState.level} · ${xpState.inLevel}/${xpState.need} XP`}
            aria-label={`Level ${xpState.level}`}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full pl-1 pr-2 py-1 text-xs border shrink-0"
            style={{ fontFamily: "ui-monospace, monospace", background: "rgba(255,255,255,0.6)", borderColor: "#B7C3CF", color: C.ink }}
          >
            <span className="inline-flex items-center justify-center rounded-full text-[10px] font-semibold"
              style={{ width: 18, height: 18, background: C.warn, color: "#fff" }}>{xpState.level}</span>
            <span className="hidden sm:block rounded-full overflow-hidden" style={{ width: 44, height: 5, background: "#D8E0E8" }}>
              <span className="block h-full" style={{ width: `${Math.round(xpState.progress * 100)}%`, background: C.warn }} />
            </span>
          </button>

          {/* Vollbild-Umschalter — bleibt immer sichtbar */}
          <button
            onClick={toggleFs}
            aria-label={fs ? "Vollbild verlassen" : "Vollbild"}
            title={fs ? "Vollbild verlassen" : "Vollbildmodus"}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors border shrink-0"
            style={{
              fontFamily: "ui-monospace, monospace",
              background: fs ? C.ink : "rgba(255,255,255,0.6)",
              color: fs ? "#fff" : C.ink,
              borderColor: fs ? C.ink : "#B7C3CF",
            }}
          >
            {fs ? <Minimize size={13} /> : <Maximize size={13} />}
            <span className="hidden sm:inline">{fs ? "Vollbild aus" : "Vollbild"}</span>
          </button>
        </div>
        {fsHint && (
          <div className="max-w-5xl mx-auto px-4 pb-2 flex items-start gap-2 text-[11px]" style={{ color: C.warn, fontFamily: "ui-monospace, monospace" }}>
            <span className="flex-1">{fsHint}</span>
            <button onClick={() => setFsHint("")} aria-label="Hinweis schließen" className="shrink-0 underline">ok</button>
          </div>
        )}
      </div>

      {mode === "bibliothek" ? (
        <Bibliothek onOpen={openFromLibrary} onStartRotation={() => setMode("training")} />
      ) : mode === "training" ? (
        <Training onOpen={openFromLibrary} onStart={startRotation} onBrowse={() => setMode("bibliothek")} />
      ) : mode === "steckbrief" ? (
        <Steckbrief defId={openReq.steckbrief} onBack={() => setMode("bibliothek")}
          onReview={(defId) => recordStat(`defcard:${defId}`, "steckbrief", 0)} />
      ) : mode === "werkbank" ? (
        <Werkbank activeSymbolId={activeSymbol} taskId={openReq.werkbank}
          onOutcome={(taskId, fails) => recordStat(`sym:${taskId}`, "definition", fails)} />
      ) : mode === "definition" ? (
        <StrukturBaukasten initialId={openReq.definition}
          onOutcome={(missionId, fails) => recordStat(`def:${missionId}`, "definition", fails)} />
      ) : mode === "bausteine" ? (
        <OpenMathPalette collected={collectedSet} onCollect={collect} />
      ) : (
        <BeweisCrafter initialId={openReq.beweis}
          onOutcome={(missionId, fails) => recordStat(`proof:${missionId}`, "beweis", fails)} />
      )}

      {/* Sitzungsleiste: vergebene XP + Weiter-Schleife */}
      {award && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 78, zIndex: 46, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 mx-3"
            style={{ pointerEvents: "auto", background: "rgba(27,36,48,0.94)", color: "#fff", boxShadow: "0 6px 24px rgba(0,0,0,0.28)", fontFamily: "ui-monospace, monospace" }}>
            <span className="text-sm font-semibold" style={{ color: "#F0B45E" }}>+{award.gained} XP</span>
            {award.leveledUp && (
              <span className="text-[11px] rounded-full px-2 py-0.5" style={{ background: C.warn }}>Level {award.level}</span>
            )}
            {session.active && <span className="text-[11px] text-slate-300">{session.done}</span>}
            {session.active ? (
              <>
                <button onClick={() => { if (!nextInRotation(award.id)) endSession(); }}
                  className="ml-1 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium"
                  style={{ background: C.warn, color: "#fff" }}>
                  weiter <ChevronRight size={13} />
                </button>
                <button onClick={endSession} className="rounded-lg px-2 py-1.5 text-xs text-slate-300 hover:text-white transition-colors">
                  beenden
                </button>
              </>
            ) : (
              <button onClick={() => setAward(null)} aria-label="schließen" className="rounded-lg p-1 text-slate-300 hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Minecraft-artiges Inventar: Hotbar (1–8) + gesammeltes Lager (E) */}
      <Inventory onActive={setActiveSymbol} collection={collection} onDiscard={discard} onBrowse={() => setMode("bausteine")} />
    </div>
  );
}

function ModeButton({ active, onClick, icon: Icon, label, color }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors border shrink-0"
      style={{
        fontFamily: "ui-monospace, monospace",
        background: active ? color : "rgba(255,255,255,0.6)",
        color: active ? "#fff" : C.ink,
        borderColor: active ? color : "#B7C3CF",
      }}
    >
      <Icon size={13} />
      {/* auf kleinen Schirmen nur das aktive Label zeigen — spart Platz für den Vollbild-Knopf */}
      <span className={`${active ? "inline" : "hidden"} sm:inline`}>{label}</span>
    </button>
  );
}
