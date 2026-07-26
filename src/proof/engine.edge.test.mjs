/* ====================================================================
 *  Beweis-Engine — Randfälle, die engine.test.mjs nicht abdeckt:
 *  givenFor-Tiefenklammerung und Multimengen-Verhalten (Duplikate).
 *  Lauf: node src/proof/engine.edge.test.mjs
 * ==================================================================== */
import { MISSIONS } from "./data.js";
import { craftFromCluster, givenFor } from "./engine.js";

let pass = 0, fail = 0;
const t = (name, cond, info = "") => { cond ? pass++ : fail++; console.log(`${cond ? "ok  " : "FAIL"} ${name}${info ? "  " + info : ""}`); };
const sameArr = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// Mission mit mehreren Tiefenstufen (p_fixpunkt hat 3)
const m = MISSIONS.find((x) => x.depths.length >= 3);
t("Testmission mit ≥3 Tiefen gefunden", !!m, m ? `${m.id} (${m.depths.length})` : "keine");

// --- givenFor: liefert die Startaussagen der jeweiligen Stufe ----------
t("Stufe 0 → depths[0].given", sameArr(givenFor(m, 0), m.depths[0].given));
t("Stufe 1 → depths[1].given", sameArr(givenFor(m, 1), m.depths[1].given));

// --- givenFor: Tiefe wird auf die letzte Stufe geklammert --------------
const last = m.depths[m.depths.length - 1].given;
t("zu große Tiefe → letzte Stufe (Klammerung)", sameArr(givenFor(m, 99), last));
t("exakt letzte Stufe", sameArr(givenFor(m, m.depths.length - 1), last));

// --- Multimengen: doppelte Prämisse ≠ einfache Prämisse ---------------
// Ein Schritt mit einfacher Prämisse darf nicht mit einer doppelten
// Kachel einrasten (sameMultiset zählt Duplikate).
{
  const single = m.steps.find((s) => s.premises.length === 1);
  if (single) {
    // have muss die Prämisse enthalten, sonst blockt schon der Ordnungszwang
    const have = new Set(single.premises);
    // Kontrolle: einfache Prämisse rastet ein
    const okRes = craftFromCluster(m, have, [
      { kind: "regel", id: single.rule }, { kind: "fakt", id: single.premises[0] },
    ]);
    t("einfache Prämisse rastet ein", okRes.ok && okRes.produces === single.produces, `reason=${okRes.reason}`);
    const dbl = [
      { kind: "regel", id: single.rule },
      { kind: "fakt", id: single.premises[0] },
      { kind: "fakt", id: single.premises[0] }, // dieselbe Prämisse doppelt
    ];
    const res = craftFromCluster(m, have, dbl);
    t("doppelte Prämisse rastet nicht ein (Multimenge)", !res.ok && res.reason === "no-match", `reason=${res.reason}`);
  } else {
    t("Schritt mit einfacher Prämisse vorhanden", false, "keiner gefunden");
  }
}

// --- leerer Cluster / nur Fakten wird abgelehnt ----------------------
{
  const res = craftFromCluster(m, new Set(last), [{ kind: "fakt", id: last[0] }]);
  t("Cluster ohne Regel → need-one-rule", !res.ok && res.reason === "need-one-rule");
  const res2 = craftFromCluster(m, new Set(last), []);
  t("leerer Cluster → need-one-rule", !res2.ok && res2.reason === "need-one-rule");
}

console.log(`\n${pass} ok, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
