/* Logik-Test ohne Browser: baut jede Mission über Werkbank-Cluster nach.
 * Lauf: node src/proof/engine.test.mjs */
import { FACTS, MISSIONS } from "./data.js";
import { craftFromCluster, givenFor } from "./engine.js";

let pass = 0, fail = 0;
const ok = (c, msg) => (c ? (pass++, console.log("  ✓ " + msg)) : (fail++, console.error("  ✗ " + msg)));

// Cluster aus Regel + Prämissen bauen
const cluster = (rule, prem) => [{ kind: "regel", id: rule }, ...prem.map((id) => ({ kind: "fakt", id }))];

const SOLUTIONS = {
  p_neutral: [
    ["r_neutral", ["n_e2"]],
    ["r_neutral", ["n_e"]],
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
  p_rot51: [
    ["r51_center", ["r51_d"]],
    ["r51_after", ["r51_dlin"]],
    ["r_fixansatz", ["r51_comp"]],
    ["r_solve", ["r51_fixeq", "r51_1mi"]],
  ],
  p_inv61: [
    ["r61_center", ["k61_setup", "k61_ionc"]],
    ["r61_imgpts", ["k61_formula"]],
    ["r61_line", ["k61_line", "k61_pts"]],
  ],
  p_proj83: [
    ["r83_line", ["z83_setup"]],
    ["r83_zcomp", ["z83_line"]],
    ["r83_setzero", ["z83_zcomp"]],
    ["r83_insert", ["z83_line", "z83_t"]],
  ],
};

for (const m of MISSIONS) {
  console.log("\n# " + m.title);
  const deepest = m.depths.length - 1;
  const have = new Set(givenFor(m, deepest));
  for (const [rule, prem] of SOLUTIONS[m.id]) {
    const res = craftFromCluster(m, have, cluster(rule, prem));
    ok(res.ok, `${rule} → ${res.produces || "?"}`);
    if (res.ok) have.add(res.produces);
  }
  ok(have.has(m.goal), "Ziel erreicht: " + FACTS[m.goal].name);

  // Ordnungszwang: verfrühter Schritt (Prämisse fehlt) wird blockiert
  const fresh = new Set(givenFor(m, deepest));
  const later = SOLUTIONS[m.id].find(([, prem]) => prem.some((p) => !fresh.has(p)));
  if (later) {
    const res = craftFromCluster(m, fresh, cluster(later[0], later[1]));
    ok(!res.ok && res.reason === "order", "Ordnungszwang blockiert verfrühten Schritt");
  }
}

// Regelwahl: Distraktor-Regel rastet nicht ein
{
  const m = MISSIONS.find((x) => x.id === "p_neutral");
  const have = new Set(["n_e", "n_e2", "n_eq1", "n_eq2"]);
  const res = craftFromCluster(m, have, cluster("r_kommut", ["n_eq1", "n_eq2"]));
  ok(!res.ok && res.reason === "no-match", "Distraktor r_kommut rastet nicht ein");
}
// Ein Cluster ohne Regel ist ungültig
{
  const m = MISSIONS.find((x) => x.id === "p_neutral");
  const res = craftFromCluster(m, new Set(["n_e", "n_e2"]), [{ kind: "fakt", id: "n_e" }, { kind: "fakt", id: "n_e2" }]);
  ok(!res.ok && res.reason === "need-one-rule", "Cluster ohne Regel wird abgelehnt");
}
// Zwei Regeln in einem Cluster ist ungültig
{
  const m = MISSIONS.find((x) => x.id === "p_neutral");
  const res = craftFromCluster(m, new Set(["n_e2"]), [{ kind: "regel", id: "r_neutral" }, { kind: "regel", id: "r_trans" }, { kind: "fakt", id: "n_e2" }]);
  ok(!res.ok && res.reason === "need-one-rule", "Cluster mit zwei Regeln wird abgelehnt");
}

console.log(`\n${fail === 0 ? "ALLE TESTS BESTANDEN" : "FEHLER"} — ${pass} ok, ${fail} fehlgeschlagen`);
process.exit(fail === 0 ? 0 : 1);
