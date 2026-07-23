/* ====================================================================
 *  Beweis-Baukasten — Engine
 *  Prüft, ob (Regel + gewählte Prämissen-Fakten) eine gültige Inferenz
 *  der aktuellen Mission ist, und liefert erklärendes Feedback.
 * ==================================================================== */

// Multimengen-Gleichheit (Duplikate zählen)
const sameMultiset = (a, b) =>
  a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");

/**
 * Einen Zug auswerten.
 * @param mission   aktuelle Mission
 * @param have      Set<factId> — bereits bewiesene/gegebene Fakten
 * @param ruleId    gewählte Schlussregel
 * @param premises  Array<factId> — die als Prämissen ausgewählten Fakten
 * @returns { ok, produces?, status, message }
 *   status: "success" | "sackgasse" | "known" | "order"
 *         | "rule-mismatch" | "no-rule" | "empty"
 */
export function evaluate(mission, have, ruleId, premises) {
  if (!ruleId) return { ok: false, status: "empty", message: "Wähle zuerst eine Schlussregel." };
  if (premises.length === 0)
    return { ok: false, status: "empty", message: "Wähle die Fakten aus, auf die die Regel wirken soll." };

  // Ordnungszwang: nur bereits vorhandene Fakten dürfen Prämisse sein
  const missing = premises.filter((p) => !have.has(p));
  if (missing.length > 0)
    return {
      ok: false,
      status: "order",
      message: "Diese Fakten sind noch nicht bewiesen — leite sie erst her.",
    };

  // exakter Treffer: Regel UND Prämissen-Multimenge stimmen mit einem Schritt überein
  const exact = mission.steps.find(
    (s) => s.rule === ruleId && sameMultiset(s.premises, premises)
  );
  if (exact) {
    const isDeadEnd = mission._deadEnds?.has(exact.produces);
    if (have.has(exact.produces))
      return { ok: false, status: "known", produces: exact.produces, message: "Diesen Fakt hast du schon." };
    return {
      ok: true,
      produces: exact.produces,
      status: isDeadEnd ? "sackgasse" : "success",
      message: isDeadEnd
        ? "Gültiger Schritt — aber er führt in eine Sackgasse, nicht zum Ziel."
        : "Schritt bewiesen.",
    };
  }

  // Regel existiert, aber passt nicht zu genau diesen Prämissen
  const ruleUsedSomewhere = mission.steps.some((s) => s.rule === ruleId);
  if (ruleUsedSomewhere)
    return {
      ok: false,
      status: "rule-mismatch",
      message: "Diese Regel greift, aber nicht auf genau diese Fakten. Andere Auswahl?",
    };

  return {
    ok: false,
    status: "no-rule",
    message: "Diese Regel führt hier zu keinem gültigen Schluss.",
  };
}

/** Menge der Sackgassen-Fakten einer Mission (aus den FACTS-Rollen). */
export function deadEndSet(mission, FACTS) {
  const s = new Set();
  for (const id of mission.pool.facts) if (FACTS[id]?.role === "sackgasse") s.add(id);
  return s;
}

/** Startfakten für eine Tiefenstufe. */
export function givenFor(mission, depthIndex) {
  const d = mission.depths[Math.min(depthIndex, mission.depths.length - 1)];
  return d.given;
}
