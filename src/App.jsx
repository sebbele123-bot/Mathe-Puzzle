import React, { useState, useEffect, useRef, useCallback } from "react";
import { Boxes, GitBranch, LayoutGrid, Library, Hammer, Maximize, Minimize } from "lucide-react";
import StrukturBaukasten from "./StrukturBaukasten.jsx";
import BeweisCrafter from "./proof/BeweisCrafter.jsx";
import OpenMathPalette from "./OpenMathPalette.jsx";
import Bibliothek from "./Bibliothek.jsx";
import Werkbank from "./Werkbank.jsx";
import Inventory from "./Inventory.jsx";
import { loadCollection, saveCollection } from "./data/symbols.js";

const C = { ink: "#1B2430", ziel: "#1F7A63", fakt: "#31597F", verkn: "#6B4E9E", warn: "#B26A1E" };

export default function App() {
  const [mode, setMode] = useState("bibliothek"); // "bibliothek" | "definition" | "beweis" | "bausteine"
  const [openReq, setOpenReq] = useState({ definition: null, beweis: null }); // aus der Bibliothek angeforderte Mission je Ansicht
  const [activeSymbol, setActiveSymbol] = useState(null); // aktives Hotbar-Symbol (für die Werkbank)
  const [collection, setCollection] = useState(loadCollection); // gesammeltes Inventar (leer bis eingesammelt)
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
            <ModeButton active={mode === "werkbank"} onClick={() => setMode("werkbank")} icon={Hammer} label="Werkbank" color={C.warn} />
            <ModeButton active={mode === "bausteine"} onClick={() => setMode("bausteine")} icon={LayoutGrid} label="Bausteine" color={C.verkn} />
            <ModeButton active={mode === "beweis"} onClick={() => setMode("beweis")} icon={GitBranch} label="Beweise" color={C.ziel} />
            <ModeButton active={mode === "definition"} onClick={() => setMode("definition")} icon={Boxes} label="Definitionen" color={C.fakt} />
          </div>
          {/* Vollbild-Umschalter — bleibt immer sichtbar */}
          <button
            onClick={toggleFs}
            aria-label={fs ? "Vollbild verlassen" : "Vollbild"}
            title={fs ? "Vollbild verlassen" : "Vollbildmodus"}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors border shrink-0"
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
        <Bibliothek onOpen={openFromLibrary} />
      ) : mode === "werkbank" ? (
        <Werkbank activeSymbolId={activeSymbol} />
      ) : mode === "definition" ? (
        <StrukturBaukasten initialId={openReq.definition} />
      ) : mode === "bausteine" ? (
        <OpenMathPalette collected={collectedSet} onCollect={collect} />
      ) : (
        <BeweisCrafter initialId={openReq.beweis} />
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
