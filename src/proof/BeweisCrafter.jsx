import React, { useMemo, useRef, useState, useEffect } from "react";
import { Check, RotateCcw, ChevronRight, Sparkles, Hammer } from "lucide-react";
import { FACTS, RULES, MISSIONS } from "./data.js";
import { craftFromCluster, givenFor } from "./engine.js";

/* --- Farbwelt (konsistent mit dem Struktur-Baukasten) --------------- */
const C = {
  paper: "#EAEEF2",
  dot: "#C4D0DB",
  ink: "#1B2430",
  fakt: "#31597F", // bekannte Aussagen (Blau)
  faktHi: "#4E7BA6",
  regel: "#6B4E9E", // Schlussregeln (Violett)
  regelHi: "#8A6BC0",
  ziel: "#1F7A63", // Ziel / Erfolg (Petrol)
  zielHi: "#2FA588",
  warn: "#B26A1E", // Hinweis (Ocker)
};

// Werkbank-Geometrie (etwas kompakter als der Definitions-Modus, mobiltauglich)
const TILE_W = 150;
const TILE_H = 78;
const GAP = 46;
const SNAP = 48;

export default function BeweisCrafter() {
  const [missionId, setMissionId] = useState(MISSIONS[0].id);
  const [depth, setDepth] = useState(0);
  const [have, setHave] = useState(() => MISSIONS[0].depths[0].given.slice());
  const [bench, setBench] = useState([]); // [{uid, kind:"fakt"|"regel", id, x, y}]
  const [drag, setDrag] = useState(null);
  const [snapping, setSnapping] = useState(false);
  const [flash, setFlash] = useState(null);
  const [hint, setHint] = useState("");
  const [lastIdea, setLastIdea] = useState(null); // Idee des zuletzt gebauten Schritts
  const [protocol, setProtocol] = useState([]); // [{rule, premises, produces, idea}]

  const benchRef = useRef(null);
  const uidRef = useRef(1);
  const reduce = useRef(false);
  useEffect(() => {
    reduce.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const mission = useMemo(() => MISSIONS.find((x) => x.id === missionId), [missionId]);
  const haveSet = useMemo(() => new Set(have), [have]);
  const givenSet = useMemo(() => new Set(givenFor(mission, depth)), [mission, depth]);
  const won = haveSet.has(mission.goal);
  const goal = FACTS[mission.goal];

  const paperBg = {
    backgroundColor: C.paper,
    backgroundImage: `radial-gradient(${C.dot} 1.3px, transparent 1.3px)`,
    backgroundSize: "22px 22px",
  };

  // --- Mission / Tiefe laden (setzt zurück) ---
  const loadMission = (id, d = 0) => {
    const m = MISSIONS.find((x) => x.id === id);
    setMissionId(id);
    setDepth(d);
    setHave(givenFor(m, d).slice());
    setBench([]);
    setFlash(null);
    setHint("");
    setLastIdea(null);
    setProtocol([]);
  };
  const resetMission = () => loadMission(missionId, depth);
  const clearBench = () => { setBench([]); setHint(""); };

  // --- Cluster (Zusammenhangskomponenten naher Kacheln) ---
  const clustersOf = (items) => {
    const near = (a, b) => Math.abs(a.x - b.x) < TILE_W + GAP && Math.abs(a.y - b.y) < TILE_H + GAP;
    const seen = new Set();
    const groups = [];
    for (const it of items) {
      if (seen.has(it.uid)) continue;
      const stack = [it], group = [];
      seen.add(it.uid);
      while (stack.length) {
        const cur = stack.pop();
        group.push(cur);
        for (const other of items) if (!seen.has(other.uid) && near(cur, other)) { seen.add(other.uid); stack.push(other); }
      }
      groups.push(group);
    }
    return groups;
  };

  // --- Hammer: ersten passenden Cluster verschmelzen ---
  const build = () => {
    if (snapping) return;
    const groups = clustersOf(bench);
    for (const g of groups) {
      const res = craftFromCluster(mission, haveSet, g.map((t) => ({ kind: t.kind, id: t.id })));
      if (res.ok) return fuse(g, res);
    }
    // nichts passt — bewusst knappe, nicht verratende Rückmeldung
    const hasPair = groups.some((g) => g.length > 1);
    setHint(hasPair ? "Das rastet nicht ein — andere Regel oder andere Aussagen?" : "Schieb eine Regel und passende Aussagen zusammen, dann Hammer.");
  };

  const fuse = (group, res) => {
    const cx = group.reduce((s, g) => s + g.x, 0) / group.length;
    const cy = group.reduce((s, g) => s + g.y, 0) / group.length;
    const uids = new Set(group.map((g) => g.uid));
    setHint("");
    setSnapping(true);
    const delay = reduce.current ? 60 : 640;
    setTimeout(() => {
      setHave((h) => (h.includes(res.produces) ? h : [...h, res.produces]));
      setProtocol((p) => [...p, { rule: res.rule, premises: res.premises, produces: res.produces, idea: res.idea }]);
      setLastIdea(res.idea || null);
      setFlash(res.produces);
      setBench((prev) => [
        ...prev.filter((b) => !uids.has(b.uid)),
        { uid: uidRef.current++, kind: "fakt", id: res.produces, x: cx, y: cy },
      ]);
      setSnapping(false);
      setTimeout(() => setFlash((f) => (f === res.produces ? null : f)), 900);
    }, delay);
  };

  // --- Kacheln ablegen ---
  const addToBenchAt = (kind, id, clientX, clientY) => {
    if (snapping) return;
    const rect = benchRef.current?.getBoundingClientRect();
    const x = rect ? clientX - rect.left : 60;
    const y = rect ? clientY - rect.top : 60;
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
      const x = Math.min(110 + (n % 4) * 92, w - 60);
      const y = Math.min(70 + Math.floor(n / 4) * 92, h - 50);
      return [...prev, { uid: uidRef.current++, kind, id, x, y }];
    });
    setHint("");
  };
  const removeUid = (uid) => { if (!snapping) { setBench((prev) => prev.filter((b) => b.uid !== uid)); setHint(""); } };

  // --- Magnet: bewegte Kachel bündig andocken ---
  const snapMagnet = (uid) => {
    setBench((prev) => {
      const me = prev.find((b) => b.uid === uid);
      if (!me) return prev;
      let best = null, bestD = Infinity;
      for (const other of prev) {
        if (other.uid === uid) continue;
        const dx = me.x - other.x, dy = me.y - other.y;
        const gapX = Math.abs(dx) - TILE_W, gapY = Math.abs(dy) - TILE_H;
        const d = Math.hypot(dx, dy);
        if (Math.abs(dy) < TILE_H && gapX < SNAP && d < bestD) { bestD = d; best = { other, axis: "x", dir: Math.sign(dx) || 1 }; }
        else if (Math.abs(dx) < TILE_W && gapY < SNAP && d < bestD) { bestD = d; best = { other, axis: "y", dir: Math.sign(dy) || 1 }; }
      }
      if (!best) return prev;
      const o = best.other;
      const target = best.axis === "x" ? { x: o.x + best.dir * TILE_W, y: o.y } : { x: o.x, y: o.y + best.dir * TILE_H };
      return prev.map((b) => (b.uid === uid ? { ...b, x: target.x, y: target.y } : b));
    });
  };

  // --- Pointer-Drag (Maus + Touch) ---
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
    const offX = rect ? t.clientX - rect.left - item.x : 0;
    const offY = rect ? t.clientY - rect.top - item.y : 0;
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
          const nx = t.clientX - rect.left - drag.offX;
          const ny = t.clientY - rect.top - drag.offY;
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

  const factLabel = (id) => (id === mission.goal ? "Ziel" : givenSet.has(id) ? "gegeben" : "gefolgert");

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
            Zieh (oder tippe) aus den Vorräten <b>Aussagen</b> und eine <b>Schlussregel</b> auf die Werkbank, schieb sie nah zusammen und
            drück den <b>Hammer</b>. Passt es, verschmelzen sie zu einer neuen Aussage. Baue so eine Kette bis zum <b>Ziel</b>.
            Welche Regel greift und welche Aussagen sie braucht, steht nirgends — das ist die Aufgabe.
          </p>
        </header>

        {/* Missionswahl */}
        <section className="mb-4">
          <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.14em" }} className="text-[11px] uppercase text-slate-500">Beweis wählen</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {MISSIONS.map((m) => {
              const active = m.id === missionId;
              return (
                <button key={m.id} onClick={() => loadMission(m.id, 0)} aria-pressed={active}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors border"
                  style={{ fontFamily: "ui-monospace, monospace", background: active ? C.ziel : "rgba(255,255,255,0.5)", color: active ? "#fff" : C.ink, borderColor: active ? C.ziel : "#B7C3CF" }}>
                  {m.title}
                </button>
              );
            })}
          </div>
        </section>

        {/* Ziel / Behauptung */}
        <section className="mb-4 rounded-xl px-4 py-3" style={{ background: won ? "rgba(31,122,99,0.10)" : "rgba(255,255,255,0.55)", border: `1px solid ${won ? C.ziel : "#B7C3CF"}` }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500">Zu zeigen</span>
            <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] text-slate-400">{mission.ref}</span>
            {won && <span className="inline-flex items-center gap-1 ml-auto text-xs font-medium" style={{ color: C.ziel }}><Check size={13} /> Beweis vollständig</span>}
          </div>
          <p className="text-sm text-slate-800 mt-1" style={{ fontFamily: "Georgia, serif" }}>{mission.claim}</p>
          <div className="flex items-center gap-2 mt-2">
            <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500">Zielaussage</span>
            <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs" style={{ fontFamily: "Georgia, serif", background: won ? C.ziel : "rgba(31,122,99,0.10)", color: won ? "#fff" : C.ziel, border: `1px solid ${C.ziel}` }}>
              {won && <Check size={11} />} {goal.name}
            </span>
          </div>
        </section>

        {/* Tiefen-Regler */}
        {mission.depths.length > 1 && (
          <section className="mb-5">
            <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.14em" }} className="text-[11px] uppercase text-slate-500">Starttiefe</span>
            <div className="flex flex-wrap gap-2 mt-2 items-center">
              {mission.depths.map((d, i) => {
                const active = i === depth;
                return (
                  <button key={d.label} onClick={() => loadMission(missionId, i)}
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
            style={{ borderColor: drag ? C.zielHi : "#B7C3CF", background: drag ? "rgba(47,165,136,0.06)" : "rgba(255,255,255,0.35)", minHeight: 280, touchAction: "none" }}>
            {bench.length === 0 && !snapping && (
              <span className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 pointer-events-none px-6 text-center" style={{ fontFamily: "Georgia, serif" }}>
                leer — Aussagen und eine Regel hierher ziehen oder tippen, dann zusammenschieben
              </span>
            )}

            {/* Cluster-Hüllen */}
            {clustersOf(bench).filter((g) => g.length > 1).map((g, gi) => {
              const xs = g.map((it) => it.x), ys = g.map((it) => it.y);
              const left = Math.min(...xs) - TILE_W / 2 - 8, top = Math.min(...ys) - TILE_H / 2 - 8;
              const right = Math.max(...xs) + TILE_W / 2 + 8, bottom = Math.max(...ys) + TILE_H / 2 + 8;
              return <div key={`cl-${gi}`} className="absolute rounded-2xl pointer-events-none transition-all"
                style={{ left, top, width: right - left, height: bottom - top, border: `2px solid ${C.zielHi}`, background: "rgba(47,165,136,0.07)", zIndex: 0 }} />;
            })}

            {/* Kacheln */}
            {bench.map((item) => {
              const isRule = item.kind === "regel";
              const face = isRule ? RULES[item.id] : FACTS[item.id];
              return (
                <div key={item.uid} onPointerDown={(e) => startBenchDrag(e, item)}
                  className="absolute select-none"
                  style={{
                    left: item.x, top: item.y, transform: "translate(-50%, -50%)", touchAction: "none", cursor: "grab",
                    zIndex: drag && drag.uid === item.uid ? 30 : 5,
                    opacity: drag && drag.kind === "bench" && drag.uid === item.uid ? 0.5 : 1,
                    filter: snapping ? `drop-shadow(0 0 10px ${isRule ? C.regelHi : C.faktHi})` : "none",
                    transition: drag && drag.kind === "bench" && drag.uid === item.uid ? "none" : "left .16s ease, top .16s ease",
                  }}>
                  <div style={{ position: "relative" }}>
                    <TileFace kind={item.kind} block={face} isGoal={!isRule && item.id === mission.goal} flash={flash === item.id} />
                    <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); removeUid(item.uid); }}
                      aria-label="entfernen" className="absolute -top-2 -right-2 rounded-full flex items-center justify-center"
                      style={{ width: 20, height: 20, background: "#fff", border: "1px solid #B7C3CF", color: C.ink, fontSize: 13, lineHeight: 1, cursor: "pointer" }}>×</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hammer + Hinweis */}
          <div className="flex items-center gap-3 mt-2 min-h-[52px]">
            <button onClick={build} disabled={bench.length === 0 || snapping}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium select-none transition-all"
              style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.04em",
                background: bench.length === 0 || snapping ? "#C4D0DB" : C.ziel, color: bench.length === 0 || snapping ? "#8595a4" : "#fff",
                cursor: bench.length === 0 || snapping ? "default" : "pointer",
                boxShadow: bench.length === 0 || snapping ? "none" : "0 2px 0 rgba(0,0,0,0.18)" }}>
              <Hammer size={16} /> Hammer
            </button>
            {hint ? (
              <p className="text-xs" style={{ color: C.warn }}>{hint}</p>
            ) : lastIdea ? (
              <p className="text-xs inline-flex items-center gap-1.5" style={{ color: C.ziel }}>
                <Check size={13} /> <span>Gerade gezeigt: <b>{lastIdea}</b></span>
              </p>
            ) : (
              <p className="text-xs" style={{ color: "#8595a4" }}>Regel + passende Aussagen zusammenschieben, dann Hammer.</p>
            )}
          </div>
        </section>

        {/* Erfolg */}
        {won && (
          <div className="mb-5 rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: "rgba(31,122,99,0.10)", border: `1px solid ${C.ziel}` }}>
            <div className="mt-0.5 shrink-0 rounded-full p-1" style={{ background: C.ziel }}><Sparkles size={14} color="#fff" /></div>
            <div>
              <div style={{ fontFamily: "Georgia, serif", color: C.ziel }} className="text-lg font-semibold">Beweis geschafft.</div>
              <p className="text-sm text-slate-700 mt-0.5">Du hast <b>{goal.name}</b> in {protocol.length} Schritten hergeleitet. Das Protokoll unten ist dein zusammengesetzter Beweis.</p>
            </div>
          </div>
        )}

        {/* VORRÄTE: Bekannte Aussagen + Schlussregeln (getrennt von der Werkbank) */}
        <section className="grid gap-4 md:grid-cols-2 mb-4">
          <Shelf title="Bekannte Aussagen" dot={C.fakt} hintText="ziehen oder tippen → landet auf der Werkbank">
            {have.map((id) => (
              <PaletteTile key={id} kind="fakt" block={FACTS[id]} isGoal={id === mission.goal} label={factLabel(id)}
                onDrag={(e) => startPaletteDrag(e, "fakt", id)} />
            ))}
          </Shelf>
          <Shelf title="Schlussregeln" dot={C.regel} hintText="genau eine Regel gehört in jede Verknüpfung">
            {mission.pool.rules.map((id) => (
              <PaletteTile key={id} kind="regel" block={RULES[id]}
                onDrag={(e) => startPaletteDrag(e, "regel", id)} />
            ))}
          </Shelf>
        </section>

        {/* Beweisprotokoll */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.14em" }} className="text-[11px] uppercase text-slate-500">Beweisprotokoll</span>
            <button onClick={resetMission} className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors ml-auto" style={{ fontFamily: "ui-monospace, monospace" }}>
              <RotateCcw size={12} /> Mission zurücksetzen
            </button>
          </div>
          {protocol.length === 0 ? (
            <p className="text-xs text-slate-400" style={{ fontFamily: "Georgia, serif" }}>
              noch keine Schritte — hier entsteht die Beweis-Idee, Schritt für Schritt.
            </p>
          ) : (
            <ol className="space-y-2.5">
              {protocol.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="inline-flex items-center justify-center rounded-full shrink-0 text-[10px] mt-0.5" style={{ width: 18, height: 18, background: C.ziel, color: "#fff", fontFamily: "ui-monospace, monospace" }}>{i + 1}</span>
                  <div className="min-w-0">
                    {/* Idee zuerst — die lesbare Beweis-Geschichte */}
                    {step.idea && (
                      <div style={{ fontFamily: "Georgia, serif" }} className="text-sm text-slate-800 font-medium">{step.idea}</div>
                    )}
                    {/* Formel-Detail darunter, gedämpft */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400 mt-0.5" style={{ fontFamily: "ui-monospace, monospace" }}>
                      {step.premises.map((p, k) => (
                        <React.Fragment key={p}>
                          {k > 0 && <span>,</span>}
                          <span>{FACTS[p].name}</span>
                        </React.Fragment>
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
          Werkbank-Crafting · Distraktoren, Ordnungszwang, Regelwahl und Tiefen-Regler aktiv.
        </footer>
      </div>

      {/* Drag-Overlay */}
      {drag && drag.kind === "palette" && (
        <div style={{ position: "fixed", left: drag.x, top: drag.y, transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 50 }}>
          <TileFace kind={drag.tileKind} block={drag.tileKind === "regel" ? RULES[drag.id] : FACTS[drag.id]} isGoal={drag.tileKind === "fakt" && drag.id === MISSIONS.find((m) => m.id === missionId).goal} lifted />
        </div>
      )}
    </div>
  );
}

/* --- Vorrat-Regal --------------------------------------------------- */
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

/* --- Ziehbare Vorrat-Kachel ----------------------------------------- */
// Tap vs. Drag wird einheitlich im globalen pointerup-Handler entschieden
// (Tap = kaum bewegt → addByTap; Ziehen auf die Werkbank → addToBenchAt).
function PaletteTile({ kind, block, isGoal, label, onDrag }) {
  return (
    <div onPointerDown={onDrag} style={{ touchAction: "none", cursor: "grab" }}>
      <TileFace kind={kind} block={block} isGoal={isGoal} label={label} />
    </div>
  );
}

/* --- Gemeinsame Kachel-Optik ---------------------------------------- */
function TileFace({ kind, block, isGoal, label, lifted, flash }) {
  const isRule = kind === "regel";
  const base = isRule ? C.regel : isGoal ? C.ziel : C.fakt;
  const hi = isRule ? C.regelHi : isGoal ? C.zielHi : C.faktHi;
  const tag = isRule ? "Regel" : label || (isGoal ? "Ziel" : "Aussage");
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
