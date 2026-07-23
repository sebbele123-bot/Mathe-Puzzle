/* Logik-Test ohne Browser: spielt jede Mission mit der beabsichtigten
 * Lösung durch und prüft die vier Mechaniken. Lauf: node src/proof/engine.test.mjs */
import { FACTS, MISSIONS } from "./data.js";
import { evaluate, deadEndSet, givenFor } from "./engine.js";

let pass = 0, fail = 0;
const ok = (c, msg) => (c ? (pass++, console.log("  ✓ " + msg)) : (fail++, console.error("  ✗ " + msg)));

const withDead = (m) => ({ ...m, _deadEnds: deadEndSet(m, FACTS) });

// Intendierte Lösungswege (Regel, Prämissen) je Mission
const SOLUTIONS = {
  p_neutral: [
    ["r_useE2", ["n_e2"]],
    ["r_useE", ["n_e"]],
    ["r_trans", ["n_eq1", "n_eq2"]],
  ],
  p_fixpunkt: [
    ["r_orient", ["s_sim", "s_orient"]],
    ["r_kongkrit", ["s_sim", "s_notcong"]],
    ["r_absa", ["s_absne1"]],
    ["r_1ma", ["s_ane1"]],
    ["r_fixansatz", ["s_hol"]],
    ["r_solve", ["s_fixeq", "s_1ma"]],
  ],
  p_sqrt2: [
    ["r_transit", ["c_annahme"]],
    ["r_orth", ["c_exists", "c_norm10", "c_norm11"]],
    ["r_widerspruch", ["c_factor", "c_sqrt2"]],
  ],
};

for (const raw of MISSIONS) {
  const m = withDead(raw);
  console.log("\n# " + m.title);

  // Lösung durchspielen ab der tiefsten Stufe (letzte depth = am wenigsten geschenkt)
  const deepest = m.depths.length - 1;
  const have = new Set(givenFor(m, deepest));
  for (const [rule, prem] of SOLUTIONS[m.id]) {
    const res = evaluate(m, have, rule, prem);
    ok(res.ok && res.status === "success", `Schritt ${rule} → ${res.produces || "?"}`);
    if (res.ok) have.add(res.produces);
  }
  ok(have.has(m.goal), "Ziel erreicht: " + FACTS[m.goal].name);

  // Ordnungszwang: erster Schritt mit noch nicht vorhandener Prämisse blockiert
  const fresh = new Set(givenFor(m, deepest));
  const later = SOLUTIONS[m.id].find(([, prem]) => prem.some((p) => !fresh.has(p)));
  if (later) {
    const res = evaluate(m, fresh, later[0], later[1]);
    ok(res.status === "order", "Ordnungszwang blockiert verfrühten Schritt");
  }
}

// Distraktor / Sackgasse: p_fixpunkt r_antiR ist gültig, aber Sackgasse
{
  const m = withDead(MISSIONS.find((x) => x.id === "p_fixpunkt"));
  const have = new Set(m.depths[m.depths.length - 1].given);
  const res = evaluate(m, have, "r_antiR", ["s_sim"]);
  ok(res.ok && res.status === "sackgasse", "Distraktor r_antiR wird als Sackgasse erkannt");
}

// Regelwahl: falsche Regel auf richtige Prämissen
{
  const m = withDead(MISSIONS.find((x) => x.id === "p_neutral"));
  const have = new Set(["n_e", "n_e2", "n_eq1", "n_eq2"]);
  const res = evaluate(m, have, "r_kommut", ["n_eq1", "n_eq2"]);
  ok(!res.ok && (res.status === "rule-mismatch" || res.status === "no-rule"), "Falsche Regel wird abgelehnt");
}

console.log(`\n${fail === 0 ? "ALLE TESTS BESTANDEN" : "FEHLER"} — ${pass} ok, ${fail} fehlgeschlagen`);
process.exit(fail === 0 ? 0 : 1);
