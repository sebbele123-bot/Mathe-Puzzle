/* ====================================================================
 *  Quizfragen für Karteikarten — von Hand geschrieben.
 *  Schlüssel = Katalog-id (def:… / proof:… / defcard:… / sym:…).
 *  Eine Karte ohne Eintrag bietet den Quizmodus schlicht nicht an.
 *
 *  Zwei Arten:
 *    { art: "abcd",   frage, optionen: [...], richtig: <Index>, hinweis }
 *    { art: "janein", frage, richtig: <bool>, hinweis }
 *  `hinweis` wird nach der Antwort gezeigt — er begründet, statt nur zu werten.
 *
 *  SCHWIERIGKEIT: Jede Frage braucht `schwierigkeit` (1–10). Maßstab und
 *  Ankerbeispiele stehen in `schwierigkeit.js`; ohne den Wert schlägt
 *  `schwierigkeit.test.jsx` fehl.
 * ==================================================================== */

export const QUIZ = {
  // --- Steckbriefe ---------------------------------------------------
  "defcard:d01": [
    {
      art: "abcd",
      schwierigkeit: 3,
      frage: "Welche Eigenschaft gehört nicht zur Definition eines Skalarprodukts?",
      optionen: ["Bilinearität", "Symmetrie", "positive Definitheit", "Assoziativität"],
      richtig: 3,
      hinweis: "Ein Skalarprodukt ist eine symmetrische, positiv definite Bilinearform. Assoziativität ist für eine Abbildung V×V→ℝ gar nicht formulierbar.",
    },
    {
      art: "janein",
      schwierigkeit: 2,
      frage: "Positive Definitheit bedeutet s(v,v) > 0 für alle v ≠ 0.",
      richtig: true,
      hinweis: "Genau das ist die Bedingung — für v = 0 ist s(0,0) = 0.",
    },
  ],
  "defcard:d02": [
    {
      art: "janein",
      schwierigkeit: 3,
      frage: "O(Z,s) besteht aus den Elementen von GL(Z), die das Skalarprodukt erhalten.",
      richtig: true,
      hinweis: "O(Z,s) = { g ∈ GL(Z) | s(gv,gw) = s(v,w) für alle v,w }.",
    },
  ],

  // --- Struktur-Lektionen --------------------------------------------
  "def:dA1": [
    {
      art: "abcd",
      schwierigkeit: 3,
      frage: "Aus welchen drei Zutaten baust du das Skalarprodukt?",
      optionen: [
        "Bilinearform + symmetrisch + positiv definit",
        "Bilinearform + assoziativ + neutrales Element",
        "Vektorraum + Dimension 2 + Norm",
        "Linearform + symmetrisch + positiv definit",
      ],
      richtig: 0,
      hinweis: "Genau das Rezept: β: V×V→ℝ, dazu β(v,w)=β(w,v) und β(v,v)>0.",
    },
  ],
  "def:dA9": [
    {
      art: "abcd",
      schwierigkeit: 2,
      frage: "Wie ist ein Strahl aufgebaut?",
      optionen: [
        "ℝ≥0 · v für einen Vektor v ≠ 0",
        "ℝ · v für einen Vektor v ≠ 0",
        "alle v mit ‖v‖ = 1",
        "die Verbindungsstrecke zweier Punkte",
      ],
      richtig: 0,
      hinweis: "Nur die nichtnegativen Vielfachen — ℝ·v wäre die ganze Gerade.",
    },
    {
      art: "janein",
      schwierigkeit: 3,
      frage: "Auch der Nullvektor ist als Richtung eines Strahls zugelassen.",
      richtig: false,
      hinweis: "Es wird v ≠ 0 verlangt, sonst wäre die Menge nur {0}.",
    },
  ],

  // --- Beweise --------------------------------------------------------
  "proof:p_neutral": [
    {
      art: "janein",
      schwierigkeit: 4,
      frage: "In einer Menge mit assoziativer Verknüpfung kann es zwei verschiedene neutrale Elemente geben.",
      richtig: false,
      hinweis: "Sind e und e′ beide neutral, so gilt e = e∘e′ = e′.",
    },
    {
      art: "abcd",
      schwierigkeit: 5,
      frage: "Welcher Ausdruck trägt den Beweis?",
      optionen: [
        "e∘e′ — einmal von links, einmal von rechts ausgewertet",
        "e∘e — das Element mit sich selbst",
        "e⁻¹∘e — das Inverse",
        "e + e′ — die Summe der beiden",
      ],
      richtig: 0,
      hinweis: "Dasselbe Produkt e∘e′ auf zwei Arten ausgewertet: mit e′ neutral ergibt es e, mit e neutral ergibt es e′.",
    },
  ],

  // --- Symbol-Aufgaben -------------------------------------------------
  "sym:s_halbgruppe": [
    {
      art: "abcd",
      schwierigkeit: 2,
      frage: "Was macht eine Menge mit Verknüpfung zur Halbgruppe?",
      optionen: [
        "abgeschlossen und assoziativ",
        "abgeschlossen und kommutativ",
        "assoziativ mit neutralem Element",
        "assoziativ, und jedes Element ist invertierbar",
      ],
      richtig: 0,
      hinweis: "Halbgruppe = Abgeschlossenheit + Assoziativität. Ein neutrales Element macht daraus ein Monoid.",
    },
    {
      art: "janein",
      schwierigkeit: 3,
      frage: "Jedes Monoid ist auch eine Halbgruppe.",
      richtig: true,
      hinweis: "Ein Monoid ist eine Halbgruppe mit neutralem Element — die Halbgruppen-Eigenschaften bleiben erhalten.",
    },
  ],
  "sym:s_gruppe": [
    {
      art: "abcd",
      schwierigkeit: 2,
      frage: "Was fehlt einem Monoid noch zur Gruppe?",
      optionen: [
        "zu jedem Element ein inverses",
        "Kommutativität",
        "Assoziativität",
        "ein neutrales Element",
      ],
      richtig: 0,
      hinweis: "Gruppe = Monoid + Inverse. Käme Kommutativität dazu, wäre es eine abelsche Gruppe.",
    },
    {
      art: "janein",
      schwierigkeit: 3,
      frage: "Jede Gruppe ist kommutativ.",
      richtig: false,
      hinweis: "Nur abelsche Gruppen sind kommutativ — die Drehspiegelgruppe zum Beispiel ist es nicht.",
    },
  ],
  "sym:s_koerper": [
    {
      art: "abcd",
      schwierigkeit: 4,
      frage: "Wodurch wird aus einem Ring ein Körper?",
      optionen: [
        "kommutative Multiplikation und Inverse für alle Elemente ≠ 0",
        "nur durch Kommutativität der Addition",
        "durch Weglassen des Distributivgesetzes",
        "durch eine dritte Verknüpfung",
      ],
      richtig: 0,
      hinweis: "Im Baukasten genau so gebaut: Ring + kommutativ + inverses Element.",
    },
  ],
};

/** Fragen einer Karte (leer, wenn keine geschrieben wurden). */
export const quizFor = (catalogId) => QUIZ[catalogId] || [];
export const hasQuiz = (catalogId) => quizFor(catalogId).length > 0;

/** Ist eine Antwort richtig? (Index bei abcd, Bool bei ja/nein) */
export const istRichtig = (frage, antwort) =>
  frage.art === "janein" ? antwort === frage.richtig : antwort === frage.richtig;

/**
 * Antwortmöglichkeiten mischen — bei jedem Aufruf der Frage neu.
 * Ohne das trüge die Position Information: in den Daten steht die
 * richtige Antwort fast immer vorn, „immer die erste" käme damit weit.
 * Gemischt wird nur die Anzeige; `richtig` in den Daten bleibt, wie es ist.
 *
 * @returns { optionen, richtig } — Texte in neuer Reihenfolge und der
 *          Index, an dem die richtige Antwort jetzt steht.
 */
export function mischeOptionen(frage, rnd = Math.random) {
  const reihenfolge = frage.optionen.map((_, i) => i);
  for (let i = reihenfolge.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [reihenfolge[i], reihenfolge[j]] = [reihenfolge[j], reihenfolge[i]];
  }
  return {
    optionen: reihenfolge.map((i) => frage.optionen[i]),
    richtig: reihenfolge.indexOf(frage.richtig),
  };
}
