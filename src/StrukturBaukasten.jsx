import React, { useState, useRef, useEffect, useMemo } from "react";
import { RotateCcw, Check, ChevronDown, Hammer } from "lucide-react";

/* ------------------------------------------------------------------ *
 *  Struktur-Baukasten – Elementargeometrie
 *  Bausteine zusammenziehen, bis sie einrasten und eine Zielstruktur
 *  bilden. Rezepte folgen den Konstruktionen der Übungsblätter.
 * ------------------------------------------------------------------ */

// --- Farbwelt --------------------------------------------------------
const C = {
  paper: "#EAEEF2",
  dot: "#C4D0DB",
  ink: "#1B2430",
  objekt: "#31597F", // Träger / Grundobjekte  (Blau)
  objektHi: "#4E7BA6",
  anford: "#B26A1E", // Zutaten / Axiome        (Ocker)
  anfordHi: "#D08A38",
  ergeb: "#1F7A63", // Zielstrukturen          (Petrol)
  ergebHi: "#2FA588",
  verkn: "#6B4E9E", // Verknüpfungen & Axiome  (Violett)
  verknHi: "#8A6BC0",
};

const ROLE = {
  objekt: { label: "Träger", fill: C.objekt, hi: C.objektHi },
  anforderung: { label: "Zutat", fill: C.anford, hi: C.anfordHi },
  verknuepfung: { label: "Verknüpfung", fill: C.verkn, hi: C.verknHi },
  ergebnis: { label: "Struktur", fill: C.ergeb, hi: C.ergebHi },
};

// --- Bausteine -------------------------------------------------------
const BLOCKS = {
  // Grundmengen (Rohmaterial — noch keine Struktur)
  rset: { id: "rset", role: "objekt", name: "ℝ", sub: "reelle Zahlen (Menge)" },
  qset: { id: "qset", role: "objekt", name: "ℚ", sub: "rationale Zahlen (Menge)" },

  // Mengen-Konstruktion (verknüpft zwei Mengen/Räume zu einer neuen)
  crossSet: { id: "crossSet", role: "anforderung", name: "×", sub: "kartesisches Produkt zweier Mengen" },
  crossVec: { id: "crossVec", role: "anforderung", name: "⊕", sub: "direktes Produkt zweier Vektorräume" },
  vecstruct: { id: "vecstruct", role: "anforderung", name: "+ , ·", sub: "Vektorraumstruktur (komp.-weise)" },

  // Innere Verknüpfungen (Operationen ∘ : M×M → M)
  opAdd: { id: "opAdd", role: "verknuepfung", name: "+", sub: "Addition, M×M→M" },
  opMul: { id: "opMul", role: "verknuepfung", name: "·", sub: "Multiplikation, M×M→M" },

  // Axiome für Verknüpfungen
  assoc: { id: "assoc", role: "verknuepfung", name: "assoziativ", sub: "(a∘b)∘c = a∘(b∘c)" },
  neutral: { id: "neutral", role: "verknuepfung", name: "0, 1", sub: "Neutralelemente" },
  inverse: { id: "inverse", role: "verknuepfung", name: "a⁻¹, −a", sub: "inverse Elemente" },
  kommut: { id: "kommut", role: "verknuepfung", name: "kommutativ", sub: "a∘b = b∘a" },
  distrib: { id: "distrib", role: "verknuepfung", name: "distributiv", sub: "a·(b+c) = a·b + a·c" },

  // Vektorraum-Struktur
  abeladd: { id: "abeladd", role: "anforderung", name: "(V,+)", sub: "abelsche Gruppe (Addition)" },
  skalarmult: { id: "skalarmult", role: "anforderung", name: "• : K×V→V", sub: "Skalarmultiplikation über K" },

  // Zutaten (elementare Zusatzdaten / Anforderungen)
  dim2: { id: "dim2", role: "anforderung", name: "dim = 2", sub: "Dimension zwei" },
  dim3: { id: "dim3", role: "anforderung", name: "dim = 3", sub: "Dimension drei" },
  bilin: { id: "bilin", role: "anforderung", name: "β: V×V→ℝ", sub: "Bilinearform" },
  symm: { id: "symm", role: "anforderung", name: "β(v,w)=β(w,v)", sub: "symmetrisch" },
  posdef: { id: "posdef", role: "anforderung", name: "β(v,v)>0", sub: "positiv definit, v≠0" },
  cmult: { id: "cmult", role: "anforderung", name: "i² = −1", sub: "komplexe Multiplikation" },
  kongGrp: { id: "kongGrp", role: "anforderung", name: "z↦az+b, z↦az̄+b", sub: "Kongruenzen, |a|=1" },

  // Zutaten (wie bisher)
  autoC: { id: "autoC", role: "anforderung", name: "w↦zw, w↦zw̄", sub: "Automorphismen, |z|=1" },
  invskp: { id: "invskp", role: "anforderung", name: "⟨v,w⟩=Re(vw̄)", sub: "invariantes Skalarprodukt" },
  fahne: { id: "fahne", role: "anforderung", name: "(A,H)", sub: "Halbraumfahnen" },
  eindeutig: { id: "eindeutig", role: "anforderung", name: "∃! r", sub: "eindeutige Überführung" },
  teilraum: { id: "teilraum", role: "anforderung", name: "Z ⊂ E", sub: "zweidim. Teilraum" },
  aehnl: { id: "aehnl", role: "anforderung", name: "z↦az+b, z↦az̄+b", sub: "a ≠ 0" },
  affger: { id: "affger", role: "anforderung", name: "G ⊂ P(E)", sub: "affine Geraden" },
  zwrel: { id: "zwrel", role: "anforderung", name: "Zwischenrel. Z", sub: "R≥0(x−y)∩R≥0(z−y)={0}" },
  spieg: { id: "spieg", role: "anforderung", name: "Spiegelungen", sub: "an Geraden von E" },
  unendl: { id: "unendl", role: "anforderung", name: "∞", sub: "ein weiterer Punkt" },
  vkreise: { id: "vkreise", role: "anforderung", name: "verallg. Kreise", sub: "↦ verallg. Kreise (Inversion)" },
  fixinf: { id: "fixinf", role: "anforderung", name: "φ(∞) = ∞", sub: "Möbiustrans. hält ∞ fest" },
  endlich: { id: "endlich", role: "anforderung", name: "|G| < ∞", sub: "endliche Untergruppe" },
  bahnnorm: { id: "bahnnorm", role: "anforderung", name: "‖v‖ := D-Bahn", sub: "Länge als Bahn von v" },
  altern: { id: "altern", role: "anforderung", name: "ω(v,v) = 0", sub: "alternierende Bilinearform" },
  kreis: { id: "kreis", role: "anforderung", name: "K(c; r)", sub: "Kreis um c mit Radius r" },
  inversion: { id: "inversion", role: "anforderung", name: "z ↦ c + r²/(z̄−c̄)", sub: "Inversionsformel" },
  projpunkte: { id: "projpunkte", role: "anforderung", name: "⟨v⟩, v ≠ 0", sub: "eindim. Teilräume als Punkte" },
  imgt0: { id: "imgt0", role: "anforderung", name: "Im(z) > 0", sub: "obere Halbebene" },
  sl2r: { id: "sl2r", role: "anforderung", name: "SL(2; ℝ)", sub: "z ↦ (az+b)/(cz+d), ad−bc=1" },

  // --- Elementarteile für die Definitions-Bauschemata (A + B) ---------
  rgeq0: { id: "rgeq0", role: "objekt", name: "ℝ≥0", sub: "nichtnegative reelle Zahlen" },
  setE: { id: "setE", role: "objekt", name: "E", sub: "Punktmenge (Träger)" },
  points: { id: "points", role: "objekt", name: "Punkte", sub: "Grundobjekte P" },
  lines: { id: "lines", role: "objekt", name: "Geraden", sub: "Teilmengen G ⊂ P" },
  vecnz: { id: "vecnz", role: "anforderung", name: "v ≠ 0", sub: "ein Vektor ungleich 0" },
  simplytrans: { id: "simplytrans", role: "anforderung", name: "einf. transitiv", sub: "Operation von (E⃗,+) durch Translationen" },
  translation: { id: "translation", role: "verknuepfung", name: "+ : E⃗×E→E", sub: "Translationen" },
  glv: { id: "glv", role: "anforderung", name: "GL(V)", sub: "invertierbare lineare Abbildungen" },
  subgroupGL: { id: "subgroupGL", role: "anforderung", name: "D ⊂ GL", sub: "Untergruppe" },
  sinvariance: { id: "sinvariance", role: "anforderung", name: "s(gv,gw)=s(v,w)", sub: "s-erhaltend" },
  det1: { id: "det1", role: "anforderung", name: "det = 1", sub: "orientierungserhaltend" },
  bijektion: { id: "bijektion", role: "anforderung", name: "φ bijektiv", sub: "umkehrbare Abbildung" },
  linpart: { id: "linpart", role: "anforderung", name: "φ⃗ invertierbar", sub: "linearer Anteil, φ(p+v)=φ(p)+φ⃗(v)" },
  halfplane: { id: "halfplane", role: "anforderung", name: "H = ℝv+ℝ≥0w", sub: "Halbebene" },
  linunabh: { id: "linunabh", role: "anforderung", name: "v, w lin. unabh.", sub: "linear unabhängig" },
  genauzwei: { id: "genauzwei", role: "anforderung", name: "genau zwei d", sub: "zu je zwei Strahlen A,B: d(A)=B" },
  incax: { id: "incax", role: "anforderung", name: "2 Punkte ⇒ 1 Gerade", sub: "Inzidenzaxiom" },
  linege2: { id: "linege2", role: "anforderung", name: "|G| ≥ 2", sub: "jede Gerade hat ≥ 2 Punkte" },
  orderax: { id: "orderax", role: "anforderung", name: "Anordnungsaxiome", sub: "Zwischen-Relation" },
  pasch: { id: "pasch", role: "anforderung", name: "Pasch-Axiom", sub: "Gerade trifft Dreiecksseite" },
  parax: { id: "parax", role: "anforderung", name: "genau eine Parallele", sub: "Parallelenaxiom (Playfair)" },
  supremum: { id: "supremum", role: "anforderung", name: "Supremumseigenschaft", sub: "Vollständigkeit" },
  threepts: { id: "threepts", role: "anforderung", name: "A, B, C", sub: "drei Punkte (Dreieck)" },
  angeordKong: { id: "angeordKong", role: "anforderung", name: "A↦A′,B↦B′,C↦C′", sub: "angeordnete Kongruenz" },
  kollinear: { id: "kollinear", role: "anforderung", name: "kollinear", sub: "auf einer Geraden" },
  vgkreis: { id: "vgkreis", role: "anforderung", name: "verallg. Kreis", sub: "Kreis oder erweiterte Gerade" },
  normb: { id: "normb", role: "anforderung", name: "‖·‖", sub: "Norm aus dem Skalarprodukt" },
};

// --- Zielstrukturen (Ergebnisse) ------------------------------------
const RESULTS = {
  // Algebra-Schicht: Menge + Addition (assoziativ, neutral, invers, kommutativ) → abelsche Gruppe
  addgrpR: {
    id: "addgrpR", role: "objekt", name: "(ℝ, +)", sub: "abelsche Gruppe",
    ref: "Grundlagen (Algebra)",
    note: "ℝ mit der Addition als assoziative, kommutative Verknüpfung mit 0 und additiven Inversen.",
    chainable: true,
  },
  addgrpQ: {
    id: "addgrpQ", role: "objekt", name: "(ℚ, +)", sub: "abelsche Gruppe",
    ref: "Grundlagen (Algebra)",
    note: "ℚ mit der Addition als abelsche Gruppe.",
    chainable: true,
  },
  fieldR: {
    id: "fieldR", role: "objekt", name: "ℝ (Körper)", sub: "Skalarkörper",
    ref: "Grundlagen (Algebra)",
    note: "Die additive Gruppe (ℝ,+) mit einer zweiten Verknüpfung · (assoziativ, 1, Inverse) und Distributivgesetz. Zusätzlich quadratwurzel-abgeschlossen: √q ∈ ℝ für q > 0.",
    chainable: true,
  },
  fieldQ: {
    id: "fieldQ", role: "objekt", name: "ℚ (Körper)", sub: "Skalarkörper",
    ref: "Grundlagen (Algebra)",
    note: "(ℚ,+) mit Multiplikation und Distributivgesetz — alle Körperaxiome erfüllt, aber NICHT quadratwurzel-abgeschlossen (√2 ∉ ℚ). Daran scheitert Ü2.1.",
    chainable: true,
  },
  vr: {
    id: "vr", role: "objekt", name: "V", sub: "reeller Vektorraum",
    ref: "Grundlagen (LA)",
    note: "Eine abelsche Gruppe (V,+) mit Skalarmultiplikation • : ℝ×V→V über dem Körper ℝ. Das 'reell' meint genau diesen Skalarkörper.",
    chainable: true,
  },
  vrQ: {
    id: "vrQ", role: "objekt", name: "V_ℚ", sub: "ℚ-Vektorraum",
    ref: "Übung 2.1",
    note: "Derselbe Aufbau über dem Körper ℚ statt ℝ — die Skalare sind jetzt rational.",
    chainable: true,
  },
  vrQ2: {
    id: "vrQ2", role: "objekt", name: "ℚ²", sub: "zweidim. ℚ-Vektorraum",
    ref: "Übung 2.1",
    note: "Der Standard-ℚ-Vektorraum der Dimension 2, mit rationalem Standardskalarprodukt.",
    chainable: true,
  },
  nodsgQ: {
    id: "nodsgQ", role: "ergebnis", name: "O(ℚ²) ✗", sub: "KEINE Drehspiegelgruppe",
    ref: "Übung 2.1",
    note: "Über ℚ fehlt die Quadratwurzel-Abgeschlossenheit — die orthogonale Gruppe wirkt nicht mehr transitiv genug auf Strahlen.",
    claim: "Die orthogonale Gruppe von ℚ² mit Standardskalarprodukt ist KEINE Drehspiegelgruppe: kein Element führt den Strahl ℚ≥0(1,0) in ℚ≥0(1,1) über, da √2 ∉ ℚ.",
    chainable: false,
  },

  // konstruierbare Grundstrukturen (Zwischenstufen)
  r2set: {
    id: "r2set", role: "objekt", name: "ℝ×ℝ", sub: "Menge der Zahlenpaare",
    ref: "Grundlagen (Mengen)",
    note: "Das kartesische Produkt ℝ×ℝ = {(x,y) | x,y ∈ ℝ} — zwei Kopien von ℝ, per × verknüpft, noch ohne Rechenstruktur.",
    chainable: true,
  },
  r2vec: {
    id: "r2vec", role: "objekt", name: "ℝ²", sub: "Vektorraum",
    ref: "Grundlagen (LA)",
    note: "Die Paarmenge ℝ×ℝ mit komponentenweiser Addition und Skalarmultiplikation wird zum reellen Vektorraum ℝ².",
    chainable: true,
  },
  r3vec: {
    id: "r3vec", role: "objekt", name: "ℝ³", sub: "Vektorraum",
    ref: "Grundlagen (LA)",
    note: "Das direkte Produkt ℝ² ⊕ ℝ: komponentenweise Struktur liefert den dreidim. Vektorraum ℝ³.",
    chainable: true,
  },
  vr2: {
    id: "vr2", role: "objekt", name: "Z", sub: "zweidim. reeller Vektorraum",
    ref: "Grundlagen (LA)",
    note: "Ein abstrakter reeller Vektorraum mit dim 2 — isomorph zu ℝ², aber ohne ausgezeichnete Basis oder Standardskalarprodukt. Genau deshalb existieren Ü1.4 und die Längengerade.",
    chainable: true,
  },
  vr3: {
    id: "vr3", role: "objekt", name: "E", sub: "dreidim. reeller Vektorraum",
    ref: "Grundlagen (LA)",
    note: "Ein reeller Vektorraum mit Dimension drei — Bühne für Halbraumfahnen und Rotationsgruppen.",
    chainable: true,
  },
  skp: {
    id: "skp", role: "anforderung", name: "s", sub: "Skalarprodukt",
    ref: "Grundlagen (LA)",
    note: "Eine symmetrische, positiv definite Bilinearform — das ist die Definition eines Skalarprodukts.",
    chainable: true,
  },
  cvr: {
    id: "cvr", role: "objekt", name: "ℂ", sub: "als ℝ-Vektorraum",
    ref: "Grundlagen (LA)",
    note: "ℝ² mit der Multiplikation i² = −1 wird zum Körper ℂ, hier aufgefasst als ℝ-Vektorraum.",
    chainable: true,
  },
  kong: {
    id: "kong", role: "objekt", name: "(E,K)", sub: "Kongruenzebene",
    ref: "Übung 5.2",
    note: "ℂ wird eine Kongruenzebene mit den Kongruenzen z↦az+b bzw. z↦az̄+b, |a|=1.",
    chainable: true,
  },

  dsgO: {
    id: "dsgO", role: "ergebnis", name: "O(Z,s)", sub: "Drehspiegelgruppe",
    ref: "Übung 0.1 (Anwesenheit)",
    note: "Die orthogonale Gruppe eines zweidim. reellen Skalarproduktraums ist eine Drehspiegelgruppe.",
    claim: "O(Z,s) := {g ∈ GL(Z) | s(gv,gw) = s(v,w) ∀v,w ∈ Z} ist eine Drehspiegelgruppe.",
    chainable: true,
  },
  dsgC: {
    id: "dsgC", role: "ergebnis", name: "D ⊂ GLℝ(ℂ)", sub: "Drehspiegelgruppe auf ℂ",
    ref: "Übung 1.1",
    note: "Die z·- und z·∘Konjugation-Automorphismen mit |z|=1 bilden eine Drehspiegelgruppe; Re(vw̄) ist invariant.",
    claim: "D ist eine Drehspiegelgruppe, und ⟨v,w⟩ = Re(vw̄) ist ein D-invariantes Skalarprodukt auf ℂ.",
    chainable: false,
  },
  rot: {
    id: "rot", role: "ergebnis", name: "R ⊂ GL(E)", sub: "Rotationsgruppe",
    ref: "Übung 2.2 (1)",
    note: "Wirkt einfach transitiv auf Halbraumfahnen — später identifiziert als SO(E,s). Nutzbar als Baustein.",
    claim: "SO(3;ℝ) ist eine Rotationsgruppe auf ℝ³: zu je zwei Halbraumfahnen gibt es genau ein überführendes Element.",
    chainable: true,
  },
  dsgZ: {
    id: "dsgZ", role: "ergebnis", name: "D_Z", sub: "Drehspiegelgruppe auf Z",
    ref: "Übung 2.2 (4)",
    note: "Einschränkung R_Z → GL(Z) ist injektiv; das Bild ist eine Drehspiegelgruppe auf der Ebene Z.",
    claim: "Die Einschränkung R_Z → GL(Z) ist ein injektiver Gruppenhomomorphismus und ihr Bild ist eine Drehspiegelgruppe D_Z auf Z.",
    chainable: false,
  },
  aehnlG: {
    id: "aehnlG", role: "ergebnis", name: "Aut(ℂ)", sub: "Ähnlichkeitsgruppe",
    ref: "Übung 5.2",
    note: "Genau die Abbildungen z↦az+b bzw. z↦az̄+b mit a≠0 — die Nicht-Kongruenzen haben genau einen Fixpunkt.",
    claim: "Die Ähnlichkeiten von ℂ sind genau die Abbildungen z↦az+b bzw. z↦az̄+b mit a≠0. Folgerung: Ähnlichkeiten, die keine Kongruenzen sind, haben genau einen Fixpunkt.",
    chainable: false,
  },
  fasteukl: {
    id: "fasteukl", role: "ergebnis", name: "fasteukl. Geom.", sub: "mit Parallelenaxiom",
    ref: "Übung 5.4",
    note: "Affine Geraden + diese Zwischenrelation liefern eine fasteuklidische Geometrie, die Playfairs Parallelenaxiom erfüllt.",
    claim: "Mit den affinen Geraden als Geraden und dieser Zwischenrelation wird (E,K) eine fasteuklidische Geometrie mit Parallelenaxiom.",
    chainable: false,
  },
  dreispieg: {
    id: "dreispieg", role: "ergebnis", name: "Kongruenzgruppe K", sub: "erzeugt von Spiegelungen",
    ref: "Übung 5.3",
    note: "Objekt: die von Spiegelungen erzeugte Kongruenzgruppe der euklidischen Ebene. Aussage darüber ist der Dreispiegelungssatz.",
    claim: "Dreispiegelungssatz: Jedes Element der Kongruenzgruppe einer euklidischen Ebene lässt sich als Verknüpfung von einer, zwei oder drei Spiegelungen darstellen.",
    chainable: false,
  },
  ebeneHat: {
    id: "ebeneHat", role: "objekt", name: "Ê", sub: "Ebene + ∞",
    ref: "Übung 6.2 / 7.1",
    note: "Die euklidische Ebene um einen Punkt ∞ erweitert: Ê = E ⊔ {∞}. Träger der Möbiusgeometrie.",
    chainable: true,
  },
  moeb: {
    id: "moeb", role: "ergebnis", name: "Möb(Ê)", sub: "Möbiustransformationen",
    ref: "Übung 7.1",
    note: "Bijektionen von Ê, die verallgemeinerte Kreise auf verallgemeinerte Kreise abbilden.",
    claim: "Die Möbiustransformationen von Ê sind die Bijektionen, die verallgemeinerte Kreise auf verallgemeinerte Kreise abbilden.",
    chainable: true,
  },
  moebInf: {
    id: "moebInf", role: "ergebnis", name: "Möb∞(Ê)", sub: "halten ∞ fest",
    ref: "Übung 7.1",
    note: "Fixiert man ∞, so bleibt genau die Ähnlichkeitsstruktur von E übrig.",
    claim: "Die Möbiustransformationen von Ê, die ∞ festhalten, sind genau die Fortsetzungen durch ∞↦∞ von Ähnlichkeiten von E.",
    chainable: false,
  },
  endlUG: {
    id: "endlUG", role: "ergebnis", name: "µₙ, µₙ ⋊ ℤ/2ℤ", sub: "endliche Untergruppen von O(2)",
    ref: "Übung 1.3",
    note: "In SO(2) sind es genau die Einheitswurzelgruppen µₙ; mit einer Spiegelung entstehen Diedergruppen.",
    claim: "Die endlichen Untergruppen von O(2) sind genau die zyklischen Gruppen µₙ und die Diedergruppen µₙ ⋊ ℤ/2ℤ (n ≥ 1).",
    chainable: false,
  },
  laenge: {
    id: "laenge", role: "ergebnis", name: "L_Z", sub: "Längengerade",
    ref: "Übung 3.1",
    note: "Die Länge eines Vektors als D-Bahn: Werte liegen in einer eindimensionalen 'Geraden' L_Z.",
    claim: "Zu jedem drehspiegelverträglichen Isomorphismus ψ: (Z,D) → (Y,C) gibt es genau eine lineare Abbildung Lψ: L_Z → L_Y mit ‖ψv‖_Y = Lψ(‖v‖_Z), und dann gilt ⟨ψv,ψw⟩_Y = L⊗²ψ(⟨v,w⟩_Z).",
    chainable: false,
  },
  flaeche: {
    id: "flaeche", role: "ergebnis", name: "F ∈ Alt²(Z)", sub: "orientierter Flächeninhalt",
    ref: "Übung 4.4 / Woche 11.5",
    note: "Alt²(Z) ist eindimensional für dim Z = 2; eine Wahl von F misst orientierte Fläche.",
    claim: "sin(α)·bc = ±F(B−A, C−A) für jedes Dreieck einer Kongruenzebene, mit dem orientierten Flächeninhalt F rechts.",
    chainable: false,
  },
  kreisspieg: {
    id: "kreisspieg", role: "ergebnis", name: "s_K", sub: "Kreisspiegelung",
    ref: "Übung 6.1 / 6.3",
    note: "Inversion am Kreis K(c;r): Punkte innen und außen tauschen, der Kreis bleibt punktweise fest.",
    claim: "Die Schattenabbildung S: S¹\\{p} → H (Lampe bei p = (0,1), Gerade y = −1) ist die Einschränkung einer Kreisspiegelung.",
    chainable: false,
  },
  projEbene: {
    id: "projEbene", role: "ergebnis", name: "P(V)", sub: "projektive Ebene",
    ref: "Übung 8.1 / 9.2",
    note: "Punkte sind die eindimensionalen Teilräume von V. Für V = F₂³ entsteht die Fano-Ebene: 7 Punkte, 7 Geraden.",
    claim: "Jede affine Einbettung a: E ↪ V als ursprungsvermeidende Hyperebene liefert eine Kollineation â: VE ≅ PV (projektive Vervollständigung als Projektivisierung).",
    chainable: false,
  },
  halbebene: {
    id: "halbebene", role: "objekt", name: "H", sub: "obere Halbebene",
    ref: "Blatt 10",
    note: "H = {z ∈ ℂ | Im(z) > 0} — die Bühne der hyperbolischen Geometrie.",
    chainable: true,
  },
  hypEbene: {
    id: "hypEbene", role: "ergebnis", name: "(H, SL₂)", sub: "hyperbolische Ebene",
    ref: "Blatt 10 (10.1–10.4)",
    note: "SL(2;ℝ) operiert auf H durch z ↦ (az+b)/(cz+d) als Kongruenzgruppe — darauf spielen die Rechnungen von Blatt 10.",
    chainable: false,
  },

  // === Definitions-Bauschemata (A — direkt aus Elementarteilen) =======
  strahl: { id: "strahl", role: "objekt", name: "A = ℝ≥0·v", sub: "Strahl", ref: "Def 9", note: "Die Halbgerade ℝ≥0·v zu einem Vektor v ≠ 0.", chainable: true },
  affraum: { id: "affraum", role: "objekt", name: "(E, E⃗)", sub: "affiner Raum", ref: "Def 5", note: "Punktmenge E mit Richtungsraum E⃗ (Vektorraum), der einfach transitiv durch Translationen operiert.", chainable: true },
  affEbene: { id: "affEbene", role: "objekt", name: "affine Ebene", sub: "dim E⃗ = 2", ref: "Def 5/6", note: "Ein affiner Raum, dessen Richtungsraum zweidimensional ist.", chainable: true },
  inzgeo: { id: "inzgeo", role: "ergebnis", name: "Inzidenzgeometrie", sub: "Punkte & Geraden", ref: "Def 22", note: "Durch je zwei verschiedene Punkte genau eine Gerade; jede Gerade hat ≥ 2 Punkte.", chainable: true },
  zwax: { id: "zwax", role: "ergebnis", name: "Zwischenrelation", sub: "axiomatisch", ref: "Def 23", note: "Anordnungsaxiome inklusive Pasch-Axiom.", chainable: true },
  parallelax: { id: "parallelax", role: "ergebnis", name: "Parallelenaxiom", sub: "Playfair", ref: "Def 25", note: "Zu g und p ∉ g genau eine Parallele durch p.", chainable: false },
  erwEbene: { id: "erwEbene", role: "objekt", name: "Ê = E ⊔ {∞}", sub: "erweiterte Ebene", ref: "Def 26", note: "Die Ebene um einen Punkt ∞ erweitert; Träger der Möbiusgeometrie. Verallgemeinerter Kreis: echter Kreis oder erweiterte Gerade.", chainable: true },

  // === Definitions-Bauschemata (B — Ketten, Unterdefinitionen elementar) ===
  ogroup: { id: "ogroup", role: "ergebnis", name: "O(Z,s)", sub: "orthogonale Gruppe", ref: "Def 2", note: "Die s-erhaltenden Elemente von GL(Z): {g | s(gv,gw)=s(v,w)}.", chainable: true },
  sogroup: { id: "sogroup", role: "ergebnis", name: "SO(Z,s)", sub: "Drehgruppe (det=1)", ref: "Def 3", note: "Die orthogonalen Elemente mit Determinante 1 — die Drehungen.", chainable: true },
  dsgAbstr: { id: "dsgAbstr", role: "ergebnis", name: "(Z, D)", sub: "Drehspiegelgruppe", ref: "Def 10", note: "D ⊂ GL(Z), dim Z = 2, sodass es zu je zwei Strahlen A, B genau zwei d ∈ D mit d(A)=B gibt.", chainable: true },
  affgerade: { id: "affgerade", role: "objekt", name: "p + ℝv", sub: "affine Gerade", ref: "Def 6", note: "Gerade im affinen Raum; parallel ⇔ gleicher Richtungsraum.", chainable: true },
  affinitaet: { id: "affinitaet", role: "ergebnis", name: "Affinität φ", sub: "φ(p+v)=φ(p)+φ⃗(v)", ref: "Def 7", note: "Bijektion eines affinen Raums mit invertierbarem linearem Anteil φ⃗.", chainable: false },
  halbfahne: { id: "halbfahne", role: "objekt", name: "(A, H)", sub: "Halbraumfahne", ref: "Def 15", note: "Strahl A in einer Halbebene H eines dreidim. Raums, v, w linear unabhängig.", chainable: true },
  rotgroup: { id: "rotgroup", role: "ergebnis", name: "R ⊂ GL(E)", sub: "Rotationsgruppe", ref: "Def 16", note: "Zu je zwei Halbraumfahnen genau ein überführendes r ∈ R (= SO(E,s)).", chainable: true },
  kongEbene: { id: "kongEbene", role: "objekt", name: "(E, K)", sub: "Kongruenzebene", ref: "Def 17", note: "Affine Ebene mit Gruppe K, die alle Translationen enthält und deren lineare Anteile eine Drehspiegelgruppe bilden.", chainable: true },
  euklEbene: { id: "euklEbene", role: "ergebnis", name: "euklid. Ebene", sub: "Kongruenzen = Isometrien", ref: "Def 18", note: "Kongruenzebene zu einem Skalarprodukt; die Kongruenzen sind die Isometrien.", chainable: false },
  aehnlichkeit: { id: "aehnlichkeit", role: "ergebnis", name: "Ähnlichkeit", sub: "Selbst-Iso, a≠0", ref: "Def 19", note: "Isomorphismus einer Kongruenzebene mit sich; keine Kongruenz ⇒ genau ein Fixpunkt.", chainable: false },
  dreieck: { id: "dreieck", role: "ergebnis", name: "(A,B,C)", sub: "angeordnetes Dreieck", ref: "Def 20", note: "Drei Punkte mit angeordneter Kongruenz A↦A′, B↦B′, C↦C′.", chainable: false },
  streckeZw: { id: "streckeZw", role: "ergebnis", name: "[p,q], Zw", sub: "Strecke & Zwischenrelation", ref: "Def 21", note: "Kollineare Tripel (x,y,z) mit ℝ≥0(x−y) ∩ ℝ≥0(z−y) = {0}.", chainable: false },
  fasteuklGeo: { id: "fasteuklGeo", role: "ergebnis", name: "fasteukl. Geom.", sub: "volle Axiomatik", ref: "Def 24", note: "Inzidenzgeometrie + Zwischenrelation + Kongruenzen + Supremumseigenschaft.", chainable: false },
  kreisInv: { id: "kreisInv", role: "ergebnis", name: "s_L", sub: "Kreisspiegelung", ref: "Def 27", note: "Inversion am verallgemeinerten Kreis: x ↦ c + r²(x−c)/‖x−c‖², c ↔ ∞.", chainable: true },
  projRaum: { id: "projRaum", role: "ergebnis", name: "P(V)", sub: "projektiver Raum", ref: "Def 29", note: "Punkte = eindimensionale Teilräume von V; Vervollständigung E ⊔ P(E⃗), Kollineationen = geradentreue Bijektionen.", chainable: false },
};

// --- Kurzbeschreibungen: nach dem Bauen in einem Satz, was das Objekt ist ---
const KURZ = {
  // A — direkt
  strahl: "Ein Strahl ist die Halbgerade ℝ≥0·v — von einem Punkt aus in Richtung eines Vektors v ≠ 0.",
  affraum: "Ein affiner Raum ist eine Punktmenge mit einem Vektorraum als Richtungsraum, der einfach transitiv durch Translationen wirkt — Geometrie ohne ausgezeichneten Ursprung.",
  affEbene: "Eine affine Ebene ist ein affiner Raum, dessen Richtungsraum zweidimensional ist.",
  inzgeo: "Eine Inzidenzgeometrie: je zwei Punkte liegen auf genau einer Geraden, und jede Gerade trägt mindestens zwei Punkte.",
  zwax: "Eine Zwischenrelation legt axiomatisch fest, wann ein Punkt zwischen zwei anderen liegt — mit Anordnungs- und Pasch-Axiom.",
  parallelax: "Das Parallelenaxiom: zu einer Geraden g und einem Punkt p ∉ g gibt es genau eine Parallele durch p.",
  erwEbene: "Die erweiterte Ebene Ê ist die Ebene mit einem zusätzlichen Fernpunkt ∞ — die Bühne der Möbiusgeometrie.",
  // B — Ketten
  ogroup: "Die orthogonale Gruppe O(Z,s) sind alle linearen Abbildungen, die das Skalarprodukt s erhalten.",
  sogroup: "Die spezielle orthogonale Gruppe SO(Z,s) sind die orthogonalen Abbildungen mit Determinante 1 — die reinen Drehungen.",
  dsgAbstr: "Eine Drehspiegelgruppe ist eine Untergruppe von GL(Z) einer Ebene, die je zwei Strahlen durch genau zwei ihrer Elemente ineinander überführt.",
  affgerade: "Eine affine Gerade ist die Punktmenge p + ℝv; zwei sind parallel, wenn sie denselben Richtungsraum haben.",
  affinitaet: "Eine Affinität ist eine Bijektion eines affinen Raums mit invertierbarem linearem Anteil: φ(p+v) = φ(p) + φ⃗(v).",
  halbfahne: "Eine Halbraumfahne (A,H) ist ein Strahl A in einer ihn enthaltenden Halbebene H eines dreidimensionalen Raums.",
  rotgroup: "Eine Rotationsgruppe überführt je zwei Halbraumfahnen durch genau ein Element — im euklidischen Fall ist das SO(E,s).",
  kongEbene: "Eine Kongruenzebene ist eine affine Ebene mit einer Kongruenzgruppe, die alle Translationen enthält und deren lineare Anteile eine Drehspiegelgruppe bilden.",
  euklEbene: "Eine euklidische Ebene ist die Kongruenzebene zu einem Skalarprodukt; ihre Kongruenzen sind genau die abstandserhaltenden Abbildungen.",
  aehnlichkeit: "Eine Ähnlichkeit ist ein Selbst-Isomorphismus einer Kongruenzebene; ist sie keine Kongruenz, hat sie genau einen Fixpunkt.",
  dreieck: "Ein angeordnetes Dreieck ist ein Punktetripel (A,B,C); zwei sind angeordnet kongruent, wenn eine Kongruenz A↦A′, B↦B′, C↦C′ leistet.",
  streckeZw: "Eine Strecke [p,q] ist der Abschnitt zwischen zwei Punkten, festgelegt über die Zwischenrelation kollinearer Tripel.",
  fasteuklGeo: "Eine fasteuklidische Geometrie vereint Inzidenzgeometrie, Zwischenrelation, Kongruenzen und Vollständigkeit (Supremumseigenschaft).",
  kreisInv: "Eine Kreisspiegelung invertiert die Ebene am Kreis: x ↦ c + r²(x−c)/‖x−c‖², wobei Zentrum und ∞ getauscht werden.",
  projRaum: "Der projektive Raum P(V) hat die eindimensionalen Teilräume von V als Punkte; die Vervollständigung ergänzt eine affine Ebene um ihre Ferngerade.",
  // Kern-Grundlagen (häufig in Rotation)
  skp: "Ein Skalarprodukt ist eine symmetrische, positiv definite Bilinearform auf einem reellen Vektorraum.",
  vr: "Ein reeller Vektorraum ist eine abelsche Gruppe (V,+) mit einer Skalarmultiplikation über dem Körper ℝ.",
  addgrpR: "Die additive Gruppe (ℝ,+) ist ℝ mit der assoziativen, kommutativen Addition, 0 als neutralem und additiven Inversen.",
  fieldR: "Der Körper ℝ ist die additive Gruppe (ℝ,+) mit einer zweiten Verknüpfung · und dem Distributivgesetz.",
};

// --- Rezepte (Menge benötigter Bausteine → Ergebnis) ----------------
const RECIPES = [
  // Algebra-Schicht (volle Tiefe): Menge + Addition (assoz., neutral, invers, kommutativ) → abelsche Gruppe
  { need: ["rset", "opAdd", "assoc", "neutral", "inverse", "kommut"], result: "addgrpR" },
  { need: ["qset", "opAdd", "assoc", "neutral", "inverse", "kommut"], result: "addgrpQ" },
  // abelsche Gruppe + zweite Verknüpfung · (assoz., neutral, invers) + Distributivgesetz → Körper
  { need: ["addgrpR", "opMul", "assoc", "neutral", "inverse", "distrib"], result: "fieldR" },
  { need: ["addgrpQ", "opMul", "assoc", "neutral", "inverse", "distrib"], result: "fieldQ" },
  // Vektorraum über einem Körper: (V,+) abelsch + Skalarmultiplikation
  { need: ["fieldR", "abeladd", "skalarmult"], result: "vr" }, // reeller Vektorraum V
  { need: ["fieldQ", "abeladd", "skalarmult"], result: "vrQ" }, // ℚ-Vektorraum
  // ℚ-Schiene (Ü2.1): ℚ² und das Scheitern der Drehspiegelgruppe
  { need: ["vrQ", "dim2"], result: "vrQ2" },
  { need: ["vrQ2", "skp"], result: "nodsgQ" },

  // elementare Konstruktionen
  { need: ["rset", "rset", "crossSet"], result: "r2set" }, // ℝ × ℝ  → Menge der Paare (zwei Faktoren!)
  { need: ["r2set", "vecstruct"], result: "r2vec" }, // Paarmenge + Struktur → ℝ²
  { need: ["vr", "dim2"], result: "vr2" }, // Z abstrakt: Vektorraum + dim 2 (ℝ² ist nur ein Modell davon)
  { need: ["r2vec", "rset", "crossVec"], result: "r3vec" }, // ℝ² ⊕ ℝ → ℝ³
  { need: ["r3vec", "dim3"], result: "vr3" }, // ℝ³ als Träger für E …
  { need: ["vr", "dim3"], result: "vr3" }, // … oder abstrakt über V + dim 3
  { need: ["bilin", "symm", "posdef"], result: "skp" },
  { need: ["r2vec", "cmult"], result: "cvr" }, // ℝ² + i²=−1 → ℂ
  { need: ["cvr", "kongGrp"], result: "kong" }, // Kette: braucht zuerst ℂ

  // Konstruktionen aus den Übungen
  { need: ["vr2", "skp"], result: "dsgO" },
  { need: ["cvr", "autoC", "invskp"], result: "dsgC" },
  { need: ["vr3", "fahne", "eindeutig"], result: "rot" },
  { need: ["rot", "teilraum"], result: "dsgZ" }, // Kette: braucht zuerst rot
  { need: ["kong", "aehnl"], result: "aehnlG" },
  { need: ["kong", "affger", "zwrel"], result: "fasteukl" },
  { need: ["kong", "spieg"], result: "dreispieg" },
  { need: ["kong", "unendl"], result: "ebeneHat" },
  { need: ["ebeneHat", "vkreise"], result: "moeb" },
  { need: ["moeb", "fixinf"], result: "moebInf" },
  { need: ["dsgO", "endlich"], result: "endlUG" },
  { need: ["dsgO", "bahnnorm"], result: "laenge" },
  { need: ["vr2", "altern"], result: "flaeche" },
  { need: ["kong", "kreis", "inversion"], result: "kreisspieg" },
  { need: ["vr3", "projpunkte"], result: "projEbene" },
  { need: ["cvr", "imgt0"], result: "halbebene" },
  { need: ["halbebene", "sl2r"], result: "hypEbene" },

  // === A: Definitionen direkt aus Elementarteilen =====================
  { need: ["rgeq0", "vecnz", "skalarmult"], result: "strahl" },        // Def 9
  { need: ["setE", "vr", "simplytrans"], result: "affraum" },          // Def 5
  { need: ["affraum", "dim2"], result: "affEbene" },                   // Def 5/6
  { need: ["points", "lines", "incax", "linege2"], result: "inzgeo" }, // Def 22
  { need: ["orderax", "pasch"], result: "zwax" },                      // Def 23
  { need: ["inzgeo", "parax"], result: "parallelax" },                 // Def 25
  { need: ["affEbene", "unendl"], result: "erwEbene" },                // Def 26

  // === B: Definitionen als Ketten — jede Unterdefinition elementar gebaut ===
  { need: ["vr2", "skp", "glv", "sinvariance"], result: "ogroup" },        // Def 2  ← skp (Def 1)
  { need: ["ogroup", "det1"], result: "sogroup" },                          // Def 3  ← O(Z,s)
  { need: ["vr2", "strahl", "subgroupGL", "genauzwei"], result: "dsgAbstr" }, // Def 10 ← strahl (Def 9)
  { need: ["affraum", "vecnz"], result: "affgerade" },                      // Def 6  ← affraum (Def 5)
  { need: ["affraum", "bijektion", "linpart"], result: "affinitaet" },      // Def 7  ← affraum
  { need: ["vr3", "strahl", "halfplane", "linunabh"], result: "halbfahne" }, // Def 15 ← strahl
  { need: ["vr3", "halbfahne", "eindeutig"], result: "rotgroup" },          // Def 16 ← halbfahne (Def 15)
  { need: ["affEbene", "translation", "dsgAbstr"], result: "kongEbene" },   // Def 17 ← affEbene(5) + dsgAbstr(10)
  { need: ["kongEbene", "skp"], result: "euklEbene" },                      // Def 18 ← kongEbene(17) + skp(1)
  { need: ["kongEbene", "aehnl"], result: "aehnlichkeit" },                 // Def 19 ← kongEbene
  { need: ["kongEbene", "threepts", "angeordKong"], result: "dreieck" },    // Def 20 ← kongEbene
  { need: ["affraum", "kollinear", "zwrel"], result: "streckeZw" },         // Def 21 ← affraum
  { need: ["inzgeo", "zwax", "kongEbene", "supremum"], result: "fasteuklGeo" }, // Def 24 ← 22 + 23 + 17
  { need: ["erwEbene", "vgkreis", "normb", "inversion"], result: "kreisInv" }, // Def 27 ← erwEbene(26)
  { need: ["vr", "projpunkte"], result: "projRaum" },                       // Def 29 ← vr
];

// Multimengen-Vergleich (Duplikate zählen): sortierte Listen müssen übereinstimmen
const eqSet = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();
// ist a als Multimenge in b enthalten? (jedes Element mindestens so oft in b wie in a)
const isSubset = (small, big) => {
  const count = {};
  for (const x of big) count[x] = (count[x] || 0) + 1;
  for (const x of small) {
    if (!count[x]) return false;
    count[x] -= 1;
  }
  return true;
};

// resolve id -> block (Basisbaustein oder freigeschaltetes, kettbares Ergebnis)
const resolve = (id) => BLOCKS[id] || RESULTS[id];

// benötigte Bausteine für ein Ergebnis
const needForResult = (rid) => RECIPES.find((r) => r.result === rid)?.need || [];

// alle Bausteine, die in die Kette eines Ergebnisses eingehen — Auflösung stoppt bei `stop`-ids
// (die Startbausteine der Mission gelten dort als gegeben und werden nicht weiter zerlegt).
const leafBlocksFor = (rid, stop = new Set(), acc = []) => {
  if (stop.has(rid)) { acc.push(rid); return acc; } // Startbaustein: nicht weiter zerlegen
  const recipe = RECIPES.find((r) => r.result === rid);
  if (!recipe) { acc.push(rid); return acc; } // kein Rezept → Grundbaustein
  for (const need of recipe.need) {
    if (stop.has(need) || BLOCKS[need]) acc.push(need); // Startbaustein oder Vorratsbaustein
    else leafBlocksFor(need, stop, acc); // Zwischenergebnis weiter zerlegen
  }
  return acc;
};

// Zutatenliste einer Mission: Startbausteine (base) + alle ab da nötigen Bausteine bis zum Ziel
const missionIngredients = (mission) => {
  const goal = mission.steps[mission.steps.length - 1];
  const stop = new Set(mission.base || []);
  const leaves = leafBlocksFor(goal, stop);
  return [...new Set([...(mission.base || []), ...leaves])]; // Startbausteine immer mit anzeigen
};

// --- Missionen als Lektionen ---
// base = fertige Bausteine, ab denen die Lektion spielt (angemessene Starttiefe).
// steps = die ab dieser Tiefe noch zu bauenden Zwischen- und Zielstrukturen.
export const MISSIONS = [
  // L0 geht bewusst bis zu den Axiomen — das ist ihr Thema
  { id: "m00", task: "L0 · Grundlagen — Körper & Vektorraum", base: ["rset"], steps: ["addgrpR", "fieldR", "vr"] },
  // Geometrie-Lektionen starten auf Vektorraum-Ebene, nicht bei den Axiomen
  { id: "m01", task: "L1 · Ü0.1 — Drehspiegelgruppe", base: ["vr"], steps: ["vr2", "skp", "dsgO"] },
  { id: "m11", task: "L2 · Ü1.1 — D auf ℂ", base: ["r2vec"], steps: ["cvr", "dsgC"] },
  { id: "m13", task: "L3 · Ü1.3 — endliche Untergruppen", base: ["vr2"], steps: ["skp", "dsgO", "endlUG"] },
  // L4 ist die Körper-Kontrast-Lektion — sie darf ℚ von der Gruppe an aufbauen
  { id: "m21", task: "L4 · Ü2.1 — Scheitern über ℚ", base: ["qset"], steps: ["addgrpQ", "fieldQ", "vrQ", "vrQ2", "nodsgQ"] },
  { id: "m22", task: "L5 · Ü2.2 (1) — Rotationsgruppe", base: ["vr"], steps: ["vr3", "rot"] },
  { id: "m224", task: "L6 · Ü2.2 (4) — D_Z aus R", base: ["vr"], steps: ["vr3", "rot", "dsgZ"] },
  { id: "m31", task: "L7 · Ü3.1 — Längengerade", base: ["vr2"], steps: ["skp", "dsgO", "laenge"] },
  { id: "m44", task: "L8 · Ü4.4 — Flächeninhalt", base: ["vr2"], steps: ["flaeche"] },
  // Kongruenzebene-Lektionen starten bei ℂ
  { id: "m52", task: "L9 · Ü5.2 — Ähnlichkeiten", base: ["cvr"], steps: ["kong", "aehnlG"] },
  { id: "m53", task: "L10 · Ü5.3 — Dreispiegelungssatz", base: ["cvr"], steps: ["kong", "dreispieg"] },
  { id: "m54", task: "L11 · Ü5.4 — fasteukl. Geometrie", base: ["cvr"], steps: ["kong", "fasteukl"] },
  { id: "m63", task: "L12 · Ü6.3 — Kreisspiegelung", base: ["cvr"], steps: ["kong", "kreisspieg"] },
  { id: "m71", task: "L13 · Ü7.1 — Möbiustransformationen", base: ["kong"], steps: ["ebeneHat", "moeb", "moebInf"] },
  { id: "m81", task: "L14 · Ü8.1/9.2 — projektive Ebene", base: ["vr"], steps: ["vr3", "projEbene"] },
  { id: "m10", task: "L15 · Blatt 10 — hyperbolische Ebene", base: ["cvr"], steps: ["halbebene", "hypEbene"] },

  // --- Bauschema A: Definitionen direkt aus Elementarteilen ---
  { id: "dA9", task: "A · Def 9 — Strahl", base: [], steps: ["strahl"] },
  { id: "dA1", task: "A · Def 1 — Skalarprodukt", base: ["vr2"], steps: ["skp"] },
  { id: "dA8", task: "A · Def 8 — Flächeninhalt", base: ["vr2"], steps: ["flaeche"] },
  { id: "dA5", task: "A · Def 5 — Affiner Raum", base: ["vr"], steps: ["affraum"] },
  { id: "dA22", task: "A · Def 22 — Inzidenzgeometrie", base: [], steps: ["inzgeo"] },
  { id: "dA23", task: "A · Def 23 — Zwischenrelation", base: [], steps: ["zwax"] },
  { id: "dA25", task: "A · Def 25 — Parallelenaxiom", base: [], steps: ["inzgeo", "parallelax"] },
  { id: "dA26", task: "A · Def 26 — Erweiterte Ebene", base: ["vr"], steps: ["affraum", "affEbene", "erwEbene"] },

  // --- Bauschema B: Definitionen als Ketten (Unterdefinitionen elementar) ---
  { id: "dB2", task: "B · Def 2 — Orthogonale Gruppe", base: ["vr2"], steps: ["skp", "ogroup"] },
  { id: "dB3", task: "B · Def 3 — SO(Z,s)", base: ["vr2"], steps: ["skp", "ogroup", "sogroup"] },
  { id: "dB10", task: "B · Def 10 — Drehspiegelgruppe", base: ["vr2"], steps: ["strahl", "dsgAbstr"] },
  { id: "dB6", task: "B · Def 6 — Affine Gerade", base: ["vr"], steps: ["affraum", "affgerade"] },
  { id: "dB7", task: "B · Def 7 — Affinität", base: ["vr"], steps: ["affraum", "affinitaet"] },
  { id: "dB15", task: "B · Def 15 — Halbraumfahne", base: ["vr3"], steps: ["strahl", "halbfahne"] },
  { id: "dB16", task: "B · Def 16 — Rotationsgruppe", base: ["vr3"], steps: ["strahl", "halbfahne", "rotgroup"] },
  { id: "dB17", task: "B · Def 17 — Kongruenzebene", base: ["vr"], steps: ["affraum", "affEbene", "vr2", "strahl", "dsgAbstr", "kongEbene"] },
  { id: "dB18", task: "B · Def 18 — Euklidische Ebene", base: ["kongEbene"], steps: ["skp", "euklEbene"] },
  { id: "dB19", task: "B · Def 19 — Ähnlichkeit", base: ["kongEbene"], steps: ["aehnlichkeit"] },
  { id: "dB20", task: "B · Def 20 — Angeordnetes Dreieck", base: ["kongEbene"], steps: ["dreieck"] },
  { id: "dB21", task: "B · Def 21 — Strecke & Zwischenrelation", base: ["vr"], steps: ["affraum", "streckeZw"] },
  { id: "dB24", task: "B · Def 24 — Fasteuklidische Geometrie", base: ["kongEbene"], steps: ["inzgeo", "zwax", "fasteuklGeo"] },
  { id: "dB27", task: "B · Def 27 — Kreisspiegelung", base: ["vr"], steps: ["affraum", "affEbene", "erwEbene", "kreisInv"] },
  { id: "dB29", task: "B · Def 29 — Projektiver Raum", base: ["vr"], steps: ["projRaum"] },
];

// ====================================================================
export default function StrukturBaukasten({ initialId, onOutcome }) {
  const baseInventory = Object.keys(BLOCKS);
  const [discovered, setDiscovered] = useState([]); // result-ids
  const [bench, setBench] = useState([]); // [{uid, id, x, y}] — frei positioniert
  const [snapping, setSnapping] = useState(false);
  const [flash, setFlash] = useState(null); // zuletzt entdecktes Ergebnis
  const [hint, setHint] = useState("");
  const [collapsed, setCollapsed] = useState({}); // { objekt: bool, anforderung: bool }
  const [mission, setMission] = useState(null); // Missions-id oder null (freies Bauen)
  const [puzzle, setPuzzle] = useState(false); // Übungsmodus: nur Zutaten zeigen, Lösung verbergen
  const toggle = (key) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));
  const benchRef = useRef(null);
  const reduce = useRef(false);
  const uidRef = useRef(1);
  const missionFails = useRef(0); // Fehlversuche in der aktuellen Lektion (Messwert)
  const reported = useRef(false); // Ergebnis dieser Lektion schon gemeldet?

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Aus der Bibliothek angeforderte Lektion öffnen (im Übungsmodus)
  useEffect(() => {
    if (initialId && MISSIONS.some((m) => m.id === initialId)) {
      setMission(initialId); setPuzzle(true); setBench([]); setHint("");
      missionFails.current = 0; reported.current = false;
    }
  }, [initialId]); // eslint-disable-line


  // kettbare, bereits entdeckte Ergebnisse werden zu ziehbaren Bausteinen
  const chainBlocks = discovered.filter((r) => RESULTS[r].chainable);

  const clearBench = () => { setBench([]); setHint(""); };

  const TILE_W = 150; // ungefähre Kachelbreite
  const TILE_H = 74; // ungefähre Kachelhöhe
  const GAP = 40; // erlaubte Lücke zwischen Kachelkanten, damit sie noch als verbunden gelten

  // Cluster: Zusammenhangskomponenten des "Kanten nah beieinander"-Graphen
  // --- Raster-Werkbank: Bausteine in Zellen legen, dann Hammer -----------
  const gridCap = useMemo(() => {
    const maxNeed = RECIPES.length ? Math.max(...RECIPES.map((r) => r.need.length)) : 3;
    return Math.max(6, maxNeed + 2);
  }, []);
  const firstEmptyCell = (items) => {
    const used = new Set(items.map((b) => b.cell));
    for (let i = 0; i < gridCap; i++) if (!used.has(i)) return i;
    return -1;
  };
  const addByTap = (id) => {
    if (snapping) return;
    setBench((prev) => {
      const cell = firstEmptyCell(prev);
      if (cell === -1) return prev; // voll
      return [...prev, { uid: uidRef.current++, id, cell }];
    });
    setHint("");
  };
  const removeUid = (uid) => {
    if (snapping) return;
    setBench((prev) => prev.filter((b) => b.uid !== uid));
    setHint("");
  };

  // Hammer: alle abgelegten Bausteine als eine Konstruktion prüfen (lagenunabhängig)
  const build = () => {
    if (snapping || bench.length === 0) return;
    const ids = bench.map((b) => b.id);
    const exact = RECIPES.find((r) => eqSet(r.need, ids));
    if (exact) {
      setHint("");
      setSnapping(true);
      const delay = reduce.current ? 60 : 640;
      setTimeout(() => {
        setDiscovered((d) => (d.includes(exact.result) ? d : [...d, exact.result]));
        setFlash(exact.result);
        setBench([{ uid: uidRef.current++, id: exact.result, cell: 0 }]);
        setSnapping(false);
        // Missionsziel gebaut → gemessenes Ergebnis melden (genau bei der Leistung,
        // nicht schon beim Öffnen einer früher gebauten Lektion)
        const m = mission ? MISSIONS.find((x) => x.id === mission) : null;
        const goalId = m?.steps[m.steps.length - 1];
        if (goalId && exact.result === goalId && !reported.current) {
          reported.current = true;
          onOutcome?.(mission, missionFails.current);
        }
      }, delay);
      return;
    }
    missionFails.current += 1;
    const partial = RECIPES.some((r) => isSubset(ids, r.need) && ids.length < r.need.length);
    setHint(partial ? "Fast — hier fehlt noch ein Baustein für eine Konstruktion." : "Diese Teile bilden keine bekannte Konstruktion.");
  };

  const paperBg = {
    backgroundColor: C.paper,
    backgroundImage: `radial-gradient(${C.dot} 1.3px, transparent 1.3px)`,
    backgroundSize: "22px 22px",
  };

  const found = discovered.length;
  const total = Object.keys(RESULTS).length;

  return (
    <div style={{ ...paperBg, color: C.ink, minHeight: "100%", fontFamily: "system-ui, sans-serif" }} className="w-full">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Kopf */}
        <header className="mb-6">
          <div style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.18em" }} className="text-[11px] uppercase text-slate-500 mb-1">
            Elementargeometrie · Konstruktionen
          </div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl sm:text-4xl font-semibold leading-tight">
            Struktur-Baukasten
          </h1>
        </header>

        {/* Missionen */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.14em" }} className="text-[11px] uppercase text-slate-500">
              Mission wählen
            </span>
            <button
              onClick={() => setPuzzle((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] transition-colors border"
              style={{
                fontFamily: "ui-monospace, monospace",
                background: puzzle ? C.anford : "rgba(255,255,255,0.5)",
                color: puzzle ? "#fff" : C.ink,
                borderColor: puzzle ? C.anford : "#B7C3CF",
              }}
            >
              Übungsmodus {puzzle ? "an" : "aus"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <MissionChip label="Frei bauen" active={mission === null} onClick={() => setMission(null)} />
            {MISSIONS.map((m) => (
              <MissionChip
                key={m.id}
                label={m.task}
                active={mission === m.id}
                done={m.steps.every((s) => discovered.includes(s))}
                onClick={() => { missionFails.current = 0; reported.current = false; setMission(mission === m.id ? null : m.id); }}
              />
            ))}
          </div>
          {mission && puzzle && (
            <PuzzlePanel mission={MISSIONS.find((m) => m.id === mission)} discovered={discovered} onAdd={addByTap} />
          )}
          {mission && !puzzle && (
            <MissionPanel
              mission={MISSIONS.find((m) => m.id === mission)}
              discovered={discovered}
              bench={bench}
            />
          )}
        </section>

        {/* Werkbank */}
        <section className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.14em" }} className="text-[11px] uppercase text-slate-500">
              Werkbank
            </span>
            <button
              onClick={clearBench}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors"
              style={{ fontFamily: "ui-monospace, monospace" }}
            >
              <RotateCcw size={12} /> leeren
            </button>
          </div>

          {/* Raster: Bausteine aus den Vorräten hier ablegen (tippen), Zelle antippen leert sie */}
          <div ref={benchRef} className="rounded-2xl border-2 border-dashed p-2" style={{ borderColor: "#B7C3CF", background: "rgba(255,255,255,0.35)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
              {Array.from({ length: gridCap }).map((_, cell) => {
                const item = bench.find((b) => b.cell === cell);
                if (item) {
                  return (
                    <button key={cell} onClick={() => removeUid(item.uid)} title="antippen leert die Zelle"
                      className="text-left" style={{ filter: snapping ? `drop-shadow(0 0 10px ${ROLE[resolve(item.id).role].hi})` : "none", cursor: "pointer" }}>
                      <TileFace block={resolve(item.id)} full />
                    </button>
                  );
                }
                return <div key={cell} className="rounded-xl" style={{ minHeight: 62, background: "rgba(27,36,48,0.03)", border: "1px dashed #C4D0DB" }} />;
              })}
            </div>
            {bench.length === 0 && (
              <p className="text-sm text-slate-400 text-center px-6 py-3" style={{ fontFamily: "Georgia, serif" }}>
                leer
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2 min-h-[52px]">
            <button
              onClick={build}
              disabled={bench.length === 0 || snapping}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium select-none transition-all"
              style={{
                fontFamily: "ui-monospace, monospace",
                letterSpacing: "0.04em",
                background: bench.length === 0 || snapping ? "#C4D0DB" : C.ergeb,
                color: bench.length === 0 || snapping ? "#8595a4" : "#fff",
                cursor: bench.length === 0 || snapping ? "default" : "pointer",
                boxShadow: bench.length === 0 || snapping ? "none" : "0 2px 0 rgba(0,0,0,0.18)",
              }}
            >
              <Hammer size={16} /> Hammer
            </button>
            {hint && <p className="text-xs" style={{ color: C.anford }}>{hint}</p>}
          </div>
        </section>

        {/* Frisch entdeckte Struktur */}
        {flash && (
          <div
            className="mb-6 rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ background: "rgba(31,122,99,0.10)", border: `1px solid ${C.ergeb}` }}
          >
            <div className="mt-0.5 shrink-0 rounded-full p-1" style={{ background: C.ergeb }}>
              <Check size={14} color="#fff" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500">Gebaut</span>
                <span style={{ fontFamily: "Georgia, serif", color: C.ergeb }} className="text-lg font-semibold">
                  {RESULTS[flash].name}
                </span>
                <span className="text-sm text-slate-600">{RESULTS[flash].sub}</span>
              </div>
              {/* kurz und schön: was dieses Objekt genau ist */}
              <p className="text-[15px] text-slate-800 mt-1.5 leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>
                {KURZ[flash] || RESULTS[flash].note}
              </p>
            </div>
          </div>
        )}

        {/* Vorrat */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(() => {
            // Im Übungsmodus mit gewählter Mission: nur die tatsächlich benötigten Grundbausteine zeigen
            const activeMission = mission ? MISSIONS.find((m) => m.id === mission) : null;
            const allow = puzzle && activeMission ? new Set(missionIngredients(activeMission)) : null;
            const trager = baseInventory.filter((i) => BLOCKS[i].role === "objekt" && (!allow || allow.has(i)));
            const verkn = baseInventory.filter((i) => BLOCKS[i].role === "verknuepfung" && (!allow || allow.has(i)));
            const zutaten = baseInventory.filter((i) => BLOCKS[i].role === "anforderung" && (!allow || allow.has(i)));
            return (
              <>
                <Shelf title="Träger" role="objekt" ids={trager} onTap={addByTap} collapsed={!!collapsed.objekt} onToggle={() => toggle("objekt")} />
                <Shelf title="Verknüpfungen" role="verknuepfung" ids={verkn} onTap={addByTap} collapsed={!!collapsed.verknuepfung} onToggle={() => toggle("verknuepfung")} />
                <Shelf title="Zutaten" role="anforderung" ids={zutaten} onTap={addByTap} collapsed={!!collapsed.anforderung} onToggle={() => toggle("anforderung")} />
              </>
            );
          })()}
          <div>
            <ShelfHead title="Strukturen" role="ergebnis" count={`${found}/${total}`} />
            <div className="flex flex-col gap-2">
              {(() => {
                const activeMission = mission ? MISSIONS.find((m) => m.id === mission) : null;
                const baseIds = puzzle && activeMission ? (activeMission.base || []).filter((id) => RESULTS[id]) : [];
                if (baseIds.length === 0) return null;
                return (
                  <div className="rounded-lg p-2 mb-1" style={{ background: "rgba(49,89,127,0.06)", border: `1px dashed ${C.objekt}` }}>
                    <div style={{ fontFamily: "ui-monospace, monospace" }} className="text-[9px] uppercase tracking-wider text-slate-500 mb-1.5 px-0.5">
                      Startpunkt dieser Lektion
                    </div>
                    <div className="flex flex-col gap-2">
                      {baseIds.map((id) => (
                        <PaletteTile key={`base-${id}`} block={RESULTS[id]} onTap={addByTap} draggable />
                      ))}
                    </div>
                  </div>
                );
              })()}
              {chainBlocks.length === 0 && found === 0 && (
                <p className="text-xs text-slate-400 mt-1" style={{ fontFamily: "Georgia, serif" }}>
                  noch nichts konstruiert
                </p>
              )}
              {/* kettbare Ergebnisse: antippen → auf die Werkbank */}
              {chainBlocks.map((id) => (
                <PaletteTile key={id} block={RESULTS[id]} onTap={addByTap} draggable />
              ))}
              {/* nicht-kettbare entdeckte Ergebnisse: nur Sammlung */}
              {discovered.filter((r) => !RESULTS[r].chainable).map((id) => (
                <PaletteTile key={id} block={RESULTS[id]} draggable={false} />
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-8 text-[11px] text-slate-400" style={{ fontFamily: "ui-monospace, monospace" }}>
          {found === total ? "Alle Konstruktionen gefunden." : "Rezepte nach den Übungsblättern SS 2026."}
        </footer>
      </div>

    </div>
  );
}

// --- Missions-Auswahl -----------------------------------------------
function PuzzlePanel({ mission, discovered, onAdd }) {
  const goalId = mission.steps[mission.steps.length - 1];
  const goal = RESULTS[goalId];
  const complete = discovered.includes(goalId);
  const baseIds = mission.base || [];
  const baseSet = new Set(baseIds);
  const ingredients = missionIngredients(mission).filter((id) => !baseSet.has(id)); // ohne die Startpunkte
  return (
    <div className="mt-3 rounded-xl p-4" style={{ background: "rgba(178,106,30,0.06)", border: `1px solid ${complete ? C.ergeb : C.anford}` }}>
      <div className="flex items-center gap-2 flex-wrap">
        <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[11px] text-slate-500 uppercase tracking-wider">
          Übungsmodus · {mission.task.split(" — ")[0]}
        </span>
        {complete && (
          <span className="inline-flex items-center gap-1 ml-auto text-xs font-medium" style={{ color: C.ergeb }}>
            <Check size={13} /> geschafft
          </span>
        )}
      </div>

      {/* Endprodukt: das konkrete Objekt, das gebaut werden soll */}
      <div className="mt-2 rounded-lg px-3 py-2.5" style={{ background: "rgba(255,255,255,0.6)", borderLeft: `3px solid ${complete ? C.ergeb : C.anford}` }}>
        <div style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
          Endprodukt
        </div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span style={{ fontFamily: "Georgia, serif", color: complete ? C.ergeb : C.anford }} className="text-xl font-semibold">
            {goal.name}
          </span>
          <span className="text-sm text-slate-600">{goal.sub}</span>
        </div>
        {goal.note && <p className="text-xs text-slate-600 mt-1">{goal.note}</p>}
      </div>

      {baseIds.length > 0 && (
        <div className="mt-3">
          <div style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
            Startpunkt
          </div>
          <div className="flex flex-wrap gap-1.5">
            {baseIds.map((id) => {
              const b = resolve(id);
              return (
                <button
                  key={id}
                  onClick={() => onAdd && onAdd(id)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors hover:brightness-95"
                  style={{ fontFamily: "Georgia, serif", background: "rgba(49,89,127,0.10)", color: C.objekt, border: `1px solid ${C.objekt}`, cursor: "pointer" }}
                >
                  {b.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-3">
        <div style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
          Benötigte Bausteine
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ingredients.map((id) => {
            const b = resolve(id);
            return (
              <button
                key={id}
                onClick={() => onAdd && onAdd(id)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors hover:brightness-95"
                style={{ fontFamily: "Georgia, serif", background: "rgba(0,0,0,0.04)", color: ROLE[b.role].fill, border: `1px solid ${ROLE[b.role].fill}`, cursor: "pointer" }}
              >
                {b.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MissionChip({ label, active, done, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors border"
      style={{
        fontFamily: "ui-monospace, monospace",
        letterSpacing: "0.04em",
        background: active ? C.ergeb : "rgba(255,255,255,0.5)",
        color: active ? "#fff" : C.ink,
        borderColor: active ? C.ergeb : "#B7C3CF",
      }}
    >
      {done && <Check size={12} color={active ? "#fff" : C.ergeb} />}
      {label}
    </button>
  );
}

function MissionPanel({ mission, discovered, bench }) {
  const goalId = mission.steps[mission.steps.length - 1];
  const goal = RESULTS[goalId];
  const complete = mission.steps.every((s) => discovered.includes(s));
  const currentStep = mission.steps.find((s) => !discovered.includes(s)) || goalId;
  const chained = mission.steps.length > 1;

  return (
    <div
      className="mt-3 rounded-xl p-4"
      style={{ background: "rgba(255,255,255,0.55)", border: `1px solid ${complete ? C.ergeb : "#B7C3CF"}` }}
    >
      <div className="flex items-baseline gap-2 flex-wrap">
        <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[11px] text-slate-500 uppercase tracking-wider">
          {mission.task}
        </span>
        <span className="text-slate-400">·</span>
        <span className="text-sm text-slate-600">konstruiere</span>
        <span style={{ fontFamily: "Georgia, serif", color: C.ergeb }} className="text-base font-semibold">
          {goal.name}
        </span>
        <span className="text-sm text-slate-600">({goal.sub})</span>
        {complete && (
          <span className="inline-flex items-center gap-1 ml-auto text-xs font-medium" style={{ color: C.ergeb }}>
            <Check size={13} /> erfüllt
          </span>
        )}
      </div>

      {/* Stufen einer Kette (Zwischenmissionen) */}
      {chained && (
        <ol className="mt-3 space-y-1.5">
          {mission.steps.map((s, i) => {
            const stepDone = discovered.includes(s);
            const isCurrent = s === currentStep && !complete;
            return (
              <li key={s} className="flex items-center gap-2 text-sm">
                <span
                  className="inline-flex items-center justify-center rounded-full shrink-0"
                  style={{
                    width: 18, height: 18,
                    background: stepDone ? C.ergeb : "transparent",
                    border: stepDone ? "none" : `1.5px solid ${isCurrent ? C.ergeb : "#9fb0c0"}`,
                  }}
                >
                  {stepDone ? <Check size={11} color="#fff" /> : (
                    <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: isCurrent ? C.ergeb : "#9fb0c0" }}>{i + 1}</span>
                  )}
                </span>
                <span style={{ fontFamily: "Georgia, serif" }} className={stepDone ? "text-slate-400 line-through" : "text-slate-700"}>
                  {RESULTS[s].name}
                </span>
                <span className="text-xs text-slate-400">{RESULTS[s].sub}</span>
              </li>
            );
          })}
        </ol>
      )}

      {/* Beweisziel: Voraussetzungen stehen — jetzt die Behauptung zeigen */}
      {complete && goal.claim && (
        <div className="mt-3 rounded-lg p-3" style={{ background: "rgba(31,122,99,0.08)", borderLeft: `3px solid ${C.ergeb}` }}>
          <div style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
            Voraussetzung
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {needForResult(goalId).map((id, idx) => (
              <span
                key={`${id}-${idx}`}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                style={{ fontFamily: "Georgia, serif", background: "rgba(31,122,99,0.12)", color: C.ergeb, border: `1px solid ${C.ergeb}` }}
              >
                <Check size={11} />
                {resolve(id).name}
              </span>
            ))}
          </div>
          <div style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
            Zu zeigen
          </div>
          <p className="text-sm text-slate-800" style={{ fontFamily: "Georgia, serif" }}>
            {goal.claim}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Die Konstruktion steht — der Beweis ist deine Aufgabe. Beweisidee im Chat skizzieren?
          </p>
        </div>
      )}

      {/* Zwischenmission: benötigte Bausteine für die aktuelle Stufe */}
      {!complete && (
        <div className="mt-3">
          <div style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
            {chained ? `Bausteine für Stufe ${mission.steps.indexOf(currentStep) + 1}` : "Diese Begriffe bauen"}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {needForResult(currentStep).map((id, idx) => {
              // wie oft kommt dieser Baustein bis hierhin in der Liste vor?
              const nth = needForResult(currentStep).slice(0, idx + 1).filter((x) => x === id).length;
              const onBench = bench.filter((x) => x === id).length;
              const have = onBench >= nth || discovered.includes(id);
              const b = resolve(id);
              return (
                <span
                  key={`${id}-${idx}`}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                  style={{
                    fontFamily: "Georgia, serif",
                    background: have ? "rgba(31,122,99,0.12)" : "rgba(0,0,0,0.04)",
                    color: have ? C.ergeb : "#5b6875",
                    border: `1px solid ${have ? C.ergeb : "transparent"}`,
                  }}
                >
                  {have && <Check size={11} />}
                  {b.name}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Regal ----------------------------------------------------------
function ShelfHead({ title, role, count, collapsible, collapsed, onToggle }) {
  const inner = (
    <>
      {collapsible && (
        <ChevronDown
          size={14}
          className="text-slate-500 shrink-0"
          style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform .2s ease" }}
        />
      )}
      <span style={{ background: ROLE[role].fill, width: 10, height: 10, borderRadius: 3 }} />
      <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.14em" }} className="text-[11px] uppercase text-slate-500">
        {title}
      </span>
      {count && <span className="text-[11px] text-slate-400 ml-auto" style={{ fontFamily: "ui-monospace, monospace" }}>{count}</span>}
    </>
  );
  if (collapsible) {
    return (
      <button
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="flex items-center gap-2 mb-2 w-full text-left hover:opacity-70 transition-opacity"
      >
        {inner}
      </button>
    );
  }
  return <div className="flex items-center gap-2 mb-2">{inner}</div>;
}

function Shelf({ title, role, ids, onTap, collapsed, onToggle }) {
  return (
    <div>
      <ShelfHead title={title} role={role} collapsible collapsed={collapsed} onToggle={onToggle} />
      {!collapsed && (
        <div className="flex flex-col gap-2">
          {ids.map((id) => (
            <PaletteTile key={id} block={BLOCKS[id]} onTap={onTap} draggable />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Kachel im Vorrat (antippen → auf die Werkbank) -----------------
function PaletteTile({ block, onTap, disabled, draggable }) {
  if (!draggable || disabled) {
    return <div style={{ opacity: disabled ? 0.35 : 1, cursor: "default" }}><TileFace block={block} /></div>;
  }
  return (
    <button onClick={() => onTap && onTap(block.id)} title="antippen → auf die Werkbank" style={{ cursor: "pointer", textAlign: "left", width: "100%" }}>
      <TileFace block={block} />
    </button>
  );
}

// --- Kachel auf der Werkbank ----------------------------------------
// --- Gemeinsame Kachel-Optik ----------------------------------------
function TileFace({ block, lifted, full }) {
  const r = ROLE[block.role];
  return (
    <div
      style={{
        background: `linear-gradient(160deg, ${r.hi}, ${r.fill})`,
        color: "#fff",
        borderRadius: 12,
        padding: "10px 14px",
        minWidth: full ? 0 : 140,
        width: full ? "100%" : undefined,
        minHeight: full ? 62 : undefined,
        boxShadow: lifted
          ? "0 12px 28px rgba(0,0,0,0.28)"
          : "0 2px 0 rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25)",
        border: "1px solid rgba(255,255,255,0.18)",
      }}
    >
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.16em", opacity: 0.8 }} className="uppercase mb-0.5">
        {r.label}
      </div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 17, lineHeight: 1.1 }} className="font-semibold">
        {block.name}
      </div>
      <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>{block.sub}</div>
    </div>
  );
}
