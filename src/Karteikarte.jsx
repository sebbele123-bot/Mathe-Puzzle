import React, { useMemo, useRef, useState } from "react";
import { Check, X, BookOpen, Hammer, HelpCircle } from "lucide-react";
import { CATALOG_BY_ID, FACH_COLOR, FACH_LABEL, TYP_COLOR, TYP_LABEL } from "./data/catalog.js";
import { loadStats, strengthOf } from "./data/stats.js";
import { BAUEN, QUIZ, AUFLOESUNG, modiFor, pickModus, stufeFor, vorgabenFor } from "./data/karten.js";
import { quizFor, hasQuiz } from "./data/quiz.js";
import { splitDefinition } from "./data/defsatz.js";
import { DEF_BY_ID } from "./data/definitions.js";
import { SYMBOL_TASK_BY_ID } from "./data/symboldefs.js";
import { MISSIONS as PROOF_MISSIONS } from "./proof/data.js";
import StrukturBaukasten, { MISSIONS as DEF_LESSONS, RESULTS, RECIPES, KURZ } from "./StrukturBaukasten.jsx";
import BeweisCrafter from "./proof/BeweisCrafter.jsx";
import Werkbank from "./Werkbank.jsx";

/* ====================================================================
 *  Karteikarte
 *  Ein Element aus der Bibliothek. Sie bietet mehrere Modi an; beim
 *  Ziehen wird einer gewählt (nach gemessener Stärke), lässt sich aber
 *  von Hand wechseln. Die Stufe des Bauens kommt ebenfalls aus der
 *  Stärke: schwach → viele vorgefertigte Teile, stark → von vorn.
 * ==================================================================== */
const C = { paper: "#EAEEF2", ink: "#1B2430", line: "#C4D0DB", ziel: "#1F7A63", warn: "#B26A1E", falsch: "#A6402F" };

const MODUS_LABEL = { [BAUEN]: "Bauen", [QUIZ]: "Quiz", [AUFLOESUNG]: "Auflösung" };
const MODUS_ICON = { [BAUEN]: Hammer, [QUIZ]: HelpCircle, [AUFLOESUNG]: BookOpen };

// XP-Art: Bauen zählt nach Typ, Quiz und Auflösung sind leichte Wiederholung
const bauArt = (item) => (item.mode === "beweis" ? "beweis" : "definition");

/** Wie viele Stufen hat diese Karte? (Beweise: Tiefen, sonst: Schritte) */
function maxStufeFor(item) {
  if (item.mode === "beweis") {
    const m = PROOF_MISSIONS.find((x) => x.id === item.targetId);
    return m ? m.depths.length - 1 : 0;
  }
  if (item.mode === "definition") {
    const m = DEF_LESSONS.find((x) => x.id === item.targetId);
    return m ? Math.max(0, m.steps.length - 1) : 0;
  }
  if (item.mode === "werkbank") {
    const t = SYMBOL_TASK_BY_ID[item.targetId];
    return t ? Math.max(0, t.need.length - 1) : 0;
  }
  return 0;
}

// Lesbare Bezeichnung eines Ergebnisses: `sub` trägt meist den deutschen
// Namen, ist aber mitunter eine Formel („dim E⃗ = 2", „Kongruenzen =
// Isometrien") — dann steht die Bezeichnung in `name`.
const bezeichnung = (r) => (r?.sub && !r.sub.includes("=") ? r.sub : r?.name || "");

/** Wofür werden diese Ergebnisse anderswo als Zutat gebraucht? */
function bausteinFuer(ids) {
  if (!ids.length) return null;
  const namen = [...new Set(
    RECIPES.filter((rec) => rec.need.some((n) => ids.includes(n)))
      .map((rec) => bezeichnung(RESULTS[rec.result]))
      .filter(Boolean)
  )];
  return namen.length ? `Baustein für: ${namen.join(", ")}.` : null;
}

// Steckbrief Dn ↔ Ergebnis, dessen ref auf „Def n" verweist (auch „Def 5/6")
const ergebnisseZuDefNr = (nr) =>
  Object.values(RESULTS)
    .filter((r) => (r.ref?.match(/^Def\s*([\d/]+)/)?.[1] || "").split("/").includes(String(nr)))
    .map((r) => r.id);

/** Definitionstext und „was sie kann" aus den vorhandenen Daten. */
function inhaltFor(item) {
  if (item.mode === "steckbrief") {
    const d = DEF_BY_ID[item.targetId];
    // Übungsblatt-Kürzel sagen nichts darüber, wozu die Definition taugt —
    // stattdessen konkret: welche Bausteine auf ihr aufbauen.
    return { text: d?.statement, kann: d ? bausteinFuer(ergebnisseZuDefNr(d.nr)) : null };
  }
  if (item.mode === "werkbank") {
    const t = SYMBOL_TASK_BY_ID[item.targetId];
    return { text: t?.beschreibung, kann: null };
  }
  if (item.mode === "beweis") {
    const m = PROOF_MISSIONS.find((x) => x.id === item.targetId);
    return { text: m?.claim, kann: null };
  }
  // Struktur-Lektion: Ziel ist der letzte Schritt
  const m = DEF_LESSONS.find((x) => x.id === item.targetId);
  const ziel = m?.steps[m.steps.length - 1];
  const r = ziel ? RESULTS[ziel] : null;
  return {
    text: ziel ? KURZ[ziel] || r?.note : null,
    kann: ziel ? bausteinFuer([ziel]) : null,
  };
}

export default function Karteikarte({ catalogId, onOutcome, collection = [], training = false }) {
  const item = CATALOG_BY_ID[catalogId];
  // Stärke und gezogener Modus bleiben stabil, solange die Karte offen ist
  const staerke = useMemo(() => (item ? strengthOf(catalogId, loadStats()) : null), [catalogId]); // eslint-disable-line
  const modi = useMemo(() => (item ? modiFor(item, hasQuiz(catalogId)) : []), [item, catalogId]);
  const [modus, setModus] = useState(() => pickModus(modi, staerke));

  const maxStufe = item ? maxStufeFor(item) : 0;
  const stufe = stufeFor(staerke, maxStufe);
  const vorgaben = vorgabenFor(stufe, maxStufe);

  if (!item) return null;

  const melden = (art, fails) => onOutcome?.(catalogId, art, fails);

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100%" }} className="w-full">
      {/* Kopf der Karte */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <div className="rounded-2xl border px-3 py-2.5" style={{ background: "#fff", borderColor: C.line }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-md px-1.5 py-0.5 text-[11px]" style={{ fontFamily: "ui-monospace, monospace", background: "#EEF2F6", color: C.ink }}>{item.code}</span>
            <span style={{ fontFamily: "Georgia, serif" }} className="text-lg font-semibold min-w-0 truncate">{item.titel}</span>
            <span className="rounded-full px-2 py-0.5 text-[10px] shrink-0" style={{ fontFamily: "ui-monospace, monospace", background: FACH_COLOR[item.fach], color: "#fff" }}>{FACH_LABEL[item.fach]}</span>
            <span className="rounded-full px-2 py-0.5 text-[10px] shrink-0" style={{ fontFamily: "ui-monospace, monospace", background: TYP_COLOR[item.typ], color: "#fff" }}>{TYP_LABEL[item.typ]}</span>
          </div>
          {/* Modi der Karte — der gezogene ist aktiv, Wechsel ist erlaubt */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {modi.map((m) => {
              const Icon = MODUS_ICON[m];
              const aktiv = m === modus;
              return (
                <button key={m} onClick={() => setModus(m)} aria-pressed={aktiv}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] border transition-colors"
                  style={{ fontFamily: "ui-monospace, monospace",
                    background: aktiv ? C.ink : "#fff", color: aktiv ? "#fff" : C.ink,
                    borderColor: aktiv ? C.ink : C.line }}>
                  <Icon size={12} /> {MODUS_LABEL[m]}
                </button>
              );
            })}
            {modus === BAUEN && maxStufe > 0 && (
              <span className="shrink-0 ml-auto text-[10px] text-slate-500" style={{ fontFamily: "ui-monospace, monospace" }}>
                {/* Bei Beweisen steckt die Vorgabe bereits in der Tiefenstufe */}
                {`Stufe ${stufe}/${maxStufe}${item.mode !== "beweis" && vorgaben ? ` · ${vorgaben} vorgefertigt` : ""}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Inhalt des gewählten Modus */}
      {modus === BAUEN && (
        <Bauen item={item} vorgaben={vorgaben} stufe={stufe} collection={collection} training={training}
          onFertig={(fails) => melden(bauArt(item), fails)} />
      )}
      {modus === QUIZ && (
        <QuizModus fragen={quizFor(catalogId)} onFertig={(fehler) => melden("steckbrief", fehler)} />
      )}
      {modus === AUFLOESUNG && (
        <Aufloesung item={item} onVerstanden={() => melden("steckbrief", 0)} />
      )}
    </div>
  );
}

/* --- Baumodus: die vorhandene Bauansicht mit vorgegebener Stufe ------- */
function Bauen({ item, vorgaben, stufe, collection, training, onFertig }) {
  if (item.mode === "beweis")
    return <BeweisCrafter initialId={item.targetId} initialDepth={stufe} onOutcome={(_, fails) => onFertig(fails)} />;
  if (item.mode === "werkbank")
    return <Werkbank taskId={item.targetId} vorgaben={vorgaben} collection={collection} training={training}
      onOutcome={(_, fails) => onFertig(fails)} />;
  return <StrukturBaukasten initialId={item.targetId} vorgaben={vorgaben} onOutcome={(_, fails) => onFertig(fails)} />;
}

/* --- Quizmodus: ABCD oder ja/nein ------------------------------------ */
function QuizModus({ fragen, onFertig }) {
  const [idx, setIdx] = useState(0);
  const [gewaehlt, setGewaehlt] = useState(null);
  const fehler = useRef(0);
  const gemeldet = useRef(false);

  const f = fragen[idx];
  if (!f) return null;
  const letzte = idx === fragen.length - 1;
  const richtig = gewaehlt !== null && gewaehlt === f.richtig;

  const antworten = (wert) => { if (gewaehlt === null) { setGewaehlt(wert); if (wert !== f.richtig) fehler.current += 1; } };
  const weiter = () => {
    if (letzte) {
      if (!gemeldet.current) { gemeldet.current = true; onFertig(fehler.current); }
      return;
    }
    setIdx((i) => i + 1); setGewaehlt(null);
  };

  const optionen = f.art === "janein"
    ? [{ wert: true, text: "ja" }, { wert: false, text: "nein" }]
    : f.optionen.map((text, i) => ({ wert: i, text }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-500" style={{ fontFamily: "ui-monospace, monospace" }}>Frage</span>
        <span className="text-[10px] text-slate-400" style={{ fontFamily: "ui-monospace, monospace" }}>{idx + 1}/{fragen.length}</span>
      </div>
      <p className="text-lg mb-4" style={{ fontFamily: "Georgia, serif" }}>{f.frage}</p>

      <div className="flex flex-col gap-2">
        {optionen.map((o) => {
          const dieseGewaehlt = gewaehlt !== null && gewaehlt === o.wert;
          const dieseRichtig = gewaehlt !== null && o.wert === f.richtig;
          const farbe = dieseRichtig ? C.ziel : dieseGewaehlt ? C.falsch : C.line;
          return (
            <button key={String(o.wert)} onClick={() => antworten(o.wert)} disabled={gewaehlt !== null}
              className="rounded-xl border px-3 py-2.5 text-left flex items-center gap-2 transition-colors"
              style={{ background: "#fff", borderColor: farbe, borderWidth: dieseRichtig || dieseGewaehlt ? 2 : 1,
                cursor: gewaehlt === null ? "pointer" : "default" }}>
              <span className="flex-1 min-w-0" style={{ fontFamily: "Georgia, serif" }}>{o.text}</span>
              {dieseRichtig && <Check size={16} color={C.ziel} />}
              {dieseGewaehlt && !dieseRichtig && <X size={16} color={C.falsch} />}
            </button>
          );
        })}
      </div>

      {gewaehlt !== null && (
        <div className="mt-4 rounded-xl px-3 py-2.5" style={{ background: richtig ? "rgba(31,122,99,0.10)" : "rgba(166,64,47,0.08)", border: `1px solid ${richtig ? C.ziel : C.falsch}` }}>
          <p className="text-[15px] text-slate-800" style={{ fontFamily: "Georgia, serif" }}>{f.hinweis}</p>
        </div>
      )}

      {gewaehlt !== null && (
        <button onClick={weiter} className="mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
          style={{ fontFamily: "ui-monospace, monospace", background: C.ink, color: "#fff" }}>
          {letzte ? "fertig" : "weiter"}
        </button>
      )}
    </div>
  );
}

/* --- Auflösung: was es ist und wofür es taugt ------------------------- */
function Aufloesung({ item, onVerstanden }) {
  const { text, kann } = inhaltFor(item);
  const [quittiert, setQuittiert] = useState(false);
  return (
    <div className="max-w-5xl mx-auto px-4 py-5">
      <div className="rounded-2xl border px-4 py-4" style={{ background: "#fff", borderColor: C.line }}>
        {(() => {
          const { definiendum, definiens } = splitDefinition(text || item.titel);
          return (
            <div>
              <div className="text-[8px] uppercase tracking-wider text-slate-400 mb-0.5" style={{ fontFamily: "ui-monospace, monospace" }}>Definition</div>
              <div className="flex items-baseline gap-2">
                {definiendum && (
                  <span className="shrink-0 text-base sm:text-lg text-slate-800" style={{ fontFamily: "Georgia, serif" }}>{definiendum}</span>
                )}
                <span className="shrink-0 text-xl" style={{ color: FACH_COLOR[item.fach], fontFamily: "ui-monospace, monospace" }}>:=</span>
                <p className="text-base sm:text-lg text-slate-800" style={{ fontFamily: "Georgia, serif", lineHeight: 1.5 }}>{definiens}</p>
              </div>
            </div>
          );
        })()}
        {kann && (
          <>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-4 mb-1.5" style={{ fontFamily: "ui-monospace, monospace" }}>Wozu</div>
            <p className="text-[15px] text-slate-700" style={{ fontFamily: "Georgia, serif", lineHeight: 1.5 }}>{kann}</p>
          </>
        )}
      </div>
      <button onClick={() => { if (!quittiert) { setQuittiert(true); onVerstanden(); } }} disabled={quittiert}
        className="mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
        style={{ fontFamily: "ui-monospace, monospace", background: quittiert ? "#C4D0DB" : C.ink, color: quittiert ? "#8595a4" : "#fff", cursor: quittiert ? "default" : "pointer" }}>
        <Check size={15} /> {quittiert ? "notiert" : "verstanden"}
      </button>
    </div>
  );
}
