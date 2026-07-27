/* ====================================================================
 *  Quizfragen für Karteikarten — von Hand geschrieben.
 *  Schlüssel = Katalog-id (def:… / proof:… / defcard:… / sym:…).
 *  Eine Karte ohne Eintrag bietet den Quizmodus schlicht nicht an.
 *
 *  Zwei Arten:
 *    { art: "abcd",   frage, optionen: [...], richtig: <Index>, hinweis }
 *    { art: "janein", frage, richtig: <bool>, hinweis }
 *  `hinweis` wird nach der Antwort gezeigt — er begründet, statt nur zu werten.
 * ==================================================================== */

export const QUIZ = {
  // --- Steckbriefe ---------------------------------------------------
  "defcard:d01": [
    {
      art: "abcd",
      frage: "Welche Eigenschaft gehört nicht zur Definition eines Skalarprodukts?",
      optionen: ["Bilinearität", "Symmetrie", "positive Definitheit", "Assoziativität"],
      richtig: 3,
      hinweis: "Ein Skalarprodukt ist eine symmetrische, positiv definite Bilinearform. Assoziativität ist für eine Abbildung V×V→ℝ gar nicht formulierbar.",
    },
    {
      art: "janein",
      frage: "Positive Definitheit bedeutet s(v,v) > 0 für alle v ≠ 0.",
      richtig: true,
      hinweis: "Genau das ist die Bedingung — für v = 0 ist s(0,0) = 0.",
    },
  ],
  "defcard:d02": [
    {
      art: "janein",
      frage: "O(Z,s) besteht aus den Elementen von GL(Z), die das Skalarprodukt erhalten.",
      richtig: true,
      hinweis: "O(Z,s) = { g ∈ GL(Z) | s(gv,gw) = s(v,w) für alle v,w }.",
    },
  ],

  // --- Struktur-Lektionen --------------------------------------------
  "def:dA1": [
    {
      art: "abcd",
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
      frage: "Auch der Nullvektor ist als Richtung eines Strahls zugelassen.",
      richtig: false,
      hinweis: "Es wird v ≠ 0 verlangt, sonst wäre die Menge nur {0}.",
    },
  ],

  // --- Beweise --------------------------------------------------------
  "proof:p_neutral": [
    {
      art: "janein",
      frage: "In einer Menge mit assoziativer Verknüpfung kann es zwei verschiedene neutrale Elemente geben.",
      richtig: false,
      hinweis: "Sind e und e′ beide neutral, so gilt e = e∘e′ = e′.",
    },
    {
      art: "abcd",
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
      frage: "Jedes Monoid ist auch eine Halbgruppe.",
      richtig: true,
      hinweis: "Ein Monoid ist eine Halbgruppe mit neutralem Element — die Halbgruppen-Eigenschaften bleiben erhalten.",
    },
  ],
  "sym:s_gruppe": [
    {
      art: "abcd",
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
      frage: "Jede Gruppe ist kommutativ.",
      richtig: false,
      hinweis: "Nur abelsche Gruppen sind kommutativ — die Drehspiegelgruppe zum Beispiel ist es nicht.",
    },
  ],
  "sym:s_koerper": [
    {
      art: "abcd",
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
