/* ====================================================================
 *  Beweis-Baukasten — Engine
 *  Prüft, ob ein Werkbank-Cluster (genau eine Regel + einige Aussagen)
 *  eine gültige Inferenz der aktuellen Mission ist.
 * ==================================================================== */

// Multimengen-Gleichheit (Duplikate zählen)
const sameMultiset = (a, b) =>
  a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");

/**
 * Ein Werkbank-Cluster auswerten.
 * @param mission  aktuelle Mission
 * @param have     Set<factId> — bereits bekannte Aussagen (gegeben + gefolgert)
 * @param tiles    [{ kind: "fakt"|"regel", id }]
 * @returns { ok, produces?, rule?, premises?, reason }
 *   reason: "ok" | "need-one-rule" | "order" | "no-match"
 */
export function craftFromCluster(mission, have, tiles) {
  const rules = tiles.filter((t) => t.kind === "regel");
  const facts = tiles.filter((t) => t.kind === "fakt").map((t) => t.id);

  if (rules.length !== 1 || facts.length === 0)
    return { ok: false, reason: "need-one-rule" };

  const ruleId = rules[0].id;

  // Ordnungszwang: nur bereits bekannte Aussagen dürfen Prämisse sein.
  // (Über die Vorräte kann man nur Bekanntes ziehen; diese Prüfung ist die
  //  zusätzliche Absicherung.)
  if (!facts.every((f) => have.has(f))) return { ok: false, reason: "order" };

  const step = mission.steps.find(
    (s) => s.rule === ruleId && sameMultiset(s.premises, facts)
  );
  if (!step) return { ok: false, reason: "no-match" };

  return { ok: true, produces: step.produces, rule: ruleId, premises: facts, idea: step.idea };
}

/** Startaussagen für eine Tiefenstufe. */
export function givenFor(mission, depthIndex) {
  const d = mission.depths[Math.min(depthIndex, mission.depths.length - 1)];
  return d.given;
}
