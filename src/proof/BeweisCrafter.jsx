import React, { useMemo, useState } from "react";
import { Check, RotateCcw, ChevronRight, Sparkles, AlertTriangle } from "lucide-react";
import { FACTS, RULES, MISSIONS } from "./data.js";
import { evaluate, deadEndSet, givenFor } from "./engine.js";

/* --- Farbwelt (konsistent mit dem Struktur-Baukasten) --------------- */
const C = {
  paper: "#EAEEF2",
  dot: "#C4D0DB",
  ink: "#1B2430",
  fakt: "#31597F", // bewiesene Fakten (Blau)
  faktHi: "#4E7BA6",
  regel: "#6B4E9E", // Schlussregeln (Violett)
  regelHi: "#8A6BC0",
  ziel: "#1F7A63", // Ziel / Erfolg (Petrol)
  zielHi: "#2FA588",
  warn: "#B26A1E", // Hinweis (Ocker)
  sack: "#9AA6B2", // Sackgasse (Grau)
};

export default function BeweisCrafter() {
  const [missionId, setMissionId] = useState(MISSIONS[0].id);
  const [depth, setDepth] = useState(0);
  const [have, setHave] = useState(() => MISSIONS[0].depths[0].given.slice());
  const [selected, setSelected] = useState([]);
  const [log, setLog] = useState([]);
  const [feedback, setFeedback] = useState(null); // { status, message }
  const [flash, setFlash] = useState(null); // frisch bewiesener factId

  const mission = useMemo(() => {
    const m = MISSIONS.find((x) => x.id === missionId);
    return { ...m, _deadEnds: deadEndSet(m, FACTS) };
  }, [missionId]);

  const haveSet = useMemo(() => new Set(have), [have]);
  const won = haveSet.has(mission.goal);

  const paperBg = {
    backgroundColor: C.paper,
    backgroundImage: `radial-gradient(${C.dot} 1.3px, transparent 1.3px)`,
    backgroundSize: "22px 22px",
  };

  // --- Mission / Tiefe wechseln (setzt zurück) ---
  const loadMission = (id, d = 0) => {
    const m = MISSIONS.find((x) => x.id === id);
    setMissionId(id);
    setDepth(d);
    setHave(givenFor(m, d).slice());
    setSelected([]);
    setLog([]);
    setFeedback(null);
    setFlash(null);
  };
  const resetMission = () => loadMission(missionId, depth);

  const toggleFact = (id) => {
    if (won) return;
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    setFeedback(null);
  };

  // --- Regel auf die aktuelle Auswahl anwenden ---
  const applyRule = (ruleId) => {
    if (won) return;
    const res = evaluate(mission, haveSet, ruleId, selected);
    setFeedback({ status: res.status, message: res.message });
    if (res.ok) {
      setHave((h) => (h.includes(res.produces) ? h : [...h, res.produces]));
      setLog((l) => [
        ...l,
        { rule: ruleId, premises: selected.slice(), produces: res.produces, sackgasse: res.status === "sackgasse" },
      ]);
      setSelected([]);
      setFlash(res.produces);
      setTimeout(() => setFlash((f) => (f === res.produces ? null : f)), 900);
    }
  };

  const goal = FACTS[mission.goal];

  return (
    <div style={{ ...paperBg, color: C.ink, minHeight: "100%", fontFamily: "system-ui, sans-serif" }} className="w-full">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Kopf */}
        <header className="mb-5">
          <div style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.18em" }} className="text-[11px] uppercase text-slate-500 mb-1">
            Elementargeometrie · Beweise
          </div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl sm:text-4xl font-semibold leading-tight">
            Beweis-Baukasten
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Wähle bewiesene <b>Fakten</b> aus und wende eine <b>Schlussregel</b> darauf an. Jeder gültige Schluss erzeugt einen neuen Fakt.
            Baue so eine Kette bis zum <b>Ziel</b>. Achtung: Nicht jede Regel passt, manche Bausteine sind Sackgassen — und du kannst einen Fakt erst benutzen, wenn er bewiesen ist.
          </p>
        </header>

        {/* Missionswahl */}
        <section className="mb-4">
          <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.14em" }} className="text-[11px] uppercase text-slate-500">
            Beweis wählen
          </span>
          <div className="flex flex-wrap gap-2 mt-2">
            {MISSIONS.map((m) => {
              const active = m.id === missionId;
              return (
                <button
                  key={m.id}
                  onClick={() => loadMission(m.id, 0)}
                  aria-pressed={active}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors border"
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    background: active ? C.ziel : "rgba(255,255,255,0.5)",
                    color: active ? "#fff" : C.ink,
                    borderColor: active ? C.ziel : "#B7C3CF",
                  }}
                >
                  {m.title}
                </button>
              );
            })}
          </div>
        </section>

        {/* Ziel / Behauptung */}
        <section
          className="mb-4 rounded-xl px-4 py-3"
          style={{ background: won ? "rgba(31,122,99,0.10)" : "rgba(255,255,255,0.55)", border: `1px solid ${won ? C.ziel : "#B7C3CF"}` }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500">
              Zu zeigen
            </span>
            <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] text-slate-400">{mission.ref}</span>
            {won && (
              <span className="inline-flex items-center gap-1 ml-auto text-xs font-medium" style={{ color: C.ziel }}>
                <Check size={13} /> Beweis vollständig
              </span>
            )}
          </div>
          <p className="text-sm text-slate-800 mt-1" style={{ fontFamily: "Georgia, serif" }}>{mission.claim}</p>
          <div className="flex items-center gap-2 mt-2">
            <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500">Zielfakt</span>
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
              style={{
                fontFamily: "Georgia, serif",
                background: won ? C.ziel : "rgba(31,122,99,0.10)",
                color: won ? "#fff" : C.ziel,
                border: `1px solid ${C.ziel}`,
              }}
            >
              {won && <Check size={11} />} {goal.name}
            </span>
          </div>
        </section>

        {/* Tiefen-Regler */}
        {mission.depths.length > 1 && (
          <section className="mb-5">
            <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.14em" }} className="text-[11px] uppercase text-slate-500">
              Starttiefe
            </span>
            <div className="flex flex-wrap gap-2 mt-2 items-center">
              {mission.depths.map((d, i) => {
                const active = i === depth;
                return (
                  <button
                    key={d.label}
                    onClick={() => loadMission(missionId, i)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors border"
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      background: active ? C.fakt : "rgba(255,255,255,0.5)",
                      color: active ? "#fff" : C.ink,
                      borderColor: active ? C.fakt : "#B7C3CF",
                    }}
                  >
                    {i + 1}. {d.label}
                  </button>
                );
              })}
              <span className="text-[11px] text-slate-400 ml-1">weiter rechts = weniger geschenkt</span>
            </div>
          </section>
        )}

        {/* Werkbank: Fakten + Regeln */}
        <section className="grid gap-4 md:grid-cols-2 mb-4">
          {/* Bewiesene Fakten */}
          <div className="rounded-2xl p-3 border-2 border-dashed" style={{ borderColor: "#B7C3CF", background: "rgba(255,255,255,0.35)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span style={{ background: C.fakt, width: 10, height: 10, borderRadius: 3 }} />
              <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.12em" }} className="text-[11px] uppercase text-slate-500">
                Bewiesene Fakten
              </span>
              <span className="text-[11px] text-slate-400 ml-auto">{selected.length} ausgewählt</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {have.map((id) => (
                <FactTile
                  key={id}
                  fact={FACTS[id]}
                  isGoal={id === mission.goal}
                  selected={selected.includes(id)}
                  flash={flash === id}
                  onClick={() => toggleFact(id)}
                />
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2" style={{ fontFamily: "Georgia, serif" }}>
              Fakten antippen, um sie als Prämissen zu wählen.
            </p>
          </div>

          {/* Schlussregeln */}
          <div className="rounded-2xl p-3 border-2 border-dashed" style={{ borderColor: "#C9BEE0", background: "rgba(107,78,158,0.05)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span style={{ background: C.regel, width: 10, height: 10, borderRadius: 3 }} />
              <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.12em" }} className="text-[11px] uppercase text-slate-500">
                Schlussregeln — anwenden
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {mission.pool.rules.map((id) => (
                <RuleTile key={id} rule={RULES[id]} disabled={won} onClick={() => applyRule(id)} />
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2" style={{ fontFamily: "Georgia, serif" }}>
              Regel antippen, um sie auf die ausgewählten Fakten anzuwenden.
            </p>
          </div>
        </section>

        {/* Feedback */}
        <div className="min-h-[40px] mb-4 flex items-center gap-3">
          {feedback && <Feedback fb={feedback} />}
          <button
            onClick={resetMission}
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors ml-auto"
            style={{ fontFamily: "ui-monospace, monospace" }}
          >
            <RotateCcw size={12} /> zurücksetzen
          </button>
        </div>

        {/* Erfolg */}
        {won && (
          <div className="mb-5 rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: "rgba(31,122,99,0.10)", border: `1px solid ${C.ziel}` }}>
            <div className="mt-0.5 shrink-0 rounded-full p-1" style={{ background: C.ziel }}>
              <Sparkles size={14} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: "Georgia, serif", color: C.ziel }} className="text-lg font-semibold">Beweis geschafft.</div>
              <p className="text-sm text-slate-700 mt-0.5">
                Du hast das Ziel <b>{goal.name}</b> in {log.filter((l) => !l.sackgasse).length} Schritten erreicht. Das Protokoll unten ist dein zusammengesetzter Beweis.
              </p>
            </div>
          </div>
        )}

        {/* Beweisprotokoll */}
        <section>
          <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.14em" }} className="text-[11px] uppercase text-slate-500">
            Beweisprotokoll
          </span>
          {log.length === 0 ? (
            <p className="text-xs text-slate-400 mt-2" style={{ fontFamily: "Georgia, serif" }}>noch keine Schritte</p>
          ) : (
            <ol className="mt-2 space-y-1.5">
              {log.map((step, i) => (
                <li key={i} className="flex items-center gap-2 text-sm flex-wrap" style={{ opacity: step.sackgasse ? 0.55 : 1 }}>
                  <span
                    className="inline-flex items-center justify-center rounded-full shrink-0 text-[10px]"
                    style={{ width: 18, height: 18, background: step.sackgasse ? C.sack : C.ziel, color: "#fff", fontFamily: "ui-monospace, monospace" }}
                  >
                    {i + 1}
                  </span>
                  {step.premises.map((p) => (
                    <span key={p} style={{ fontFamily: "Georgia, serif" }} className="text-slate-600">{FACTS[p].name}</span>
                  ))}
                  <ChevronRight size={13} className="text-slate-400" />
                  <span className="rounded px-1.5 py-0.5 text-[11px]" style={{ background: "rgba(107,78,158,0.12)", color: C.regel, fontFamily: "ui-monospace, monospace" }}>
                    {RULES[step.rule].name}
                  </span>
                  <ChevronRight size={13} className="text-slate-400" />
                  <span style={{ fontFamily: "Georgia, serif", color: step.sackgasse ? C.sack : C.fakt }} className="font-semibold">
                    {FACTS[step.produces].name}
                  </span>
                  {step.sackgasse && <span className="text-[10px] text-slate-400">(Sackgasse)</span>}
                </li>
              ))}
            </ol>
          )}
        </section>

        <footer className="mt-8 text-[11px] text-slate-400" style={{ fontFamily: "ui-monospace, monospace" }}>
          Prototyp · Beweise als Inferenzketten. Distraktoren, Ordnungszwang, Regelwahl und Tiefen-Regler aktiv.
        </footer>
      </div>
    </div>
  );
}

/* --- Kacheln -------------------------------------------------------- */
function FactTile({ fact, isGoal, selected, flash, onClick }) {
  const dead = fact.role === "sackgasse";
  const base = dead ? C.sack : isGoal ? C.ziel : C.fakt;
  const hi = dead ? "#B4BEC8" : isGoal ? C.zielHi : C.faktHi;
  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl transition-all"
      style={{
        background: `linear-gradient(160deg, ${hi}, ${base})`,
        color: "#fff",
        padding: "8px 12px",
        minWidth: 132,
        border: selected ? "2px solid #1B2430" : "2px solid rgba(255,255,255,0.18)",
        boxShadow: selected
          ? `0 0 0 3px ${C.warn}, 0 2px 0 rgba(0,0,0,0.18)`
          : flash
          ? `0 0 14px ${hi}, 0 2px 0 rgba(0,0,0,0.18)`
          : "0 2px 0 rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25)",
        cursor: "pointer",
        transform: flash ? "scale(1.04)" : "scale(1)",
      }}
    >
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.14em", opacity: 0.8 }} className="uppercase mb-0.5">
        {dead ? "Sackgasse" : isGoal ? "Ziel" : "Fakt"}
      </div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.1 }} className="font-semibold">{fact.name}</div>
      <div style={{ fontSize: 10.5, opacity: 0.9, marginTop: 2 }}>{fact.sub}</div>
    </button>
  );
}

function RuleTile({ rule, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-left rounded-xl transition-all"
      style={{
        background: `linear-gradient(160deg, ${C.regelHi}, ${C.regel})`,
        color: "#fff",
        padding: "8px 12px",
        minWidth: 132,
        border: "2px solid rgba(255,255,255,0.18)",
        boxShadow: "0 2px 0 rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.14em", opacity: 0.8 }} className="uppercase mb-0.5">
        Regel
      </div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.1 }} className="font-semibold">{rule.name}</div>
      <div style={{ fontSize: 10.5, opacity: 0.9, marginTop: 2 }}>{rule.sub}</div>
    </button>
  );
}

function Feedback({ fb }) {
  const good = fb.status === "success";
  const warn = fb.status === "sackgasse";
  const color = good ? C.ziel : warn ? C.warn : "#B4472E";
  const Icon = good ? Check : warn ? AlertTriangle : AlertTriangle;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color }}>
      <Icon size={13} /> {fb.message}
    </span>
  );
}
