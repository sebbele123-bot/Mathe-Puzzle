/* ====================================================================
 *  Beweis-Baukasten — Datenmodell
 * --------------------------------------------------------------------
 *  Ein Beweis ist hier ein gerichteter Graph aus Kacheln:
 *    Fakt(en)  +  Schlussregel  →  neuer Fakt
 *  Eine Mission gibt ein Beweisziel (goal), eine Sammlung von Fakten
 *  und Regeln (inkl. Distraktoren) und die Menge gültiger Inferenzen
 *  (steps). Über `depths` lässt sich die Starttiefe wählen.
 * ==================================================================== */

// --- Fakten (Aussagen) ----------------------------------------------
// role: "fakt" (normale Aussage) | "ziel" (Beweisziel) | "sackgasse"
//       (gültig herleitbar, aber abseits des Weges — Distraktor)
export const FACTS = {
  // ---- M1 · Neutralelement eindeutig ----
  n_e: { id: "n_e", name: "e neutral", sub: "e∘x = x∘e = x für alle x" },
  n_e2: { id: "n_e2", name: "e′ neutral", sub: "e′∘x = x∘e′ = x für alle x" },
  n_eq1: { id: "n_eq1", name: "e∘e′ = e", sub: "weil e′ neutral ist" },
  n_eq2: { id: "n_eq2", name: "e∘e′ = e′", sub: "weil e neutral ist" },
  n_goal: { id: "n_goal", name: "e = e′", sub: "Neutralelement ist eindeutig", role: "ziel" },
  n_idem: { id: "n_idem", name: "e∘e = e", sub: "Idempotenz — wird nicht gebraucht", role: "sackgasse" },

  // ---- M2 · Ü5.2 · Fixpunkt einer Ähnlichkeit ----
  s_sim: { id: "s_sim", name: "f ist Ähnlichkeit", sub: "von ℂ" },
  s_orient: { id: "s_orient", name: "f orientierungstreu", sub: "erhält die Orientierung" },
  s_notcong: { id: "s_notcong", name: "f keine Kongruenz", sub: "kein Abstandserhalt" },
  s_hol: { id: "s_hol", name: "f: z ↦ az + b", sub: "holomorphe Normalform" },
  s_anti: { id: "s_anti", name: "f: z ↦ az̄ + b", sub: "antiholomorph — falscher Zweig", role: "sackgasse" },
  s_absne1: { id: "s_absne1", name: "|a| ≠ 1", sub: "denn f ist keine Kongruenz" },
  s_ane1: { id: "s_ane1", name: "a ≠ 1", sub: "aus |a| ≠ 1" },
  s_fixeq: { id: "s_fixeq", name: "z = az + b", sub: "Fixpunktgleichung" },
  s_1ma: { id: "s_1ma", name: "1 − a ≠ 0", sub: "aus a ≠ 1" },
  s_goal: { id: "s_goal", name: "z = b/(1 − a)", sub: "genau ein Fixpunkt", role: "ziel" },

  // ---- M3 · Ü2.1 · O(ℚ²) ist keine Drehspiegelgruppe ----
  c_annahme: { id: "c_annahme", name: "Annahme: O(ℚ²) DSG", sub: "Widerspruchsannahme" },
  c_sqrt2: { id: "c_sqrt2", name: "√2 ∉ ℚ", sub: "bekanntes Lemma" },
  c_norm10: { id: "c_norm10", name: "‖(1,0)‖ = 1", sub: "Standardnorm" },
  c_norm11: { id: "c_norm11", name: "‖(1,1)‖ = √2", sub: "Standardnorm" },
  c_exists: { id: "c_exists", name: "∃ g: Strahl → Strahl", sub: "g·ℚ≥0(1,0) = ℚ≥0(1,1)" },
  c_factor: { id: "c_factor", name: "Faktor √2 nötig", sub: "g erhält Norm ⇒ Skalierung √2" },
  c_norm11w: { id: "c_norm11w", name: "‖(1,1)‖ = 2", sub: "Wurzel vergessen — falsch", role: "sackgasse" },
  c_det: { id: "c_det", name: "det g = ±1", sub: "wahr, aber unnötig", role: "sackgasse" },
  c_goal: { id: "c_goal", name: "Widerspruch ⇒ Beh.", sub: "√2 müsste rational sein", role: "ziel" },
};

// --- Schlussregeln (Inferenz-Werkzeuge) -----------------------------
export const RULES = {
  // M1
  r_useE2: { id: "r_useE2", name: "e′ ist neutral", sub: "wende e′∘x=x auf x=e an" },
  r_useE: { id: "r_useE", name: "e ist neutral", sub: "wende e∘x=x auf x=e′ an" },
  r_trans: { id: "r_trans", name: "Gleichungen verketten", sub: "a=b, a=c ⟹ b=c" },
  r_kommut: { id: "r_kommut", name: "Kommutativität", sub: "e∘e′ = e′∘e — hier nutzlos" },
  r_idem: { id: "r_idem", name: "Idempotenz-Trick", sub: "führt zu e∘e=e — Sackgasse" },

  // M2
  r_orient: { id: "r_orient", name: "orientierungstreu ⇒ holomorph", sub: "Normalform az+b" },
  r_antiR: { id: "r_antiR", name: "spiegelnd ⇒ antiholomorph", sub: "ignoriert Orientierung" },
  r_kongkrit: { id: "r_kongkrit", name: "Kongruenz ⟺ |a|=1", sub: "keine Kongruenz ⇒ |a|≠1" },
  r_absa: { id: "r_absa", name: "|a|≠1 ⇒ a≠1", sub: "Betrag" },
  r_fixansatz: { id: "r_fixansatz", name: "Fixpunkt ansetzen", sub: "f(z)=z einsetzen" },
  r_1ma: { id: "r_1ma", name: "a≠1 ⇒ 1−a≠0", sub: "umstellen" },
  r_solve: { id: "r_solve", name: "linear lösen", sub: "1−a≠0 ⇒ eindeutige Lösung" },

  // M3
  r_transit: { id: "r_transit", name: "DSG ⇒ transitiv", sub: "auf Strahlen" },
  r_orth: { id: "r_orth", name: "orthogonal ⇒ Norm erhalten", sub: "Skalierungsfaktor ablesen" },
  r_widerspruch: { id: "r_widerspruch", name: "Widerspruch ziehen", sub: "√2 rational ↯ √2∉ℚ" },
  r_normNaiv: { id: "r_normNaiv", name: "naiv quadrieren", sub: "‖(1,1)‖=2 — Fehler" },
  r_detNaiv: { id: "r_detNaiv", name: "Determinante betrachten", sub: "det=±1 — irrelevant" },
};

// --- Missionen -------------------------------------------------------
// steps: gültige Inferenzen  { rule, premises:[factId...], produces }
// depths: Tiefenstufen (leicht → schwer), jede mit ihrer given-Menge
// pool.facts/pool.rules: was in dieser Mission auf dem Tisch liegt
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
      facts: ["n_e", "n_e2", "n_eq1", "n_eq2", "n_goal", "n_idem"],
      rules: ["r_useE2", "r_useE", "r_trans", "r_kommut", "r_idem"],
    },
    steps: [
      { rule: "r_useE2", premises: ["n_e2"], produces: "n_eq1" },
      { rule: "r_useE", premises: ["n_e"], produces: "n_eq2" },
      { rule: "r_trans", premises: ["n_eq1", "n_eq2"], produces: "n_goal" },
      // Distraktor-Schritt: gültig, aber abseits
      { rule: "r_idem", premises: ["n_e"], produces: "n_idem" },
    ],
    depths: [
      { label: "Standard", given: ["n_e", "n_e2"] },
    ],
  },

  {
    id: "p_fixpunkt",
    title: "Ü5.2 — Fixpunkt einer Ähnlichkeit",
    ref: "Übung 5.2 (Folgerung)",
    kind: "beweis",
    claim:
      "Eine Ähnlichkeit von ℂ, die keine Kongruenz ist (und orientierungstreu), hat genau einen Fixpunkt z = b/(1−a).",
    goal: "s_goal",
    pool: {
      facts: ["s_sim", "s_orient", "s_notcong", "s_hol", "s_anti", "s_absne1", "s_ane1", "s_fixeq", "s_1ma", "s_goal"],
      rules: ["r_orient", "r_antiR", "r_kongkrit", "r_absa", "r_fixansatz", "r_1ma", "r_solve"],
    },
    steps: [
      { rule: "r_orient", premises: ["s_sim", "s_orient"], produces: "s_hol" },
      { rule: "r_kongkrit", premises: ["s_sim", "s_notcong"], produces: "s_absne1" },
      { rule: "r_absa", premises: ["s_absne1"], produces: "s_ane1" },
      { rule: "r_fixansatz", premises: ["s_hol"], produces: "s_fixeq" },
      { rule: "r_1ma", premises: ["s_ane1"], produces: "s_1ma" },
      { rule: "r_solve", premises: ["s_fixeq", "s_1ma"], produces: "s_goal" },
      // Distraktor-Schritt: verführerisch, aber falscher Zweig
      { rule: "r_antiR", premises: ["s_sim"], produces: "s_anti" },
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
      "Die orthogonale Gruppe von ℚ² mit Standardskalarprodukt ist keine Drehspiegelgruppe: kein Element führt den Strahl ℚ≥0(1,0) in ℚ≥0(1,1) über, da √2 ∉ ℚ. (Widerspruchsbeweis)",
    goal: "c_goal",
    pool: {
      facts: ["c_annahme", "c_sqrt2", "c_norm10", "c_norm11", "c_exists", "c_factor", "c_norm11w", "c_det", "c_goal"],
      rules: ["r_transit", "r_orth", "r_widerspruch", "r_normNaiv", "r_detNaiv"],
    },
    steps: [
      { rule: "r_transit", premises: ["c_annahme"], produces: "c_exists" },
      { rule: "r_orth", premises: ["c_exists", "c_norm10", "c_norm11"], produces: "c_factor" },
      { rule: "r_widerspruch", premises: ["c_factor", "c_sqrt2"], produces: "c_goal" },
      // Distraktor-Schritte
      { rule: "r_normNaiv", premises: ["c_norm11"], produces: "c_norm11w" },
      { rule: "r_detNaiv", premises: ["c_exists"], produces: "c_det" },
    ],
    depths: [
      { label: "Mit Existenz", given: ["c_annahme", "c_sqrt2", "c_norm10", "c_norm11", "c_exists"] },
      { label: "Standard", given: ["c_annahme", "c_sqrt2", "c_norm10", "c_norm11"] },
    ],
  },
];
