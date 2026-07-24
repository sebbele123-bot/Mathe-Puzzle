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

const TILE_W = 150, TILE_H = 78, GAP = 46, SNAP = 48;

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

export default function BeweisCrafter({ initialId }) {
  const [missionId, setMissionId] = useState(() => (initialId && MISSIONS.some((m) => m.id === initialId) ? initialId : MISSIONS[0].id));
  const [stageIdx, setStageIdx] = useState(0);
  const [depth, setDepth] = useState(0);
  const [have, setHave] = useState([]);
  const [bench, setBench] = useState([]);
  const [drag, setDrag] = useState(null);
  const [snapping, setSnapping] = useState(false);
  const [flash, setFlash] = useState(null);
  const [hint, setHint] = useState("");
  const [fails, setFails] = useState(0); // fehlgeschlagene Hammer-Versuche auf dieser Stufe
  const [lastIdea, setLastIdea] = useState(null);
  const [protocol, setProtocol] = useState([]);

  const benchRef = useRef(null);
  const uidRef = useRef(1);
  const reduce = useRef(false);
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
    setDepth(defaultProofDepth(m));
    setHave(st[0].kind === "beweis" ? st[0].depths[0].given.slice() : st[0].given.slice());
    setBench([]); setProtocol([]); setHint(""); setLastIdea(null); setFlash(null); setFails(0);
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

  const paperBg = {
    backgroundColor: C.paper,
    backgroundImage: `radial-gradient(${C.dot} 1.3px, transparent 1.3px)`,
    backgroundSize: "22px 22px",
  };

  // --- Cluster ---
  const clustersOf = (items) => {
    const near = (a, b) => Math.abs(a.x - b.x) < TILE_W + GAP && Math.abs(a.y - b.y) < TILE_H + GAP;
    const seen = new Set(), groups = [];
    for (const it of items) {
      if (seen.has(it.uid)) continue;
      const stack = [it], group = [];
      seen.add(it.uid);
      while (stack.length) {
        const cur = stack.pop(); group.push(cur);
        for (const other of items) if (!seen.has(other.uid) && near(cur, other)) { seen.add(other.uid); stack.push(other); }
      }
      groups.push(group);
    }
    return groups;
  };

  const build = () => {
    if (snapping) return;
    const groups = clustersOf(bench);
    for (const g of groups) {
      const res = craftFromCluster(stage, haveSet, g.map((t) => ({ kind: t.kind, id: t.id })));
      if (res.ok) return fuse(g, res);
    }
    const hasPair = groups.some((g) => g.length > 1);
    const nf = fails + 1;
    setFails(nf);
    // gestufter Tipp: erst neutral, ab dem 3. Fehlversuch die nötige Bausteinzahl
    // verraten (nicht welche) — Scaffolding ohne die Lösung preiszugeben.
    if (nf >= 3 && stage.steps.length) {
      const minPieces = Math.min(...stage.steps.map((s) => s.premises.length + 1));
      setHint(`Tipp: die kleinste Verknüpfung hier braucht ${minPieces} Bausteine — genau 1 Regel und ${minPieces - 1} ${isProof ? "Aussage(n)" : "Bestandteil(e)"}.`);
    } else {
      setHint(hasPair ? "Das rastet nicht ein — andere Regel oder andere Bausteine?" : (isProof ? "Regel + passende Aussagen zusammenschieben, dann Hammer." : "Bestandteile + „:=“ zusammenschieben, dann Hammer."));
    }
  };

  const fuse = (group, res) => {
    const cx = group.reduce((s, g) => s + g.x, 0) / group.length;
    const cy = group.reduce((s, g) => s + g.y, 0) / group.length;
    const uids = new Set(group.map((g) => g.uid));
    setHint(""); setFails(0); setSnapping(true);
    const delay = reduce.current ? 60 : 640;
    setTimeout(() => {
      setHave((h) => (h.includes(res.produces) ? h : [...h, res.produces]));
      setProtocol((p) => [...p, { rule: res.rule, premises: res.premises, produces: res.produces, idea: res.idea }]);
      setLastIdea(res.idea || null);
      setFlash(res.produces);
      setBench((prev) => [...prev.filter((b) => !uids.has(b.uid)), { uid: uidRef.current++, kind: "fakt", id: res.produces, x: cx, y: cy }]);
      setSnapping(false);
      setTimeout(() => setFlash((f) => (f === res.produces ? null : f)), 900);
    }, delay);
  };

  const addToBenchAt = (kind, id, clientX, clientY) => {
    if (snapping) return;
    const rect = benchRef.current?.getBoundingClientRect();
    const x = rect ? clientX - rect.left : 60, y = rect ? clientY - rect.top : 60;
    const uid = uidRef.current++;
    setBench((prev) => [...prev, { uid, kind, id, x, y }]);
    setHint("");
    requestAnimationFrame(() => snapMagnet(uid));
  };
  const addByTap = (kind, id) => {
    if (snapping) return;
    const rect = benchRef.current?.getBoundingClientRect();
    const w = rect ? rect.width : 400, h = rect ? rect.height : 300;
    setBench((prev) => {
      const n = prev.length;
      const x = Math.min(110 + (n % 4) * 92, w - 60), y = Math.min(70 + Math.floor(n / 4) * 92, h - 50);
      return [...prev, { uid: uidRef.current++, kind, id, x, y }];
    });
    setHint("");
  };
  const removeUid = (uid) => { if (!snapping) { setBench((prev) => prev.filter((b) => b.uid !== uid)); setHint(""); } };

  const snapMagnet = (uid) => {
    setBench((prev) => {
      const me = prev.find((b) => b.uid === uid);
      if (!me) return prev;
      let best = null, bestD = Infinity;
      for (const other of prev) {
        if (other.uid === uid) continue;
        const dx = me.x - other.x, dy = me.y - other.y;
        const gapX = Math.abs(dx) - TILE_W, gapY = Math.abs(dy) - TILE_H, d = Math.hypot(dx, dy);
        if (Math.abs(dy) < TILE_H && gapX < SNAP && d < bestD) { bestD = d; best = { other, axis: "x", dir: Math.sign(dx) || 1 }; }
        else if (Math.abs(dx) < TILE_W && gapY < SNAP && d < bestD) { bestD = d; best = { other, axis: "y", dir: Math.sign(dy) || 1 }; }
      }
      if (!best) return prev;
      const o = best.other;
      const target = best.axis === "x" ? { x: o.x + best.dir * TILE_W, y: o.y } : { x: o.x, y: o.y + best.dir * TILE_H };
      return prev.map((b) => (b.uid === uid ? { ...b, x: target.x, y: target.y } : b));
    });
  };

  const startPaletteDrag = (e, kind, id) => {
    if (snapping) return;
    const t = e.touches ? e.touches[0] : e;
    setDrag({ kind: "palette", tileKind: kind, id, x: t.clientX, y: t.clientY, ox: t.clientX, oy: t.clientY });
    setFlash(null);
  };
  const startBenchDrag = (e, item) => {
    if (snapping) return;
    e.stopPropagation();
    const t = e.touches ? e.touches[0] : e;
    const rect = benchRef.current?.getBoundingClientRect();
    const offX = rect ? t.clientX - rect.left - item.x : 0, offY = rect ? t.clientY - rect.top - item.y : 0;
    setDrag({ kind: "bench", id: item.id, uid: item.uid, x: t.clientX, y: t.clientY, ox: t.clientX, oy: t.clientY, offX, offY });
    setFlash(null);
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      const t = e.touches ? e.touches[0] : e;
      setDrag((d) => (d ? { ...d, x: t.clientX, y: t.clientY } : d));
      if (drag.kind === "bench") {
        const rect = benchRef.current?.getBoundingClientRect();
        if (rect) {
          const nx = t.clientX - rect.left - drag.offX, ny = t.clientY - rect.top - drag.offY;
          setBench((prev) => prev.map((b) => (b.uid === drag.uid ? { ...b, x: nx, y: ny } : b)));
        }
      }
      if (e.cancelable) e.preventDefault();
    };
    const up = (e) => {
      const t = e.changedTouches ? e.changedTouches[0] : e;
      const moved = Math.hypot(t.clientX - drag.ox, t.clientY - drag.oy);
      const rect = benchRef.current?.getBoundingClientRect();
      const overBench = rect && t.clientX >= rect.left && t.clientX <= rect.right && t.clientY >= rect.top && t.clientY <= rect.bottom;
      if (drag.kind === "bench") snapMagnet(drag.uid);
      else if (overBench) addToBenchAt(drag.tileKind, drag.id, t.clientX, t.clientY);
      else if (moved < 8) addByTap(drag.tileKind, drag.id);
      setDrag(null);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [drag, bench, snapping]); // eslint-disable-line

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
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Bausteine auf die Werkbank ziehen, zusammenschieben, <b>Hammer</b> — was passt, verschmilzt. Was zusammengehört, verrät das Spiel nicht.
            Missionen mit <b>Begriffs-Check</b> starten mit einer Definition: erst den Begriff mit <b>:=</b> festlegen, dann beweisen.
          </p>
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
              <span className="text-[11px] text-slate-500">Stimmen die Bestandteile, geht es weiter zum Beweis.</span>
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
          <div ref={benchRef} className="relative rounded-2xl border-2 border-dashed overflow-hidden"
            style={{ borderColor: drag ? C.zielHi : "#B7C3CF", background: drag ? "rgba(47,165,136,0.06)" : "rgba(255,255,255,0.35)", minHeight: 260, touchAction: "none" }}>
            {bench.length === 0 && !snapping && (
              <span className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 pointer-events-none px-6 text-center" style={{ fontFamily: "Georgia, serif" }}>
                {isProof ? "leer — Aussagen und eine Regel hierher, dann zusammenschieben" : "leer — die richtigen Bestandteile und „:=“ hierher"}
              </span>
            )}
            {clustersOf(bench).filter((g) => g.length > 1).map((g, gi) => {
              const xs = g.map((it) => it.x), ys = g.map((it) => it.y);
              const left = Math.min(...xs) - TILE_W / 2 - 8, top = Math.min(...ys) - TILE_H / 2 - 8;
              const right = Math.max(...xs) + TILE_W / 2 + 8, bottom = Math.max(...ys) + TILE_H / 2 + 8;
              return <div key={`cl-${gi}`} className="absolute rounded-2xl pointer-events-none transition-all"
                style={{ left, top, width: right - left, height: bottom - top, border: `2px solid ${C.zielHi}`, background: "rgba(47,165,136,0.07)", zIndex: 0 }} />;
            })}
            {bench.map((item) => {
              const isRule = item.kind === "regel";
              const face = isRule ? RULES[item.id] : FACTS[item.id];
              return (
                <div key={item.uid} onPointerDown={(e) => startBenchDrag(e, item)} className="absolute select-none"
                  style={{
                    left: item.x, top: item.y, transform: "translate(-50%, -50%)", touchAction: "none", cursor: "grab",
                    zIndex: drag && drag.uid === item.uid ? 30 : 5,
                    opacity: drag && drag.kind === "bench" && drag.uid === item.uid ? 0.5 : 1,
                    filter: snapping ? `drop-shadow(0 0 10px ${isRule ? C.regelHi : C.faktHi})` : "none",
                    transition: drag && drag.kind === "bench" && drag.uid === item.uid ? "none" : "left .16s ease, top .16s ease",
                  }}>
                  <div style={{ position: "relative" }}>
                    <TileFace kind={item.kind} block={face} isGoal={!isRule && item.id === stage.goal} flash={flash === item.id} label={!isRule ? factLabel(item.id) : undefined} />
                    <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); removeUid(item.uid); }}
                      aria-label="entfernen" className="absolute -top-2 -right-2 rounded-full flex items-center justify-center"
                      style={{ width: 20, height: 20, background: "#fff", border: "1px solid #B7C3CF", color: C.ink, fontSize: 13, lineHeight: 1, cursor: "pointer" }}>×</button>
                  </div>
                </div>
              );
            })}
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
            ) : (
              <p className="text-xs" style={{ color: "#8595a4" }}>
                {isProof ? "Regel + passende Aussagen zusammenschieben, dann Hammer." : "Die richtigen Bestandteile + „:=“ zusammenschieben."}
              </p>
            )}
          </div>
        </section>

        {/* Begriff geschafft (Zwischen-Toast) */}
        {!isProof && stageWon && (
          <div className="mb-5 rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: "rgba(138,107,192,0.10)", border: `1px solid ${C.begriff}` }}>
            <div className="mt-0.5 shrink-0 rounded-full p-1" style={{ background: C.begriff }}><Check size={14} color="#fff" /></div>
            <div>
              <div style={{ fontFamily: "Georgia, serif", color: C.begriff }} className="text-base font-semibold">Begriff sitzt: {goal.name}.</div>
              {stage.note && <p className="text-sm text-slate-700 mt-0.5">{stage.note}</p>}
              <p className="text-xs text-slate-500 mt-1">Weiter geht’s …</p>
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
          <Shelf title={isProof ? "Bekannte Aussagen" : "Bestandteile"} dot={C.fakt} hintText="ziehen oder tippen → landet auf der Werkbank">
            {have.map((id) => (
              <PaletteTile key={id} kind="fakt" block={FACTS[id]} isGoal={id === stage.goal} label={factLabel(id)} onDrag={(e) => startPaletteDrag(e, "fakt", id)} />
            ))}
          </Shelf>
          <Shelf title="Schlussregeln" dot={C.regel} hintText={isProof ? "genau eine Regel gehört in jede Verknüpfung" : "„:=“ verbindet die Bestandteile"}>
            {stage.pool.rules.map((id) => (
              <PaletteTile key={id} kind="regel" block={RULES[id]} onDrag={(e) => startPaletteDrag(e, "regel", id)} />
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
            <p className="text-xs text-slate-400" style={{ fontFamily: "Georgia, serif" }}>
              noch keine Schritte — hier entsteht die Idee, Schritt für Schritt.
            </p>
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

        <footer className="mt-8 text-[11px] text-slate-400" style={{ fontFamily: "ui-monospace, monospace" }}>
          Werkbank-Crafting · Begriffs-Check, Distraktoren, Ordnungszwang, Regelwahl und Tiefen-Regler.
        </footer>
      </div>

      {drag && drag.kind === "palette" && (
        <div style={{ position: "fixed", left: drag.x, top: drag.y, transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 50 }}>
          <TileFace kind={drag.tileKind} block={drag.tileKind === "regel" ? RULES[drag.id] : FACTS[drag.id]} isGoal={drag.tileKind === "fakt" && drag.id === stage.goal} lifted />
        </div>
      )}
    </div>
  );
}

function Shelf({ title, dot, hintText, children }) {
  const empty = React.Children.count(children) === 0;
  return (
    <div className="rounded-2xl p-3 border-2 border-dashed" style={{ borderColor: "#B7C3CF", background: "rgba(255,255,255,0.35)" }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ background: dot, width: 10, height: 10, borderRadius: 3 }} />
        <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.12em" }} className="text-[11px] uppercase text-slate-500">{title}</span>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
      {empty && <p className="text-[11px] text-slate-400 mt-1" style={{ fontFamily: "Georgia, serif" }}>—</p>}
      <p className="text-[11px] text-slate-400 mt-2" style={{ fontFamily: "Georgia, serif" }}>{hintText}</p>
    </div>
  );
}

function PaletteTile({ kind, block, isGoal, label, onDrag }) {
  return (
    <div onPointerDown={onDrag} style={{ touchAction: "none", cursor: "grab" }}>
      <TileFace kind={kind} block={block} isGoal={isGoal} label={label} />
    </div>
  );
}

function TileFace({ kind, block, isGoal, label, lifted, flash }) {
  const isRule = kind === "regel";
  const isBegriff = !isRule && block.role === "begriff";
  const base = isRule ? C.regel : isGoal ? C.ziel : isBegriff ? C.begriff : C.fakt;
  const hi = isRule ? C.regelHi : isGoal ? C.zielHi : isBegriff ? C.begriffHi : C.faktHi;
  const tag = isRule ? (block.tag || "Regel") : label || block.tag || (isGoal ? "Ziel" : isBegriff ? "Begriff" : "Aussage");
  return (
    <div style={{
      background: `linear-gradient(160deg, ${hi}, ${base})`, color: "#fff", borderRadius: 12, padding: "9px 13px", minWidth: TILE_W - 8,
      boxShadow: lifted ? "0 12px 28px rgba(0,0,0,0.28)" : flash ? `0 0 14px ${hi}, 0 2px 0 rgba(0,0,0,0.18)` : "0 2px 0 rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25)",
      border: "1px solid rgba(255,255,255,0.18)", transform: flash ? "scale(1.04)" : "scale(1)", transition: "transform .2s ease",
    }}>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.14em", opacity: 0.8 }} className="uppercase mb-0.5">{tag}</div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.12 }} className="font-semibold">{block.name}</div>
      {block.sub ? <div style={{ fontSize: 10.5, opacity: 0.9, marginTop: 2 }}>{block.sub}</div> : null}
    </div>
  );
}
