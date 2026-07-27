import React, { useMemo, useRef, useState, useEffect } from "react";
import { Check, RotateCcw, ChevronRight, Sparkles, Hammer, BookOpen } from "lucide-react";
import { FACTS, RULES, MISSIONS } from "./data.js";
import { craftFromCluster } from "./engine.js";

// Missionen nach Übungsnummer sortieren (Basis ohne Kürzel zuerst)
const missionCode = (t) => {
  const m = t.match(/^Ü(\d+)\.(\d+)/);
  return m ? [Number(m[1]), Number(m[2])] : [-1, -1];
};
const MISSIONS_SORTED = [...MISSIONS].sort((a, b) => {
  const [ca, ea] = missionCode(a.title);
  const [cb, eb] = missionCode(b.title);
  return ca - cb || ea - eb;
});

/* --- Farbwelt (konsistent mit dem Struktur-Baukasten) --------------- */
const C = {
  paper: "#EAEEF2",
  dot: "#C4D0DB",
  ink: "#1B2430",
  fakt: "#31597F",
  faktHi: "#4E7BA6",
  regel: "#6B4E9E",
  regelHi: "#8A6BC0",
  ziel: "#1F7A63",
  zielHi: "#2FA588",
  warn: "#B26A1E",
  begriff: "#4C4BA6", // Indigo — deutlich von Regel-Violett und Fakt-Blau unterscheidbar
  begriffHi: "#6E6BD0",
};

const TILE_W = 150;

// Stufen einer Mission: erst die Begriffs-Definitionen, dann der Beweis.
function stagesOf(mission) {
  const vocab = (mission.vocab || []).map((v) => ({
    kind: "vocab", term: v.term, goal: v.goal, prompt: v.prompt, note: v.note,
    pool: v.pool, steps: v.steps, given: v.given,
  }));
  const proof = {
    kind: "beweis", goal: mission.goal, claim: mission.claim, ref: mission.ref,
    pool: mission.pool, steps: mission.steps, depths: mission.depths,
  };
  return [...vocab, proof];
}

export default function BeweisCrafter({ initialId, onOutcome, initialDepth = null }) {
  const [missionId, setMissionId] = useState(() => (initialId && MISSIONS.some((m) => m.id === initialId) ? initialId : MISSIONS[0].id));
  const [stageIdx, setStageIdx] = useState(0);
  // Von der Karteikarte vorgegebene Stufe: 0 = viel gegeben, höher = von vorn
  const [depth, setDepth] = useState(initialDepth ?? 0);
  // Startaussagen der zunächst gewählten Mission — sonst stünde die Werkbank
  // beim direkten Öffnen (Navigation, ohne initialId) ohne Prämissen da.
  const [have, setHave] = useState(() => {
    const m = MISSIONS.find((x) => x.id === (initialId && MISSIONS.some((y) => y.id === initialId) ? initialId : MISSIONS[0].id));
    const st = stagesOf(m)[0];
    if (st.kind !== "beweis") return st.given.slice();
    return st.depths[Math.min(initialDepth ?? 0, st.depths.length - 1)].given.slice();
  });
  const [bench, setBench] = useState([]);
  const [snapping, setSnapping] = useState(false);
  const [flash, setFlash] = useState(null);
  const [hint, setHint] = useState("");
  const [fails, setFails] = useState(0); // fehlgeschlagene Hammer-Versuche auf dieser Stufe
  const [lastIdea, setLastIdea] = useState(null);
  const [protocol, setProtocol] = useState([]);

  const benchRef = useRef(null);
  const uidRef = useRef(1);
  const reduce = useRef(false);
  const missionFails = useRef(0); // Fehlversuche über die ganze Mission (Messwert)
  const reported = useRef(false); // Ergebnis dieser Mission schon gemeldet?
  useEffect(() => { reduce.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches; }, []);

  const mission = useMemo(() => MISSIONS.find((x) => x.id === missionId), [missionId]);
  const stages = useMemo(() => stagesOf(mission), [mission]);
  const stage = stages[Math.min(stageIdx, stages.length - 1)];
  const isProof = stage.kind === "beweis";

  const stageGiven = (i, d) => {
    const s = stages[i];
    return s.kind === "beweis" ? s.depths[Math.min(d, s.depths.length - 1)].given : s.given;
  };

  // Missionen mit Begriffs-Gate starten den Beweis auf mittlerer Tiefe,
  // damit der Beweis nach dem Gate nicht trivial kurz ausfällt.
  const defaultProofDepth = (m) => (m.vocab ? Math.min(1, m.depths.length - 1) : 0);

  // Initialisierung bei Mission-Wechsel
  const loadMission = (id) => {
    const m = MISSIONS.find((x) => x.id === id);
    const st = stagesOf(m);
    setMissionId(id);
    setStageIdx(0);
    // von der Karteikarte vorgegebene Stufe hat Vorrang
    const d = initialDepth ?? defaultProofDepth(m);
    setDepth(d);
    setHave(st[0].kind === "beweis"
      ? st[0].depths[Math.min(d, st[0].depths.length - 1)].given.slice()
      : st[0].given.slice());
    setBench([]); setProtocol([]); setHint(""); setLastIdea(null); setFlash(null); setFails(0);
    missionFails.current = 0; reported.current = false;
  };

  // Aus der Bibliothek angeforderte Mission laden
  useEffect(() => {
    if (initialId && MISSIONS.some((m) => m.id === initialId)) loadMission(initialId);
  }, [initialId]); // eslint-disable-line
  const goToStage = (i) => {
    if (i >= stages.length) return;
    setStageIdx(i);
    setHave(stageGiven(i, depth).slice());
    setBench([]); setProtocol([]); setHint(""); setLastIdea(null); setFlash(null); setFails(0);
  };
  const setProofDepth = (d) => {
    setDepth(d);
    setHave(stages[stageIdx].depths[Math.min(d, stages[stageIdx].depths.length - 1)].given.slice());
    setBench([]); setProtocol([]); setHint(""); setLastIdea(null); setFlash(null); setFails(0);
  };
  const resetStage = () => {
    setHave(stageGiven(stageIdx, depth).slice());
    setBench([]); setProtocol([]); setHint(""); setLastIdea(null); setFlash(null); setFails(0);
  };
  const clearBench = () => { setBench([]); setHint(""); };

  const haveSet = useMemo(() => new Set(have), [have]);
  const givenSet = useMemo(() => new Set(stageGiven(stageIdx, depth)), [stageIdx, depth, missionId]); // eslint-disable-line
  const stageWon = haveSet.has(stage.goal);
  const missionWon = isProof && stageWon;
  const goal = FACTS[stage.goal];

  // Begriffs-Stufe geschafft → automatisch zur nächsten Stufe
  useEffect(() => {
    if (!isProof && stageWon) {
      const t = setTimeout(() => goToStage(stageIdx + 1), reduce.current ? 250 : 1000);
      return () => clearTimeout(t);
    }
  }, [stageWon, isProof, stageIdx]); // eslint-disable-line

  // Beweis geschafft → gemessenes Ergebnis (Fehlversuche) einmalig melden
  useEffect(() => {
    if (missionWon && !reported.current) { reported.current = true; onOutcome?.(missionId, missionFails.current); }
  }, [missionWon, missionId, onOutcome]);

  const paperBg = {
    backgroundColor: C.paper,
    backgroundImage: `radial-gradient(${C.dot} 1.3px, transparent 1.3px)`,
    backgroundSize: "22px 22px",
  };

  // --- Raster-Werkbank: Bausteine in Zellen legen, dann Hammer -----------
  // Kapazität = größter Schritt (Regel + Prämissen) + etwas Luft, mind. 6.
  const gridCap = useMemo(() => {
    const maxStep = stage.steps.length ? Math.max(...stage.steps.map((s) => s.premises.length + 1)) : 3;
    return Math.max(6, maxStep + 2);
  }, [stage]);

  const firstEmptyCell = (items) => {
    const used = new Set(items.map((b) => b.cell));
    for (let i = 0; i < gridCap; i++) if (!used.has(i)) return i;
    return -1;
  };

  const addByTap = (kind, id) => {
    if (snapping) return;
    setBench((prev) => {
      const cell = firstEmptyCell(prev);
      if (cell === -1) return prev; // voll
      return [...prev, { uid: uidRef.current++, kind, id, cell }];
    });
    setHint("");
  };
  const removeUid = (uid) => { if (!snapping) { setBench((prev) => prev.filter((b) => b.uid !== uid)); setHint(""); } };

  const build = () => {
    if (snapping || bench.length === 0) return;
    // lagenunabhängig: alle abgelegten Bausteine bilden die Verknüpfung
    const res = craftFromCluster(stage, haveSet, bench.map((t) => ({ kind: t.kind, id: t.id })));
    if (res.ok) return fuse(res);
    const nf = fails + 1;
    setFails(nf);
    missionFails.current += 1;
    if (nf >= 3 && stage.steps.length) {
      const minPieces = Math.min(...stage.steps.map((s) => s.premises.length + 1));
      setHint(`Tipp: die kleinste Verknüpfung hier braucht ${minPieces} Bausteine — genau 1 Regel und ${minPieces - 1} ${isProof ? "Aussage(n)" : "Bestandteil(e)"}.`);
    } else {
      setHint(bench.length > 1 ? "Das rastet nicht ein — andere Regel oder andere Bausteine?" : (isProof ? "Regel + passende Aussagen ablegen, dann Hammer." : "Bestandteile + „:=“ ablegen, dann Hammer."));
    }
  };

  const fuse = (res) => {
    setHint(""); setFails(0); setSnapping(true);
    const delay = reduce.current ? 60 : 560;
    setTimeout(() => {
      setHave((h) => (h.includes(res.produces) ? h : [...h, res.produces]));
      setProtocol((p) => [...p, { rule: res.rule, premises: res.premises, produces: res.produces, idea: res.idea }]);
      setLastIdea(res.idea || null);
      setFlash(res.produces);
      // verbrauchte Zellen leeren, Ergebnis in die erste Zelle legen
      setBench([{ uid: uidRef.current++, kind: "fakt", id: res.produces, cell: 0 }]);
      setSnapping(false);
      setTimeout(() => setFlash((f) => (f === res.produces ? null : f)), 900);
    }, delay);
  };

  const factLabel = (id) => {
    const f = FACTS[id];
    if (id === stage.goal) return "Ziel";
    if (f.role === "begriff") return "Begriff";
    if (f.tag) return f.tag; // atomarer Baustein: "Menge" / "Verknüpfung"
    return givenSet.has(id) ? "gegeben" : "gefolgert";
  };

  return (
    <div style={{ ...paperBg, color: C.ink, minHeight: "100%", fontFamily: "system-ui, sans-serif" }} className="w-full">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Kopf */}
        <header className="mb-5">
          <div style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.18em" }} className="text-[11px] uppercase text-slate-500 mb-1">
            Elementargeometrie · Beweise
          </div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl sm:text-4xl font-semibold leading-tight">Beweis-Baukasten</h1>
        </header>

        {/* Missionswahl — gleichmäßige Karten mit Kürzel-Badge */}
        <section className="mb-4">
          <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.14em" }} className="text-[11px] uppercase text-slate-500">Beweis wählen</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {MISSIONS_SORTED.map((m) => {
              const active = m.id === missionId;
              const parts = m.title.split(" — ");
              const hasCode = parts.length > 1;
              const code = hasCode ? parts[0] : "Basis";
              const name = hasCode ? parts.slice(1).join(" — ") : m.title;
              return (
                <button key={m.id} onClick={() => loadMission(m.id)} aria-pressed={active}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors border"
                  style={{ background: active ? C.ziel : "#fff", color: active ? "#fff" : C.ink, borderColor: active ? C.ziel : "#C4D0DB" }}>
                  <span className="shrink-0 inline-flex items-center justify-center rounded-lg text-[11px] font-semibold"
                    style={{ fontFamily: "ui-monospace, monospace", minWidth: 44, padding: "4px 6px",
                      background: active ? "rgba(255,255,255,0.22)" : "rgba(31,122,99,0.10)",
                      color: active ? "#fff" : C.ziel }}>
                    {code}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm leading-snug" style={{ fontFamily: "Georgia, serif" }}>{name}</span>
                    {m.vocab && (
                      <span className="inline-flex items-center gap-1 mt-0.5 text-[10px]"
                        style={{ fontFamily: "ui-monospace, monospace", color: active ? "rgba(255,255,255,0.85)" : C.begriff }}>
                        <BookOpen size={10} /> Begriffs-Check
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Stufen-Anzeige (nur wenn es einen Begriffs-Check gibt) */}
        {stages.length > 1 && (
          <section className="mb-4 flex items-center gap-1.5 flex-wrap">
            {stages.map((s, i) => {
              const done = i < stageIdx;
              const cur = i === stageIdx;
              const label = s.kind === "vocab" ? s.term : "Beweis";
              return (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight size={13} className="text-slate-400" />}
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] border"
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      background: cur ? (s.kind === "vocab" ? C.begriff : C.ziel) : done ? "rgba(31,122,99,0.10)" : "rgba(255,255,255,0.5)",
                      color: cur ? "#fff" : done ? C.ziel : "#5b6875",
                      borderColor: cur ? (s.kind === "vocab" ? C.begriff : C.ziel) : done ? C.ziel : "#B7C3CF",
                      opacity: i > stageIdx ? 0.5 : 1, // kommende Stufen gedämpft
                    }}>
                    {done && <Check size={11} />}
                    {s.kind === "vocab" && <BookOpen size={11} />}
                    {label}
                  </span>
                </React.Fragment>
              );
            })}
          </section>
        )}

        {/* Aufgaben-Panel: Begriff bauen ODER Beweisziel */}
        {isProof ? (
          <section className="mb-4 rounded-xl px-4 py-3" style={{ background: missionWon ? "rgba(31,122,99,0.10)" : "rgba(255,255,255,0.55)", border: `1px solid ${missionWon ? C.ziel : "#B7C3CF"}` }}>
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500">Zu zeigen</span>
              <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] text-slate-400">{stage.ref}</span>
              {missionWon && <span className="inline-flex items-center gap-1 ml-auto text-xs font-medium" style={{ color: C.ziel }}><Check size={13} /> Beweis vollständig</span>}
            </div>
            <p className="text-sm text-slate-800 mt-1" style={{ fontFamily: "Georgia, serif" }}>{stage.claim}</p>
            <div className="flex items-center gap-2 mt-2">
              <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500">Zielaussage</span>
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs" style={{ fontFamily: "Georgia, serif", background: missionWon ? C.ziel : "rgba(31,122,99,0.10)", color: missionWon ? "#fff" : C.ziel, border: `1px solid ${C.ziel}` }}>
                {missionWon && <Check size={11} />} {goal.name}
              </span>
            </div>
            {mission.vocab && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px]">
                <BookOpen size={12} style={{ color: C.begriff }} />
                <span style={{ fontFamily: "ui-monospace, monospace" }} className="uppercase tracking-wider text-slate-500">Begriffe:</span>
                {mission.vocab.map((v) => (
                  <span key={v.term} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5"
                    style={{ background: "rgba(76,75,166,0.10)", color: C.begriff, border: `1px solid ${C.begriff}` }}>
                    <Check size={10} /> <b>{v.term}</b> := {FACTS[v.goal].sub}
                  </span>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="mb-4 rounded-xl px-4 py-3" style={{ background: "rgba(138,107,192,0.08)", border: `1px solid ${C.begriff}` }}>
            <div className="flex items-center gap-2 flex-wrap">
              <BookOpen size={13} style={{ color: C.begriff }} />
              <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500">Begriffs-Check</span>
            </div>
            <p className="text-sm text-slate-800 mt-1" style={{ fontFamily: "Georgia, serif" }}>{stage.prompt}</p>
            <div className="flex items-center gap-2 mt-2">
              <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500">Begriff</span>
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs" style={{ fontFamily: "Georgia, serif", background: stageWon ? C.begriff : "rgba(138,107,192,0.12)", color: stageWon ? "#fff" : C.begriff, border: `1px solid ${C.begriff}` }}>
                {stageWon && <Check size={11} />} {goal.name}
              </span>
            </div>
          </section>
        )}

        {/* Tiefen-Regler (nur Beweis-Stufe) */}
        {isProof && stage.depths.length > 1 && (
          <section className="mb-5">
            <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.14em" }} className="text-[11px] uppercase text-slate-500">Starttiefe</span>
            <div className="flex flex-wrap gap-2 mt-2 items-center">
              {stage.depths.map((d, i) => {
                const active = i === depth;
                return (
                  <button key={d.label} onClick={() => setProofDepth(i)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors border"
                    style={{ fontFamily: "ui-monospace, monospace", background: active ? C.fakt : "rgba(255,255,255,0.5)", color: active ? "#fff" : C.ink, borderColor: active ? C.fakt : "#B7C3CF" }}>
                    {i + 1}. {d.label}
                  </button>
                );
              })}
              <span className="text-[11px] text-slate-400 ml-1">weiter rechts = weniger geschenkt</span>
            </div>
          </section>
        )}

        {/* WERKBANK */}
        <section className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.14em" }} className="text-[11px] uppercase text-slate-500">Werkbank</span>
            <button onClick={clearBench} className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors" style={{ fontFamily: "ui-monospace, monospace" }}>
              <RotateCcw size={12} /> leeren
            </button>
          </div>
          {/* Raster: Bausteine aus den Vorräten hier ablegen (tippen), Zelle antippen leert sie */}
          <div ref={benchRef} className="rounded-2xl border-2 border-dashed p-2"
            style={{ borderColor: "#B7C3CF", background: "rgba(255,255,255,0.35)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
              {Array.from({ length: gridCap }).map((_, cell) => {
                const item = bench.find((b) => b.cell === cell);
                if (item) {
                  const isRule = item.kind === "regel";
                  const face = isRule ? RULES[item.id] : FACTS[item.id];
                  return (
                    <button key={cell} onClick={() => removeUid(item.uid)} title="antippen leert die Zelle"
                      className="text-left" style={{ filter: snapping ? `drop-shadow(0 0 10px ${isRule ? C.regelHi : C.faktHi})` : "none", cursor: "pointer" }}>
                      <TileFace kind={item.kind} block={face} isGoal={!isRule && item.id === stage.goal} flash={flash === item.id} label={!isRule ? factLabel(item.id) : undefined} full />
                    </button>
                  );
                }
                return (
                  <div key={cell} className="rounded-xl" style={{ minHeight: 62, background: "rgba(27,36,48,0.03)", border: "1px dashed #C4D0DB" }} />
                );
              })}
            </div>
            {bench.length === 0 && (
              <p className="text-sm text-slate-400 text-center px-6 py-3" style={{ fontFamily: "Georgia, serif" }}>leer</p>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2 min-h-[52px]">
            <button onClick={build} disabled={bench.length === 0 || snapping}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium select-none transition-all"
              style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.04em",
                background: bench.length === 0 || snapping ? "#C4D0DB" : C.ziel, color: bench.length === 0 || snapping ? "#8595a4" : "#fff",
                cursor: bench.length === 0 || snapping ? "default" : "pointer", boxShadow: bench.length === 0 || snapping ? "none" : "0 2px 0 rgba(0,0,0,0.18)" }}>
              <Hammer size={16} /> Hammer
            </button>
            {hint ? (
              <p className="text-xs" style={{ color: C.warn }}>{hint}</p>
            ) : lastIdea ? (
              <p className="text-xs inline-flex items-center gap-1.5" style={{ color: C.ziel }}>
                <Check size={13} /> <span>Gerade gezeigt: <b>{lastIdea}</b></span>
              </p>
            ) : null}
          </div>
        </section>

        {/* Begriff geschafft (Zwischen-Toast) */}
        {!isProof && stageWon && (
          <div className="mb-5 rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: "rgba(138,107,192,0.10)", border: `1px solid ${C.begriff}` }}>
            <div className="mt-0.5 shrink-0 rounded-full p-1" style={{ background: C.begriff }}><Check size={14} color="#fff" /></div>
            <div>
              <div style={{ fontFamily: "Georgia, serif", color: C.begriff }} className="text-base font-semibold">Begriff sitzt: {goal.name}.</div>
              {stage.note && <p className="text-sm text-slate-700 mt-0.5">{stage.note}</p>}
            </div>
          </div>
        )}

        {/* Beweis geschafft */}
        {missionWon && (
          <div className="mb-5 rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: "rgba(31,122,99,0.10)", border: `1px solid ${C.ziel}` }}>
            <div className="mt-0.5 shrink-0 rounded-full p-1" style={{ background: C.ziel }}><Sparkles size={14} color="#fff" /></div>
            <div>
              <div style={{ fontFamily: "Georgia, serif", color: C.ziel }} className="text-lg font-semibold">Beweis geschafft.</div>
              <p className="text-sm text-slate-700 mt-0.5">Du hast <b>{goal.name}</b> in {protocol.length} Schritten hergeleitet.</p>
              {protocol.some((s) => s.idea) && (
                <p className="text-sm text-slate-700 mt-1.5" style={{ fontFamily: "Georgia, serif" }}>
                  <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500 mr-1.5">Beweis-Idee</span>
                  {protocol.map((s) => s.idea).filter(Boolean).join(" → ")}.
                </p>
              )}
            </div>
          </div>
        )}

        {/* VORRÄTE */}
        <section className="grid gap-4 md:grid-cols-2 mb-4">
          <Shelf title={isProof ? "Bekannte Aussagen" : "Bestandteile"} dot={C.fakt}>
            {have.map((id) => (
              <PaletteTile key={id} kind="fakt" block={FACTS[id]} isGoal={id === stage.goal} label={factLabel(id)} onTap={() => addByTap("fakt", id)} />
            ))}
          </Shelf>
          <Shelf title="Schlussregeln" dot={C.regel}>
            {stage.pool.rules.map((id) => (
              <PaletteTile key={id} kind="regel" block={RULES[id]} onTap={() => addByTap("regel", id)} />
            ))}
          </Shelf>
        </section>

        {/* Beweisprotokoll */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.14em" }} className="text-[11px] uppercase text-slate-500">
              {isProof ? "Beweisprotokoll" : "Begriffs-Protokoll"}
            </span>
            <button onClick={resetStage} className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors ml-auto" style={{ fontFamily: "ui-monospace, monospace" }}>
              <RotateCcw size={12} /> Stufe zurücksetzen
            </button>
          </div>
          {protocol.length === 0 ? (
            <p className="text-xs text-slate-400" style={{ fontFamily: "Georgia, serif" }}>—</p>
          ) : (
            <ol className="space-y-2.5">
              {protocol.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="inline-flex items-center justify-center rounded-full shrink-0 text-[10px] mt-0.5" style={{ width: 18, height: 18, background: C.ziel, color: "#fff", fontFamily: "ui-monospace, monospace" }}>{i + 1}</span>
                  <div className="min-w-0">
                    {step.idea && <div style={{ fontFamily: "Georgia, serif" }} className="text-sm text-slate-800 font-medium">{step.idea}</div>}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400 mt-0.5" style={{ fontFamily: "ui-monospace, monospace" }}>
                      {step.premises.map((p, k) => (
                        <React.Fragment key={p}>{k > 0 && <span>,</span>}<span>{FACTS[p].name}</span></React.Fragment>
                      ))}
                      <ChevronRight size={11} />
                      <span style={{ color: C.regel }}>{RULES[step.rule].name}</span>
                      <ChevronRight size={11} />
                      <span style={{ color: C.fakt }} className="font-semibold">{FACTS[step.produces].name}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

      </div>

    </div>
  );
}

function Shelf({ title, dot, children }) {
  const empty = React.Children.count(children) === 0;
  return (
    <div className="rounded-2xl p-3 border-2 border-dashed" style={{ borderColor: "#B7C3CF", background: "rgba(255,255,255,0.35)" }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ background: dot, width: 10, height: 10, borderRadius: 3 }} />
        <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.12em" }} className="text-[11px] uppercase text-slate-500">{title}</span>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
      {empty && <p className="text-[11px] text-slate-400 mt-1" style={{ fontFamily: "Georgia, serif" }}>—</p>}
    </div>
  );
}

function PaletteTile({ kind, block, isGoal, label, onTap }) {
  return (
    <button onClick={onTap} title="antippen → auf die Werkbank" style={{ cursor: "pointer", textAlign: "left" }}>
      <TileFace kind={kind} block={block} isGoal={isGoal} label={label} />
    </button>
  );
}

function TileFace({ kind, block, isGoal, label, lifted, flash, full }) {
  const isRule = kind === "regel";
  const isBegriff = !isRule && block.role === "begriff";
  const base = isRule ? C.regel : isGoal ? C.ziel : isBegriff ? C.begriff : C.fakt;
  const hi = isRule ? C.regelHi : isGoal ? C.zielHi : isBegriff ? C.begriffHi : C.faktHi;
  const tag = isRule ? (block.tag || "Regel") : label || block.tag || (isGoal ? "Ziel" : isBegriff ? "Begriff" : "Aussage");
  return (
    <div style={{
      background: `linear-gradient(160deg, ${hi}, ${base})`, color: "#fff", borderRadius: 12, padding: "9px 13px",
      minWidth: full ? 0 : TILE_W - 8, width: full ? "100%" : undefined, minHeight: full ? 62 : undefined,
      boxShadow: lifted ? "0 12px 28px rgba(0,0,0,0.28)" : flash ? `0 0 14px ${hi}, 0 2px 0 rgba(0,0,0,0.18)` : "0 2px 0 rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25)",
      border: "1px solid rgba(255,255,255,0.18)", transform: flash ? "scale(1.04)" : "scale(1)", transition: "transform .2s ease",
    }}>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.14em", opacity: 0.8 }} className="uppercase mb-0.5">{tag}</div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.12 }} className="font-semibold">{block.name}</div>
      {block.sub ? <div style={{ fontSize: 10.5, opacity: 0.9, marginTop: 2 }}>{block.sub}</div> : null}
    </div>
  );
}
