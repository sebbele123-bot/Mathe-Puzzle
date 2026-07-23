import React, { useState, useRef, useEffect } from "react";
import { RotateCcw, Check, ChevronDown, Hammer, CopyPlus } from "lucide-react";

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
const MISSIONS = [
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
];

// ====================================================================
export default function StrukturBaukasten() {
  const baseInventory = Object.keys(BLOCKS);
  const [discovered, setDiscovered] = useState([]); // result-ids
  const [bench, setBench] = useState([]); // [{uid, id, x, y}] — frei positioniert
  const [drag, setDrag] = useState(null); // {kind, id, uid?, x, y, ox, oy, offX?, offY?}
  const [snapping, setSnapping] = useState(false);
  const [flash, setFlash] = useState(null); // zuletzt entdecktes Ergebnis
  const [hint, setHint] = useState("");
  const [collapsed, setCollapsed] = useState({}); // { objekt: bool, anforderung: bool }
  const [mission, setMission] = useState(null); // Missions-id oder null (freies Bauen)
  const [tool, setTool] = useState(null); // aktives Werkzeug: null | "hammer" | "clone"
  const [puzzle, setPuzzle] = useState(false); // Übungsmodus: nur Zutaten zeigen, Lösung verbergen
  const toggle = (key) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));
  const benchRef = useRef(null);
  const reduce = useRef(false);
  const uidRef = useRef(1);

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // kettbare, bereits entdeckte Ergebnisse werden zu ziehbaren Bausteinen
  const chainBlocks = discovered.filter((r) => RESULTS[r].chainable);

  const clearBench = () => { setBench([]); setHint(""); setTool(null); };

  const TILE_W = 150; // ungefähre Kachelbreite
  const TILE_H = 74; // ungefähre Kachelhöhe
  const GAP = 40; // erlaubte Lücke zwischen Kachelkanten, damit sie noch als verbunden gelten

  // Cluster: Zusammenhangskomponenten des "Kanten nah beieinander"-Graphen
  const clustersOf = (items) => {
    // zwei Kacheln verbunden, wenn sich ihre (um GAP/2 erweiterten) Rechtecke überlappen
    const near = (a, b) =>
      Math.abs(a.x - b.x) < TILE_W + GAP && Math.abs(a.y - b.y) < TILE_H + GAP;
    const seen = new Set();
    const groups = [];
    for (const it of items) {
      if (seen.has(it.uid)) continue;
      const stack = [it], group = [];
      seen.add(it.uid);
      while (stack.length) {
        const cur = stack.pop();
        group.push(cur);
        for (const other of items) {
          if (!seen.has(other.uid) && near(cur, other)) { seen.add(other.uid); stack.push(other); }
        }
      }
      groups.push(group);
    }
    return groups;
  };

  // ein Cluster bauen: gegen Rezepte prüfen und ggf. zum Ergebnis verschmelzen
  const buildCluster = (group) => {
    if (snapping || group.length === 0) return;
    const ids = group.map((g) => g.id);
    const exact = RECIPES.find((r) => eqSet(r.need, ids));
    if (exact) {
      // Schwerpunkt des Clusters als Position des Ergebnisses
      const cx = group.reduce((s, g) => s + g.x, 0) / group.length;
      const cy = group.reduce((s, g) => s + g.y, 0) / group.length;
      const groupUids = new Set(group.map((g) => g.uid));
      setHint("");
      setSnapping(true);
      const delay = reduce.current ? 60 : 720;
      setTimeout(() => {
        setDiscovered((d) => (d.includes(exact.result) ? d : [...d, exact.result]));
        setFlash(exact.result);
        setBench((prev) => [
          ...prev.filter((b) => !groupUids.has(b.uid)),
          { uid: uidRef.current++, id: exact.result, x: cx, y: cy },
        ]);
        setSnapping(false);
      }, delay);
      return;
    }
    const partial = RECIPES.some((r) => isSubset(ids, r.need) && ids.length < r.need.length);
    if (partial) setHint("Fast — hier fehlt noch ein Baustein für eine Konstruktion.");
    else setHint("Diese Teile bilden keine bekannte Konstruktion.");
  };

  // Baustein an einer Position (relativ zur Werkbank) ablegen
  const addToBenchAt = (id, clientX, clientY) => {
    if (snapping) return;
    const rect = benchRef.current?.getBoundingClientRect();
    const x = rect ? clientX - rect.left : 40;
    const y = rect ? clientY - rect.top : 40;
    const uid = uidRef.current++;
    setBench((prev) => [...prev, { uid, id, x, y }]);
    setHint("");
    // frisch abgelegtes Teil magnetisch andocken, falls nah an einem anderen
    requestAnimationFrame(() => snapMagnet(uid));
  };

  // per Tap hinzufügen: an eine leicht gestaffelte, freie Stelle der Werkbank legen (ohne Auto-Snap)
  const addByTap = (id) => {
    if (snapping) return;
    const rect = benchRef.current?.getBoundingClientRect();
    const w = rect ? rect.width : 400, h = rect ? rect.height : 260;
    setBench((prev) => {
      const uid = uidRef.current++;
      // Position rasterförmig staffeln, damit neue Teile nicht exakt übereinander landen
      const n = prev.length;
      const x = 100 + (n % 4) * 90;
      const y = 70 + Math.floor(n / 4) * 90;
      return [...prev, { uid, id, x: Math.min(x, w - 60), y: Math.min(y, h - 50) }];
    });
    setHint("");
  };

  const removeUid = (uid) => {
    if (snapping) return;
    setBench((prev) => prev.filter((b) => b.uid !== uid));
    setHint("");
  };

  const cloneUid = (uid) => {
    if (snapping) return;
    setBench((prev) => {
      const src = prev.find((b) => b.uid === uid);
      if (!src) return prev;
      return [...prev, { uid: uidRef.current++, id: src.id, x: src.x + 28, y: src.y + 28 }];
    });
    setHint("");
  };

  // aktives Werkzeug auf eine angeklickte Werkbank-Kachel anwenden
  const applyToolTo = (item) => {
    if (snapping || !tool) return;
    if (tool === "clone") {
      cloneUid(item.uid);
      setTool(null);
      return;
    }
    if (tool === "hammer") {
      // Cluster finden, zu dem diese Kachel gehört, und bauen
      const group = clustersOf(bench).find((g) => g.some((it) => it.uid === item.uid));
      if (group) buildCluster(group);
      setTool(null);
      return;
    }
  };

  // Magnet: eine gerade bewegte Kachel bündig an die nächste andere Kachel andocken
  const SNAP = 46; // Fangreichweite (Lücke zwischen den Kanten)
  const snapMagnet = (uid) => {
    setBench((prev) => {
      const me = prev.find((b) => b.uid === uid);
      if (!me) return prev;
      let best = null, bestD = Infinity;
      for (const other of prev) {
        if (other.uid === uid) continue;
        const dx = me.x - other.x, dy = me.y - other.y;
        const gapX = Math.abs(dx) - TILE_W; // Überlappung/Lücke horizontal
        const gapY = Math.abs(dy) - TILE_H; // vertikal
        const d = Math.hypot(dx, dy);
        // nur andocken, wenn eine Kante in Fangreichweite ist
        if (Math.abs(dy) < TILE_H && gapX < SNAP && d < bestD) { bestD = d; best = { other, axis: "x", dir: Math.sign(dx) || 1 }; }
        else if (Math.abs(dx) < TILE_W && gapY < SNAP && d < bestD) { bestD = d; best = { other, axis: "y", dir: Math.sign(dy) || 1 }; }
      }
      if (!best) return prev;
      const o = best.other;
      const target =
        best.axis === "x"
          ? { x: o.x + best.dir * TILE_W, y: o.y } // bündig links/rechts, Höhe angleichen
          : { x: o.x, y: o.y + best.dir * TILE_H }; // bündig oben/unten, Spalte angleichen
      return prev.map((b) => (b.uid === uid ? { ...b, x: target.x, y: target.y } : b));
    });
  };

  // --- Pointer-Drag (Maus + Touch einheitlich) ----------------------
  // Vorrat-Baustein aufnehmen
  const startDrag = (e, id) => {
    if (snapping) return;
    const t = e.touches ? e.touches[0] : e;
    setDrag({ kind: "palette", id, x: t.clientX, y: t.clientY, ox: t.clientX, oy: t.clientY });
    setFlash(null);
  };
  // vorhandene Werkbank-Kachel aufnehmen (zum Verschieben)
  const startBenchDrag = (e, item) => {
    if (snapping) return;
    e.stopPropagation();
    const t = e.touches ? e.touches[0] : e;
    const rect = benchRef.current?.getBoundingClientRect();
    const offX = rect ? t.clientX - rect.left - item.x : 0;
    const offY = rect ? t.clientY - rect.top - item.y : 0;
    setDrag({ kind: "bench", id: item.id, uid: item.uid, x: t.clientX, y: t.clientY, ox: t.clientX, oy: t.clientY, offX, offY });
    setFlash(null);
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      const t = e.touches ? e.touches[0] : e;
      setDrag((d) => (d ? { ...d, x: t.clientX, y: t.clientY } : d));
      // Werkbank-Kachel live mitziehen
      if (drag.kind === "bench") {
        const rect = benchRef.current?.getBoundingClientRect();
        if (rect) {
          const nx = t.clientX - rect.left - drag.offX;
          const ny = t.clientY - rect.top - drag.offY;
          setBench((prev) => prev.map((b) => (b.uid === drag.uid ? { ...b, x: nx, y: ny } : b)));
        }
      }
      if (e.cancelable) e.preventDefault();
    };
    const up = (e) => {
      const t = e.changedTouches ? e.changedTouches[0] : e;
      const moved = Math.hypot(t.clientX - drag.ox, t.clientY - drag.oy);
      const rect = benchRef.current?.getBoundingClientRect();
      const overBench = rect && t.clientX >= rect.left && t.clientX <= rect.right && t.clientY >= rect.top && t.clientY <= rect.bottom;
      if (drag.kind === "bench") {
        // Verschieben endet: magnetisch an eine nahe Kachel andocken
        snapMagnet(drag.uid);
      } else {
        // Vorrat-Baustein: Ablegen auf der Werkbank platziert ihn dort
        if (overBench) addToBenchAt(drag.id, t.clientX, t.clientY);
        else if (moved < 8) addToBenchAt(drag.id, rect ? rect.left + 60 : 60, rect ? rect.top + 60 : 60);
      }
      setDrag(null);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [drag, bench, snapping]); // eslint-disable-line

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
          <p className="text-sm text-slate-600 mt-2 max-w-xl">
            Zieh Bausteine auf die Werkbank und schieb sie dort frei umher. Wenn du zusammengehörige Teile nah aneinander legst, bilden sie eine Verknüpfung — zieh dann den Hammer darauf,
            rasten sie ein und bilden eine neue Struktur. Manche Strukturen sind selbst wieder Bausteine.
          </p>
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
                onClick={() => setMission(mission === m.id ? null : m.id)}
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

          <div
            ref={benchRef}
            className="relative rounded-2xl border-2 border-dashed transition-colors overflow-hidden"
            style={{
              borderColor: tool ? (tool === "hammer" ? C.ergeb : C.objekt) : drag ? C.ergebHi : "#B7C3CF",
              background: tool ? "rgba(47,165,136,0.08)" : drag ? "rgba(47,165,136,0.06)" : "rgba(255,255,255,0.35)",
              minHeight: 260,
              touchAction: "none",
            }}
          >
            {bench.length === 0 && !snapping && (
              <span className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 pointer-events-none" style={{ fontFamily: "Georgia, serif" }}>
                leer — Bausteine hierher ziehen, dann nah zusammenschieben
              </span>
            )}

            {/* Cluster-Hüllen: markieren, was als Verknüpfung zusammengehört */}
            {clustersOf(bench).filter((g) => g.length > 1).map((g, gi) => {
              const xs = g.map((it) => it.x), ys = g.map((it) => it.y);
              const left = Math.min(...xs) - TILE_W / 2 - 8;
              const top = Math.min(...ys) - TILE_H / 2 - 8;
              const right = Math.max(...xs) + TILE_W / 2 + 8;
              const bottom = Math.max(...ys) + TILE_H / 2 + 8;
              return (
                <div
                  key={`cluster-${gi}`}
                  className="absolute rounded-2xl pointer-events-none transition-all"
                  style={{
                    left, top, width: right - left, height: bottom - top,
                    border: `2px solid ${C.ergebHi}`,
                    background: "rgba(47,165,136,0.07)",
                    zIndex: 0,
                  }}
                />
              );
            })}

            {/* Puzzle-Konnektoren: Kreis an der Nahtstelle bündig angedockter Kacheln */}
            {bench.flatMap((a, i) =>
              bench.slice(i + 1).map((b) => {
                const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
                const dockedX = Math.abs(dx - TILE_W) < 14 && dy < TILE_H * 0.6; // links/rechts bündig
                const dockedY = Math.abs(dy - TILE_H) < 14 && dx < TILE_W * 0.6; // oben/unten bündig
                if (!dockedX && !dockedY) return null;
                const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                return (
                  <div
                    key={`link-${a.uid}-${b.uid}`}
                    aria-hidden
                    className="absolute pointer-events-none"
                    style={{
                      left: mx, top: my, transform: "translate(-50%,-50%)",
                      width: 18, height: 18, borderRadius: "50%",
                      background: C.paper, border: "2px solid #9fb0c0",
                      zIndex: 6,
                      transition: snapping ? "transform .4s ease" : "none",
                    }}
                  />
                );
              })
            )}

            {/* frei positionierte Bausteine — verschiebbar, oder Ziel fürs aktive Werkzeug */}
            {bench.map((item) => (
              <div
                key={item.uid}
                data-benchuid={item.uid}
                onPointerDown={(e) => { if (!tool) startBenchDrag(e, item); }}
                onClick={() => { if (tool) applyToolTo(item); }}
                className="absolute select-none"
                style={{
                  left: item.x, top: item.y,
                  transform: "translate(-50%, -50%)",
                  touchAction: "none",
                  cursor: tool ? "pointer" : "grab",
                  zIndex: drag && drag.uid === item.uid ? 30 : 5,
                  opacity: drag && drag.kind === "bench" && drag.uid === item.uid ? 0.5 : 1,
                  filter: snapping ? `drop-shadow(0 0 10px ${ROLE[resolve(item.id).role].hi})` : "none",
                  // sanftes Einschnappen beim Loslassen; nicht, während dieselbe Kachel aktiv gezogen wird
                  transition: drag && drag.kind === "bench" && drag.uid === item.uid ? "none" : "left .16s ease, top .16s ease",
                }}
              >
                <div style={{ position: "relative", outline: tool ? `2px dashed ${tool === "hammer" ? C.ergeb : C.objekt}` : "none", outlineOffset: 3, borderRadius: 12 }}>
                  <TileFace block={resolve(item.id)} />
                  {!tool && (
                    <button
                      onPointerDown={(e) => { e.stopPropagation(); }}
                      onClick={(e) => { e.stopPropagation(); removeUid(item.uid); }}
                      aria-label="entfernen"
                      className="absolute -top-2 -right-2 rounded-full flex items-center justify-center"
                      style={{ width: 20, height: 20, background: "#fff", border: "1px solid #B7C3CF", color: C.ink, fontSize: 13, lineHeight: 1, cursor: "pointer" }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-2 min-h-[52px]">
            <button
              onClick={() => { if (bench.length && !snapping) setTool((t) => (t === "hammer" ? null : "hammer")); }}
              disabled={bench.length === 0 || snapping}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium select-none transition-all"
              style={{
                fontFamily: "ui-monospace, monospace",
                letterSpacing: "0.04em",
                background: bench.length === 0 || snapping ? "#C4D0DB" : C.ergeb,
                color: bench.length === 0 || snapping ? "#8595a4" : "#fff",
                cursor: bench.length === 0 || snapping ? "default" : "pointer",
                boxShadow: tool === "hammer" ? `inset 0 0 0 3px ${C.ink}` : bench.length === 0 || snapping ? "none" : "0 2px 0 rgba(0,0,0,0.18)",
              }}
            >
              <Hammer size={16} /> Hammer
            </button>
            <button
              onClick={() => { if (bench.length && !snapping) setTool((t) => (t === "clone" ? null : "clone")); }}
              disabled={bench.length === 0 || snapping}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium select-none transition-all"
              style={{
                fontFamily: "ui-monospace, monospace",
                letterSpacing: "0.04em",
                background: bench.length === 0 || snapping ? "#C4D0DB" : C.objekt,
                color: bench.length === 0 || snapping ? "#8595a4" : "#fff",
                cursor: bench.length === 0 || snapping ? "default" : "pointer",
                boxShadow: tool === "clone" ? `inset 0 0 0 3px ${C.ink}` : bench.length === 0 || snapping ? "none" : "0 2px 0 rgba(0,0,0,0.18)",
              }}
            >
              <CopyPlus size={16} /> Klon
            </button>
            <p className="text-xs" style={{ color: hint ? C.anford : "#8595a4" }}>
              {hint || (tool === "hammer" ? "Auf eine Verknüpfung tippen, um sie zu bauen. (Nochmal Hammer = abbrechen)"
                : tool === "clone" ? "Auf ein Objekt tippen, um es zu verdoppeln. (Nochmal Klon = abbrechen)"
                : "Bausteine nah zusammenschieben → Verknüpfung · dann Werkzeug wählen und aufs Objekt tippen.")}
            </p>
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
            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span style={{ fontFamily: "Georgia, serif", color: C.ergeb }} className="text-lg font-semibold">
                  {RESULTS[flash].name}
                </span>
                <span className="text-sm text-slate-600">{RESULTS[flash].sub}</span>
                <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[11px] text-slate-400">
                  {RESULTS[flash].ref}
                </span>
              </div>
              <p className="text-sm text-slate-700 mt-1">{RESULTS[flash].note}</p>
              {RESULTS[flash].claim && (
                <p className="text-sm mt-2" style={{ fontFamily: "Georgia, serif" }}>
                  <span style={{ fontFamily: "ui-monospace, monospace" }} className="text-[10px] uppercase tracking-wider text-slate-500 mr-1.5">Zu zeigen</span>
                  {RESULTS[flash].claim}
                </p>
              )}
              {RESULTS[flash].chainable && (
                <p className="text-xs mt-1" style={{ color: C.objekt }}>
                  → steht jetzt als Baustein bereit.
                </p>
              )}
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
                <Shelf title="Träger" role="objekt" ids={trager} onDrag={startDrag} collapsed={!!collapsed.objekt} onToggle={() => toggle("objekt")} />
                <Shelf title="Verknüpfungen" role="verknuepfung" ids={verkn} onDrag={startDrag} collapsed={!!collapsed.verknuepfung} onToggle={() => toggle("verknuepfung")} />
                <Shelf title="Zutaten" role="anforderung" ids={zutaten} onDrag={startDrag} collapsed={!!collapsed.anforderung} onToggle={() => toggle("anforderung")} />
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
                        <PaletteTile key={`base-${id}`} block={RESULTS[id]} onDrag={startDrag} draggable />
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
              {/* kettbare Ergebnisse: ziehbar */}
              {chainBlocks.map((id) => (
                <PaletteTile key={id} block={RESULTS[id]} onDrag={startDrag} draggable />
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

      {/* Drag-Overlay: nur beim Ziehen eines Vorrat-Bausteins */}
      {drag && drag.kind === "palette" && (
        <div style={{ position: "fixed", left: drag.x, top: drag.y, transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 50 }}>
          <TileFace block={resolve(drag.id)} lifted />
        </div>
      )}
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
            Startpunkt — antippen zum Hinzufügen
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
          Diese Bausteine brauchst du noch — antippen zum Hinzufügen
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
        <p className="text-xs text-slate-500 mt-2">
          Tipp einen Baustein an, um ihn auf die Werkbank zu legen. Manche brauchst du vielleicht mehrfach.
        </p>
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

function Shelf({ title, role, ids, onDrag, collapsed, onToggle }) {
  return (
    <div>
      <ShelfHead title={title} role={role} collapsible collapsed={collapsed} onToggle={onToggle} />
      {!collapsed && (
        <div className="flex flex-col gap-2">
          {ids.map((id) => (
            <PaletteTile key={id} block={BLOCKS[id]} onDrag={onDrag} draggable />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Kachel im Vorrat (ziehbar) -------------------------------------
function PaletteTile({ block, onDrag, disabled, draggable }) {
  return (
    <div
      onPointerDown={draggable && !disabled ? (e) => onDrag(e, block.id) : undefined}
      style={{
        touchAction: "none",
        opacity: disabled ? 0.35 : 1,
        cursor: draggable && !disabled ? "grab" : "default",
      }}
    >
      <TileFace block={block} />
    </div>
  );
}

// --- Kachel auf der Werkbank ----------------------------------------
// --- Gemeinsame Kachel-Optik ----------------------------------------
function TileFace({ block, lifted }) {
  const r = ROLE[block.role];
  return (
    <div
      style={{
        background: `linear-gradient(160deg, ${r.hi}, ${r.fill})`,
        color: "#fff",
        borderRadius: 12,
        padding: "10px 14px",
        minWidth: 140,
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
