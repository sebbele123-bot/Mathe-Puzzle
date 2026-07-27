/* ====================================================================
 *  Definitionssatz aufteilen
 *  Viele Aussagen tragen ihr Definiendum selbst vorweg: „s: symmetrische
 *  …". Dann gehört das Definitionszeichen zwischen beide Teile — also
 *  „s := symmetrische …" — und nicht vor den ganzen Satz.
 *
 *  Nur die eindeutige Doppelpunkt-Form wird geteilt. Die Gleichheitsform
 *  („O(Z,s) = { … }") bleibt unangetastet: dort lässt sich das trennende
 *  „=" nicht zuverlässig von einem „=" in der Formel unterscheiden
 *  (vgl. „Bijektion φ(p + v⃗) = φ(p) + φ⃗(v⃗) …").
 * ==================================================================== */

// Definiendum: kurz, ohne Satzende, ohne weiteren Doppelpunkt und ohne „="
const FORM = /^\s*([^.:=]{1,30}):\s+(\S.*)$/s;

/**
 * @returns { definiendum, definiens } — definiendum ist null, wenn die
 *          Aussage kein eigenes Definiendum vorweg trägt.
 */
export function splitDefinition(statement) {
  const s = String(statement ?? "");
  const m = s.match(FORM);
  if (!m) return { definiendum: null, definiens: s };
  return { definiendum: m[1].trim(), definiens: m[2].trim() };
}
