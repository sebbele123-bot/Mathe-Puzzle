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

  // ---- M4 · Ü5.1 · Verkettung von Drehungen (Fixpunkt) ----
  r51_d: { id: "r51_d", name: "d: p+z ↦ p+iz", sub: "90°-Drehung um p" },
  r51_dc: { id: "r51_dc", name: "d(x) = p + i(x−p)", sub: "" },
  r51_dlin: { id: "r51_dlin", name: "d(z) = iz + p(1−i)", sub: "" },
  r51_comp: { id: "r51_comp", name: "(w+)∘d: z ↦ iz + p(1−i) + w", sub: "" },
  r51_1mi: { id: "r51_1mi", name: "1 − i ≠ 0", sub: "" },
  r51_fixeq: { id: "r51_fixeq", name: "p′ = i·p′ + p(1−i) + w", sub: "Fixpunktgleichung" },
  r51_factored: { id: "r51_factored", name: "p′(1−i) = p(1−i) + w", sub: "" },
  r51_goal: { id: "r51_goal", name: "p′ = p + w/(1−i)", sub: "Fixpunkt der neuen Drehung", role: "ziel" },

  // ---- M5 · Ü6.1 · Kreisspiegelung an K(i; 2) ----
  k61_setup: { id: "k61_setup", name: "Kreisspiegelung an K(i; 2)", sub: "Zentrum i, Radius 2" },
  k61_formula: { id: "k61_formula", name: "s(z) = i + 4/(z̄ + i)", sub: "" },
  k61_ionc: { id: "k61_ionc", name: "i liegt auf S¹", sub: "|i| = 1" },
  k61_line: { id: "k61_line", name: "Bild von S¹ ist eine Gerade", sub: "" },
  k61_pts: { id: "k61_pts", name: "s(1)=2−i, s(−1)=−2−i", sub: "" },
  k61_goal: { id: "k61_goal", name: "Bild von S¹: Gerade Im z = −1", sub: "", role: "ziel" },

  // ---- M6 · Ü8.3 · Zentralprojektion aus (0,0,1) ----
  z83_setup: { id: "z83_setup", name: "Zentralprojektion, Zentrum (0,0,1)", sub: "auf die xy-Ebene" },
  z83_line: { id: "z83_line", name: "(0,0,1) + t·((x,y,z)−(0,0,1))", sub: "Verbindungsgerade" },
  z83_zcomp: { id: "z83_zcomp", name: "z-Komponente: 1 + t(z−1)", sub: "" },
  z83_t: { id: "z83_t", name: "t = 1/(1−z)", sub: "" },
  z83_goal: { id: "z83_goal", name: "(x,y,z) ↦ (x/(1−z), y/(1−z))", sub: "", role: "ziel" },
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

  // M4 · Ü5.1  (r_fixansatz und r_solve werden wiederverwendet)
  r51_center: { id: "r51_center", name: "Zentrum einsetzen", sub: "Drehung um den Punkt p" },
  r51_expand: { id: "r51_expand", name: "ausmultiplizieren", sub: "Klammern auflösen" },
  r51_after: { id: "r51_after", name: "Translation danach", sub: "g∘d mit g = (w+)" },
  r51_collect: { id: "r51_collect", name: "Terme sammeln", sub: "gleiche Terme zusammenfassen" },
  r51_before: { id: "r51_before", name: "Translation davor", sub: "d∘g mit g = (w+)" },
  r51_conj: { id: "r51_conj", name: "Konjugation", sub: "z ↦ z̄" },

  // M5 · Ü6.1
  r61_center: { id: "r61_center", name: "Kreis durch das Zentrum", sub: "↦ Gerade" },
  r61_imgpts: { id: "r61_imgpts", name: "Punkte spiegeln", sub: "s auf einzelne Punkte" },
  r61_line: { id: "r61_line", name: "Gerade festlegen", sub: "durch zwei Bildpunkte" },
  r61_conj: { id: "r61_conj", name: "Konjugation", sub: "z ↦ z̄" },
  r61_transl: { id: "r61_transl", name: "Verschiebung", sub: "z ↦ z + c" },

  // M6 · Ü8.3
  r83_line: { id: "r83_line", name: "Verbindungsgerade", sub: "Zentrum und Punkt" },
  r83_zcomp: { id: "r83_zcomp", name: "z-Koordinate", sub: "der Geraden" },
  r83_setzero: { id: "r83_setzero", name: "Ebene schneiden", sub: "z = 0 setzen" },
  r83_insert: { id: "r83_insert", name: "einsetzen", sub: "t in die Gerade" },
  r83_orth: { id: "r83_orth", name: "Orthogonalprojektion", sub: "(x,y,z) ↦ (x,y)" },
  r83_norm: { id: "r83_norm", name: "Normieren", sub: "auf Länge 1" },
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
      { rule: "r_neutral", premises: ["n_e2"], produces: "n_eq1", idea: "Produkt e∘e′ von rechts ausgewertet" },
      { rule: "r_neutral", premises: ["n_e"], produces: "n_eq2", idea: "Produkt e∘e′ von links ausgewertet" },
      { rule: "r_trans", premises: ["n_eq1", "n_eq2"], produces: "n_goal", idea: "beide Werte gleichgesetzt: e = e′" },
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
      { rule: "r_orient", premises: ["s_sim", "s_orient"], produces: "s_hol", idea: "Normalform der Ähnlichkeit bestimmt" },
      { rule: "r_kongkrit", premises: ["s_sim", "s_notcong"], produces: "s_absne1", idea: "Skalierungsfaktor |a| ≠ 1 gezeigt" },
      { rule: "r_absa", premises: ["s_absne1"], produces: "s_ane1", idea: "a ≠ 1 gefolgert" },
      { rule: "r_fixansatz", premises: ["s_hol"], produces: "s_fixeq", idea: "Fixpunktgleichung aufgestellt" },
      { rule: "r_1ma", premises: ["s_ane1"], produces: "s_1ma", idea: "1 − a invertierbar (≠ 0)" },
      { rule: "r_solve", premises: ["s_fixeq", "s_1ma"], produces: "s_goal", idea: "eindeutigen Fixpunkt bestimmt" },
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
      { rule: "r_transit", premises: ["c_annahme"], produces: "c_exists", idea: "aus der Annahme ein überführendes g gewonnen" },
      { rule: "r_orth", premises: ["c_exists", "c_norm10", "c_norm11"], produces: "c_factor", idea: "nötigen Skalierungsfaktor √2 abgelesen" },
      { rule: "r_widerspruch", premises: ["c_factor", "c_sqrt2"], produces: "c_goal", idea: "Widerspruch: √2 müsste rational sein" },
    ],
    depths: [
      { label: "Mit Existenz", given: ["c_annahme", "c_sqrt2", "c_norm10", "c_norm11", "c_det", "c_exists"] },
      { label: "Standard", given: ["c_annahme", "c_sqrt2", "c_norm10", "c_norm11", "c_det"] },
    ],
  },

  {
    id: "p_rot51",
    title: "Ü5.1 — Verkettung von Drehungen",
    ref: "Übung 5.1",
    kind: "beweis",
    claim:
      "Die Verkettung (w+)∘d der 90°-Drehung d mit Fixpunkt p und der Translation um w ist wieder eine 90°-Drehung; ihr Fixpunkt ist p′ = p + w/(1−i).",
    goal: "r51_goal",
    pool: {
      facts: ["r51_d", "r51_dc", "r51_dlin", "r51_comp", "r51_1mi", "r51_fixeq", "r51_factored", "r51_goal"],
      rules: ["r51_center", "r51_expand", "r51_after", "r_fixansatz", "r51_collect", "r_solve", "r51_before", "r51_conj"],
    },
    steps: [
      { rule: "r51_center", premises: ["r51_d"], produces: "r51_dc", idea: "Drehung um p in Punktform gebracht" },
      { rule: "r51_expand", premises: ["r51_dc"], produces: "r51_dlin", idea: "zur linearen Form iz + p(1−i) ausmultipliziert" },
      { rule: "r51_after", premises: ["r51_dlin"], produces: "r51_comp", idea: "Translation um w nachgeschaltet" },
      { rule: "r_fixansatz", premises: ["r51_comp"], produces: "r51_fixeq", idea: "Fixpunktgleichung aufgestellt" },
      { rule: "r51_collect", premises: ["r51_fixeq"], produces: "r51_factored", idea: "p′-Terme zu p′(1−i) zusammengefasst" },
      { rule: "r_solve", premises: ["r51_factored", "r51_1mi"], produces: "r51_goal", idea: "durch (1−i) geteilt → Fixpunkt" },
    ],
    depths: [
      { label: "Ab Fixpunktgleichung", given: ["r51_fixeq", "r51_1mi"] },
      { label: "Ab Linearform", given: ["r51_dlin", "r51_1mi"] },
      { label: "Von vorn", given: ["r51_d", "r51_1mi"] },
    ],
  },

  {
    id: "p_inv61",
    title: "Ü6.1 — Kreisspiegelung",
    ref: "Übung 6.1",
    kind: "beweis",
    claim:
      "Die Kreisspiegelung am Kreis K(i; 2) bildet den Einheitskreis S¹ — der durch das Zentrum i läuft — auf die Gerade Im z = −1 ab.",
    goal: "k61_goal",
    pool: {
      facts: ["k61_setup", "k61_formula", "k61_ionc", "k61_line", "k61_pts", "k61_goal"],
      rules: ["r61_center", "r61_imgpts", "r61_line", "r61_conj", "r61_transl"],
    },
    steps: [
      { rule: "r61_center", premises: ["k61_setup", "k61_ionc"], produces: "k61_line", idea: "Kreis durch das Zentrum ⇒ Bild ist eine Gerade" },
      { rule: "r61_imgpts", premises: ["k61_formula"], produces: "k61_pts", idea: "zwei Randpunkte gespiegelt" },
      { rule: "r61_line", premises: ["k61_line", "k61_pts"], produces: "k61_goal", idea: "Gerade festgelegt: Im z = −1" },
    ],
    depths: [{ label: "Standard", given: ["k61_setup", "k61_formula", "k61_ionc"] }],
  },

  {
    id: "p_proj83",
    title: "Ü8.3 — Zentralprojektion",
    ref: "Übung 8.3",
    kind: "beweis",
    claim:
      "Die Zentralprojektion mit Zentrum (0,0,1) auf die xy-Ebene ist in Koordinaten (x,y,z) ↦ (x/(1−z), y/(1−z)).",
    goal: "z83_goal",
    pool: {
      facts: ["z83_setup", "z83_line", "z83_zcomp", "z83_t", "z83_goal"],
      rules: ["r83_line", "r83_zcomp", "r83_setzero", "r83_insert", "r83_orth", "r83_norm"],
    },
    steps: [
      { rule: "r83_line", premises: ["z83_setup"], produces: "z83_line", idea: "Verbindungsgerade Zentrum–Punkt aufgestellt" },
      { rule: "r83_zcomp", premises: ["z83_line"], produces: "z83_zcomp", idea: "z-Koordinate der Geraden abgelesen" },
      { rule: "r83_setzero", premises: ["z83_zcomp"], produces: "z83_t", idea: "Schnitt mit der Ebene: Parameter t bestimmt" },
      { rule: "r83_insert", premises: ["z83_line", "z83_t"], produces: "z83_goal", idea: "t eingesetzt → Bildkoordinaten" },
    ],
    depths: [
      { label: "Mit Gerade", given: ["z83_setup", "z83_line"] },
      { label: "Von vorn", given: ["z83_setup"] },
    ],
  },
];
