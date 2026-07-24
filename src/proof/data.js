/* ====================================================================
 *  Beweis-Baukasten — Datenmodell
 * --------------------------------------------------------------------
 *  Ein Beweis ist ein gerichteter Graph aus Kacheln:
 *    Aussage(n)  +  Schlussregel  →  neue Aussage
 *  Gebaut wird auf einer Werkbank: passende Aussagen und genau eine
 *  Regel zusammenschieben, dann verschmelzen sie zur Folgerung.
 *
 *  Wichtig fürs Spielgefühl: Regel- und Aussagen-Texte verraten NICHT,
 *  worauf man sie anwenden soll. Distraktoren sehen aus wie echte
 *  Bausteine — welche passen, muss man selbst herausfinden.
 * ==================================================================== */

// role: undefiniert = normale Aussage · "ziel" = Beweisziel
export const FACTS = {
  // ---- M1 · Neutralelement eindeutig ----
  n_e: { id: "n_e", name: "e neutral", sub: "e∘x = x∘e = x" },
  n_e2: { id: "n_e2", name: "e′ neutral", sub: "e′∘x = x∘e′ = x" },
  n_eq1: { id: "n_eq1", name: "e∘e′ = e", sub: "" },
  n_eq2: { id: "n_eq2", name: "e∘e′ = e′", sub: "" },
  n_goal: { id: "n_goal", name: "e = e′", sub: "Neutralelement eindeutig", role: "ziel" },

  // ---- M2 · Ü5.2 · Fixpunkt einer Ähnlichkeit ----
  s_sim: { id: "s_sim", name: "f ist Ähnlichkeit", sub: "von ℂ" },
  s_orient: { id: "s_orient", name: "f orientierungstreu", sub: "" },
  s_notcong: { id: "s_notcong", name: "f keine Kongruenz", sub: "" },
  s_hol: { id: "s_hol", name: "f: z ↦ az + b", sub: "" },
  s_absne1: { id: "s_absne1", name: "|a| ≠ 1", sub: "" },
  s_ane1: { id: "s_ane1", name: "a ≠ 1", sub: "" },
  s_fixeq: { id: "s_fixeq", name: "z = az + b", sub: "Fixpunktgleichung" },
  s_1ma: { id: "s_1ma", name: "1 − a ≠ 0", sub: "" },
  s_goal: { id: "s_goal", name: "z = b/(1 − a)", sub: "genau ein Fixpunkt", role: "ziel" },

  // ---- M3 · Ü2.1 · O(ℚ²) ist keine Drehspiegelgruppe (Widerspruch) ----
  c_annahme: { id: "c_annahme", name: "Annahme: O(ℚ²) DSG", sub: "Widerspruchsannahme" },
  c_sqrt2: { id: "c_sqrt2", name: "√2 ∉ ℚ", sub: "" },
  c_norm10: { id: "c_norm10", name: "‖(1,0)‖ = 1", sub: "" },
  c_norm11: { id: "c_norm11", name: "‖(1,1)‖ = √2", sub: "" },
  c_det: { id: "c_det", name: "det g = ±1", sub: "" },
  c_exists: { id: "c_exists", name: "∃ g: Strahl → Strahl", sub: "g·ℚ≥0(1,0) = ℚ≥0(1,1)" },
  c_factor: { id: "c_factor", name: "Skalierung √2", sub: "" },
  c_goal: { id: "c_goal", name: "Widerspruch", sub: "Behauptung folgt", role: "ziel" },
};

// Schlussregeln — Text nennt nur die allgemeine Form der Regel,
// nicht, auf welche konkreten Aussagen sie anzuwenden ist.
export const RULES = {
  // M1
  r_neutral: { id: "r_neutral", name: "Neutralität anwenden", sub: "n neutral ⇒ x∘n = x = n∘x" },
  r_trans: { id: "r_trans", name: "Gleichungen verketten", sub: "a=b und a=c ⇒ b=c" },
  r_kommut: { id: "r_kommut", name: "Kommutativität", sub: "a∘b = b∘a" },

  // M2
  r_orient: { id: "r_orient", name: "orientierungstreue Form", sub: "orientierungstreue Ähnlichkeit" },
  r_antiR: { id: "r_antiR", name: "spiegelnde Form", sub: "orientierungsumkehrende Ähnlichkeit" },
  r_kongkrit: { id: "r_kongkrit", name: "Kongruenz-Kriterium", sub: "Kongruenz ⟺ |a| = 1" },
  r_absa: { id: "r_absa", name: "Betrag auswerten", sub: "aus |a| folgt Aussage über a" },
  r_fixansatz: { id: "r_fixansatz", name: "Fixpunkt ansetzen", sub: "f(z) = z" },
  r_1ma: { id: "r_1ma", name: "umstellen", sub: "a ≠ 1 ⇒ 1 − a ≠ 0" },
  r_solve: { id: "r_solve", name: "linear lösen", sub: "c·z = d, c ≠ 0 ⇒ eindeutig" },

  // M3
  r_transit: { id: "r_transit", name: "Transitivität nutzen", sub: "wirkt transitiv auf Strahlen" },
  r_orth: { id: "r_orth", name: "Norm erhalten", sub: "orthogonal ⇒ ‖gv‖ = ‖v‖" },
  r_widerspruch: { id: "r_widerspruch", name: "Widerspruch ziehen", sub: "unvereinbare Aussagen" },
  r_detNaiv: { id: "r_detNaiv", name: "Determinante", sub: "det einer orthogonalen Abbildung" },
};

// steps: gültige Inferenzen  { rule, premises:[factId...], produces }
// depths: Starttiefen (leicht → schwer), jede mit ihrer given-Menge
export const MISSIONS = [
  {
    id: "p_neutral",
    title: "Neutralelement ist eindeutig",
    ref: "Grundlagen (Algebra)",
    kind: "beweis",
    claim:
      "In einer Menge mit assoziativer Verknüpfung ist ein neutrales Element eindeutig: sind e und e′ beide neutral, so gilt e = e′.",
    goal: "n_goal",
    pool: {
      facts: ["n_e", "n_e2", "n_eq1", "n_eq2", "n_goal"],
      rules: ["r_neutral", "r_trans", "r_kommut"],
    },
    steps: [
      { rule: "r_neutral", premises: ["n_e2"], produces: "n_eq1" }, // e′ neutral ⇒ e∘e′ = e
      { rule: "r_neutral", premises: ["n_e"], produces: "n_eq2" }, //  e  neutral ⇒ e∘e′ = e′
      { rule: "r_trans", premises: ["n_eq1", "n_eq2"], produces: "n_goal" },
    ],
    depths: [{ label: "Standard", given: ["n_e", "n_e2"] }],
  },

  {
    id: "p_fixpunkt",
    title: "Ü5.2 — Fixpunkt einer Ähnlichkeit",
    ref: "Übung 5.2 (Folgerung)",
    kind: "beweis",
    claim:
      "Eine orientierungstreue Ähnlichkeit von ℂ, die keine Kongruenz ist, hat genau einen Fixpunkt z = b/(1−a).",
    goal: "s_goal",
    pool: {
      facts: ["s_sim", "s_orient", "s_notcong", "s_hol", "s_absne1", "s_ane1", "s_fixeq", "s_1ma", "s_goal"],
      rules: ["r_orient", "r_antiR", "r_kongkrit", "r_absa", "r_fixansatz", "r_1ma", "r_solve"],
    },
    steps: [
      { rule: "r_orient", premises: ["s_sim", "s_orient"], produces: "s_hol" },
      { rule: "r_kongkrit", premises: ["s_sim", "s_notcong"], produces: "s_absne1" },
      { rule: "r_absa", premises: ["s_absne1"], produces: "s_ane1" },
      { rule: "r_fixansatz", premises: ["s_hol"], produces: "s_fixeq" },
      { rule: "r_1ma", premises: ["s_ane1"], produces: "s_1ma" },
      { rule: "r_solve", premises: ["s_fixeq", "s_1ma"], produces: "s_goal" },
    ],
    depths: [
      { label: "Mit |a|≠1", given: ["s_sim", "s_orient", "s_notcong", "s_hol", "s_absne1"] },
      { label: "Ab Normalform", given: ["s_sim", "s_orient", "s_notcong", "s_hol"] },
      { label: "Von vorn", given: ["s_sim", "s_orient", "s_notcong"] },
    ],
  },

  {
    id: "p_sqrt2",
    title: "Ü2.1 — O(ℚ²) ist keine Drehspiegelgruppe",
    ref: "Übung 2.1",
    kind: "beweis",
    claim:
      "Die orthogonale Gruppe von ℚ² mit Standardskalarprodukt ist keine Drehspiegelgruppe — kein Element führt den Strahl ℚ≥0(1,0) in ℚ≥0(1,1) über, da √2 ∉ ℚ. (Widerspruchsbeweis)",
    goal: "c_goal",
    pool: {
      facts: ["c_annahme", "c_sqrt2", "c_norm10", "c_norm11", "c_det", "c_exists", "c_factor", "c_goal"],
      rules: ["r_transit", "r_orth", "r_widerspruch", "r_detNaiv"],
    },
    steps: [
      { rule: "r_transit", premises: ["c_annahme"], produces: "c_exists" },
      { rule: "r_orth", premises: ["c_exists", "c_norm10", "c_norm11"], produces: "c_factor" },
      { rule: "r_widerspruch", premises: ["c_factor", "c_sqrt2"], produces: "c_goal" },
    ],
    depths: [
      { label: "Mit Existenz", given: ["c_annahme", "c_sqrt2", "c_norm10", "c_norm11", "c_det", "c_exists"] },
      { label: "Standard", given: ["c_annahme", "c_sqrt2", "c_norm10", "c_norm11", "c_det"] },
    ],
  },
];
