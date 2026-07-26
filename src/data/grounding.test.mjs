/* ====================================================================
 *  Grounding-Tests: Integrität der Inhalte über alle Quellen.
 *  Fängt den häufigsten Autor-Fehler ab — eine vertippte / fehlende id,
 *  die im Browser still zu einer unlösbaren Aufgabe oder Roh-id-Anzeige
 *  führt. Läuft ohne Browser: node src/data/grounding.test.mjs
 *
 *  proof/data.js, symboldefs.js, openmath.js sind reines JS → import.
 *  StrukturBaukasten.jsx ist JSX (nicht per Node ladbar) → die Daten
 *  werden aus dem Quelltext extrahiert (so, wie AGENTS.md es vorgibt).
 * ==================================================================== */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { FACTS, RULES, MISSIONS as PROOF_MISSIONS } from "../proof/data.js";
import { PALETTE_CATEGORIES, DE } from "./openmath.js";
import { SYMBOL_TASKS } from "./symboldefs.js";

const HERE = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
const t = (name, cond, info = "") => { cond ? pass++ : fail++; console.log(`${cond ? "ok  " : "FAIL"} ${name}${info ? "  " + info : ""}`); };
const list = (xs, n = 6) => xs.slice(0, n).join(", ") + (xs.length > n ? ` … (+${xs.length - n})` : "");

// ====================================================================
//  1) Beweis-Daten (proof/data.js) — alle ids aufgelöst
// ====================================================================
{
  const factIds = new Set(Object.keys(FACTS));
  const ruleIds = new Set(Object.keys(RULES));

  t("FACTS: Meta-id == Schlüssel", Object.entries(FACTS).every(([k, v]) => v.id === k));
  t("RULES: Meta-id == Schlüssel", Object.entries(RULES).every(([k, v]) => v.id === k));

  const bad = [];
  for (const m of PROOF_MISSIONS) {
    if (!factIds.has(m.goal)) bad.push(`${m.id}.goal=${m.goal}`);
    for (const s of m.steps || []) {
      if (!ruleIds.has(s.rule)) bad.push(`${m.id}.step.rule=${s.rule}`);
      if (!factIds.has(s.produces)) bad.push(`${m.id}.step.produces=${s.produces}`);
      for (const p of s.premises || []) if (!factIds.has(p)) bad.push(`${m.id}.premise=${p}`);
    }
    for (const d of m.depths || []) for (const g of d.given || []) if (!factIds.has(g)) bad.push(`${m.id}.given=${g}`);
    for (const f of m.pool?.facts || []) if (!factIds.has(f)) bad.push(`${m.id}.pool.fact=${f}`);
    for (const r of m.pool?.rules || []) if (!ruleIds.has(r)) bad.push(`${m.id}.pool.rule=${r}`);
    for (const v of m.vocab || []) {
      if (v.goal && !factIds.has(v.goal)) bad.push(`${m.id}.vocab.goal=${v.goal}`);
      for (const g of v.given || []) if (!factIds.has(g)) bad.push(`${m.id}.vocab.given=${g}`);
    }
  }
  t("Beweis-Missionen: alle ids in FACTS/RULES", bad.length === 0, bad.length ? list(bad) : "");

  // jede Mission ist über ihre steps von der tiefsten Startlage aus lösbar
  const unreachable = [];
  for (const m of PROOF_MISSIONS) {
    const deepest = m.depths[m.depths.length - 1];
    const have = new Set(deepest.given);
    // steps sind bereits in Beweis-Reihenfolge; produces sammelt bekannte Aussagen
    for (const s of m.steps) if (s.premises.every((p) => have.has(p))) have.add(s.produces);
    // Fixpunkt: mehrmals durchlaufen, falls Reihenfolge nicht linear ist
    for (let i = 0; i < m.steps.length; i++)
      for (const s of m.steps) if (s.premises.every((p) => have.has(p))) have.add(s.produces);
    if (!have.has(m.goal)) unreachable.push(m.id);
  }
  t("Beweis-Missionen: Ziel aus tiefster Lage erreichbar", unreachable.length === 0, list(unreachable));
}

// ====================================================================
//  2) Symbol-Aufgaben (symboldefs.js) — gegen die volle Palette geerdet
// ====================================================================
{
  const paletteIds = new Set(PALETTE_CATEGORIES.flatMap((c) => c.symbols.map((s) => `${s.cd}.${s.name}`)));

  const missing = [];
  const overlap = [];
  const taskIds = new Set();
  const dupTask = [];
  for (const task of SYMBOL_TASKS) {
    if (taskIds.has(task.id)) dupTask.push(task.id); else taskIds.add(task.id);
    const need = task.need || [];
    const distract = task.distract || [];
    for (const id of [...need, ...distract]) if (!paletteIds.has(id)) missing.push(`${task.id}:${id}`);
    for (const id of need) if (distract.includes(id)) overlap.push(`${task.id}:${id}`);
    for (const key of ["term", "ref", "beschreibung"]) if (!task[key]) missing.push(`${task.id}:<${key} leer>`);
  }
  t("Symbol-Aufgaben: need/distract in der Palette", missing.length === 0, list(missing));
  t("Symbol-Aufgaben: need ∩ distract leer", overlap.length === 0, list(overlap));
  t("Symbol-Aufgaben: ids eindeutig", dupTask.length === 0, list(dupTask));
}

// ====================================================================
//  3) OpenMath-Palette — jedes Symbol hat ein DE-Label & eindeutige id
// ====================================================================
{
  const all = PALETTE_CATEGORIES.flatMap((c) => c.symbols.map((s) => `${s.cd}.${s.name}`));
  const seen = new Set();
  const dups = [];
  for (const id of all) { if (seen.has(id)) dups.push(id); else seen.add(id); }
  t("Palette: Symbol-ids eindeutig", dups.length === 0, list([...new Set(dups)]));
  const noDe = all.filter((id) => !(id in DE));
  t("Palette: jedes Symbol hat ein DE-Label", noDe.length === 0, list(noDe));
}

// ====================================================================
//  4) Struktur-Rezepte (StrukturBaukasten.jsx) — via Textextraktion
// ====================================================================
{
  const src = readFileSync(join(HERE, "..", "StrukturBaukasten.jsx"), "utf8");
  const between = (startRe, endRe) => {
    const a = src.search(startRe);
    const b = src.slice(a).search(endRe);
    return src.slice(a, a + b);
  };
  const q = (s) => [...s.matchAll(/"([^"]+)"/g)].map((m) => m[1]);

  // BLOCKS- und RESULTS-Schlüssel = ihre `id: "…"`-Felder
  const idsIn = (text) => [...text.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
  const BLOCKS = new Set(idsIn(between(/const BLOCKS = \{/, /const RESULTS = \{/)));
  const RESULTS = new Set(idsIn(between(/const RESULTS = \{/, /const RECIPES = \[/)));

  // RECIPES = [{ need: [...], result: "…" }]
  const recipeSrc = between(/const RECIPES = \[/, /\n\];/);
  const RECIPES = [...recipeSrc.matchAll(/need:\s*\[([^\]]*)\]\s*,\s*result:\s*"([^"]+)"/g)]
    .map((m) => ({ need: q(m[1]), result: m[2] }));

  // MISSIONS = [{ id, base: [...], steps: [...] }]
  const missionSrc = between(/export const MISSIONS = \[/, /\n\];/);
  const MISSIONS = [...missionSrc.matchAll(/\{[^{}]*\}/g)].map((m) => {
    const o = m[0];
    const idm = o.match(/id:\s*"([^"]+)"/);
    const bm = o.match(/base:\s*\[([^\]]*)\]/);
    const sm = o.match(/steps:\s*\[([^\]]*)\]/);
    return { id: idm?.[1], base: bm ? q(bm[1]) : [], steps: sm ? q(sm[1]) : [] };
  }).filter((m) => m.id);

  // Extraktion plausibel? (fängt kaputte Regex/Marker früh ab)
  t("Extraktion: BLOCKS/RESULTS/RECIPES/MISSIONS gefüllt",
    BLOCKS.size > 20 && RESULTS.size > 20 && RECIPES.length > 20 && MISSIONS.length > 10,
    `BLOCKS ${BLOCKS.size}, RESULTS ${RESULTS.size}, RECIPES ${RECIPES.length}, MISSIONS ${MISSIONS.length}`);

  const recipeByResult = new Map(RECIPES.map((r) => [r.result, r]));
  const resolvable = (id) => BLOCKS.has(id) || RESULTS.has(id);

  // (a) jede Rezept-Zutat ist auflösbar, jedes Rezept-Ergebnis ist ein RESULTS-Eintrag
  const badNeed = [];
  const badResult = [];
  for (const r of RECIPES) {
    for (const n of r.need) if (!resolvable(n)) badNeed.push(`${r.result}←${n}`);
    if (!RESULTS.has(r.result)) badResult.push(r.result);
  }
  t("Rezepte: jede Zutat auflösbar (Block oder Ergebnis)", badNeed.length === 0, list(badNeed));
  t("Rezepte: jedes Ergebnis in RESULTS definiert", badResult.length === 0, list(badResult));

  // (b) jedes buildbare Ergebnis zerlegt vollständig zu Elementarblöcken (keine dangling id)
  const leaves = (result, stop, seen = new Set()) => {
    const out = [];
    const walk = (id) => {
      if (stop.has(id) || BLOCKS.has(id)) { out.push(id); return; }
      const rec = recipeByResult.get(id);
      if (!rec) { out.push(id); return; }            // dangling: kein Block, kein Rezept
      if (seen.has(id)) { out.push(id); return; }    // Zyklusschutz
      seen.add(id);
      for (const n of rec.need) walk(n);
    };
    walk(result);
    return out;
  };

  const dangling = [];
  for (const r of RECIPES) {
    for (const leaf of leaves(r.result, new Set())) {
      if (!BLOCKS.has(leaf) && !recipeByResult.has(leaf)) dangling.push(`${r.result}⇒${leaf}`);
    }
  }
  t("Rezepte: alle zerlegen zu Elementarblöcken (keine dangling ids)", dangling.length === 0, list(dangling));

  // (c) Missionen: base/steps auflösbar, Schritte buildbar, Zerlegung ⊆ (BLOCKS ∪ base)
  const missBad = [];
  for (const m of MISSIONS) {
    for (const b of m.base) if (!resolvable(b)) missBad.push(`${m.id}.base=${b}`);
    const stop = new Set(m.base);
    for (const s of m.steps) {
      if (!recipeByResult.has(s) && !BLOCKS.has(s)) { missBad.push(`${m.id}.step=${s} (kein Rezept)`); continue; }
      for (const leaf of leaves(s, stop)) {
        if (!BLOCKS.has(leaf) && !stop.has(leaf)) missBad.push(`${m.id}.step ${s}⇒${leaf}`);
      }
    }
  }
  t("Missionen: base/steps geerdet & vollständig zerlegbar", missBad.length === 0, list(missBad));
}

console.log(`\n${pass} ok, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
