import React, { useState, useEffect, useRef, useCallback } from "react";
import { Boxes, GitBranch, LayoutGrid, Maximize, Minimize } from "lucide-react";
import StrukturBaukasten from "./StrukturBaukasten.jsx";
import BeweisCrafter from "./proof/BeweisCrafter.jsx";
import OpenMathPalette from "./OpenMathPalette.jsx";

const C = { ink: "#1B2430", ziel: "#1F7A63", fakt: "#31597F", verkn: "#6B4E9E", warn: "#B26A1E" };

export default function App() {
  const [mode, setMode] = useState("beweis"); // "definition" | "beweis" | "bausteine"
  const [fs, setFs] = useState(false);
  const [fsHint, setFsHint] = useState("");
  const rootRef = useRef(null);

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

  const toggleFs = useCallback(async () => {
    const el = rootRef.current || document.documentElement;
    const inFs = document.fullscreenElement || document.webkitFullscreenElement;
    try {
      if (!inFs) {
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (!req) throw new Error("unsupported");
        await req.call(el);
      } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        await exit?.call(document);
      }
      setFsHint("");
    } catch {
      // z. B. iOS-Safari oder ein Rahmen ohne allow="fullscreen"
      setFsHint("Vollbild hier nicht möglich — die Seite in einem eigenen Tab öffnen.");
      setTimeout(() => setFsHint(""), 4000);
    }
  }, []);

  return (
    <div ref={rootRef} style={{ minHeight: "100%", background: "#EAEEF2" }}>
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
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <span style={{ fontFamily: "Georgia, serif", color: C.ink }} className="text-sm font-semibold mr-1">
            Mathe-Puzzle
          </span>
          <div className="flex gap-1.5">
            <ModeButton active={mode === "definition"} onClick={() => setMode("definition")} icon={Boxes} label="Definitionen" color={C.fakt} />
            <ModeButton active={mode === "beweis"} onClick={() => setMode("beweis")} icon={GitBranch} label="Beweise" color={C.ziel} />
            <ModeButton active={mode === "bausteine"} onClick={() => setMode("bausteine")} icon={LayoutGrid} label="Bausteine" color={C.verkn} />
          </div>
          {/* Vollbild-Umschalter */}
          <button
            onClick={toggleFs}
            aria-label={fs ? "Vollbild verlassen" : "Vollbild"}
            title={fs ? "Vollbild verlassen" : "Vollbildmodus"}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors border shrink-0"
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
          <div className="max-w-5xl mx-auto px-4 pb-2 text-[11px]" style={{ color: C.warn, fontFamily: "ui-monospace, monospace" }}>
            {fsHint}
          </div>
        )}
      </div>

      {mode === "definition" ? <StrukturBaukasten /> : mode === "bausteine" ? <OpenMathPalette /> : <BeweisCrafter />}
    </div>
  );
}

function ModeButton({ active, onClick, icon: Icon, label, color }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors border"
      style={{
        fontFamily: "ui-monospace, monospace",
        background: active ? color : "rgba(255,255,255,0.6)",
        color: active ? "#fff" : C.ink,
        borderColor: active ? color : "#B7C3CF",
      }}
    >
      <Icon size={13} /> {label}
    </button>
  );
}
