/* ====================================================================
 *  Karteikarten
 *  Ein einzelnes Element aus der Bibliothek ist eine Karteikarte.
 *  Sie kann mehrere Modi anbieten; pro Ziehung wird genau einer gewählt,
 *  und zwar anhand der gemessenen Stärke:
 *    nie geübt → erst zeigen (Auflösung), schwach → bauen,
 *    mittel → bauen oder Quiz, stark → Quiz.
 *  Ebenfalls aus der Stärke: die Stufe, auf der das Bauen beginnt —
 *  Stufe 0 heißt „viele vorgefertigte Teile", die höchste Stufe „von vorn".
 *
 *  Bewusst frei von JSX-Importen, damit die Logik mit Node testbar ist.
 * ==================================================================== */

export const BAUEN = "bauen";
export const QUIZ = "quiz";
export const AUFLOESUNG = "aufloesung";

// Katalog-Ansichten, in denen wirklich gebaut wird (Steckbriefe nicht)
const BAU_ANSICHTEN = new Set(["definition", "beweis", "werkbank"]);
export const kannBauen = (item) => !!item && BAU_ANSICHTEN.has(item.mode);

/** Welche Modi bietet diese Karte an? (kanonische Reihenfolge) */
export function modiFor(item, hasQuiz = false) {
  return [kannBauen(item) && BAUEN, hasQuiz && QUIZ, AUFLOESUNG].filter(Boolean);
}

// Vorlieben je Stärkeband — der erste verfügbare Modus gewinnt.
const VORLIEBE = {
  neu: [AUFLOESUNG, BAUEN, QUIZ],      // nie geübt: erst zeigen, was es ist
  schwach: [BAUEN, AUFLOESUNG, QUIZ],  // schwach: bauen, mit viel Vorgabe
  mittelBau: [BAUEN, QUIZ, AUFLOESUNG],
  mittelQuiz: [QUIZ, BAUEN, AUFLOESUNG],
  stark: [QUIZ, BAUEN, AUFLOESUNG],    // stark: kurzer Check statt vollem Bau
};

/**
 * Modus für diese Ziehung wählen.
 * @param modi      verfügbare Modi (aus modiFor)
 * @param strength  Stärke 0..1 oder null (nie geübt)
 * @param rnd       Zufallszahl 0..1 (injizierbar für Tests)
 */
export function pickModus(modi, strength, rnd = Math.random()) {
  if (!modi || !modi.length) return null;
  let vorliebe;
  if (strength == null) vorliebe = VORLIEBE.neu;
  else if (strength < 0.35) vorliebe = VORLIEBE.schwach;
  else if (strength <= 0.7) vorliebe = rnd < 0.5 ? VORLIEBE.mittelBau : VORLIEBE.mittelQuiz;
  else vorliebe = VORLIEBE.stark;
  return vorliebe.find((m) => modi.includes(m)) ?? modi[0];
}

/**
 * Stufe aus der Stärke. 0 = die meisten vorgefertigten Teile,
 * `maxStufe` = von vorn. Nie geübt zählt wie Stärke 0.
 */
export function stufeFor(strength, maxStufe) {
  if (!Number.isFinite(maxStufe) || maxStufe <= 0) return 0;
  const s = Math.min(1, Math.max(0, strength ?? 0));
  return Math.min(maxStufe, Math.max(0, Math.round(s * maxStufe)));
}

/**
 * Wie viele Teile werden vorgefertigt gestellt?
 * Stufe 0 → `maxStufe` Teile, höchste Stufe → keine.
 */
export const vorgabenFor = (stufe, maxStufe) =>
  Math.max(0, (Number.isFinite(maxStufe) ? maxStufe : 0) - (stufe || 0));
