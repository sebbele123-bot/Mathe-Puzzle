import React, { useState } from "react";
import { Boxes, GitBranch, LayoutGrid } from "lucide-react";
import StrukturBaukasten from "./StrukturBaukasten.jsx";
import BeweisCrafter from "./proof/BeweisCrafter.jsx";
import OpenMathPalette from "./OpenMathPalette.jsx";

const C = { ink: "#1B2430", ziel: "#1F7A63", fakt: "#31597F", verkn: "#6B4E9E" };

export default function App() {
  const [mode, setMode] = useState("beweis"); // "definition" | "beweis" | "bausteine"

  return (
    <div style={{ minHeight: "100%" }}>
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
        </div>
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
