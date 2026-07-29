/* ====================================================================
 *  Elementargeometrie — Kern-Definitionen (Soergel, SS 2026)
 *  Studierbare Steckbriefe: Begriff, Aussage, Übungsbezug, Tags.
 *  Gruppiert nach Themen; erscheinen in der Bibliothek als Definitionen.
 *  Reine Lesekarten — ohne Frage, darum nicht in der Rotation.
 * ==================================================================== */

export const DEF_THEMES = [
  "Lineare & affine Grundlagen",
  "Drehspiegelgruppen",
  "Kongruenzebenen",
  "Axiomatik",
  "Möbius, projektiv & hyperbolisch",
];

// nr = laufende Nummer (Badge Dn) · t = Themen-Index · uebung optional
const D = [
  // — Lineare & affine Grundlagen —
  { nr: 1, t: 0, term: "Skalarprodukt",
    statement: "s: symmetrische, positiv definite Bilinearform auf einem reellen Vektorraum.",
    tags: ["Skalarprodukt", "Bilinearform"] },
  { nr: 2, t: 0, term: "Orthogonale Gruppe", uebung: "Ü0.1",
    statement: "O(Z,s) = { g ∈ GL(Z) | s(gv,gw) = s(v,w) ∀ v,w }.",
    tags: ["Gruppe", "Orthogonal"] },
  { nr: 3, t: 0, term: "SO(Z,s) / SO(2)", uebung: "Ü0.2",
    statement: "Orthogonale Elemente mit det = 1 (Drehmatrizen). O(2) enthält zusätzlich die Spiegelungsmatrizen. SO(2) ist kommutativ, ≅ S¹.",
    tags: ["Gruppe", "Drehung"] },
  { nr: 4, t: 0, term: "Orientierung", uebung: "Ü1.4",
    statement: "Äquivalenzklasse angeordneter Basen (Basiswechsel mit det > 0). Orientierungserhaltend ⇔ det > 0.",
    tags: ["Orientierung"] },
  { nr: 5, t: 0, term: "Affiner Raum & Richtungsraum",
    statement: "E mit Richtungsraum E⃗: einfach transitive Operation von (E⃗,+) durch Translationen.",
    tags: ["Affin", "Translation"] },
  { nr: 6, t: 0, term: "Affine Gerade & Parallelität", uebung: "Ü0.4",
    statement: "Affine Gerade: p + ℝv (v ≠ 0). Parallel: gleicher Richtungsraum.",
    tags: ["Affin", "Gerade"] },
  { nr: 7, t: 0, term: "Affinität", uebung: "L9.1",
    statement: "Bijektion φ(p + v⃗) = φ(p) + φ⃗(v⃗) mit invertierbarem linearem Anteil φ⃗.",
    tags: ["Affin", "Abbildung"] },
  { nr: 8, t: 0, term: "Alternierende Bilinearform & Flächeninhalt", uebung: "Ü4.4",
    statement: "ω alternierend; Alt²(Z) eindimensional für dim Z = 2, ω(gv,gw) = det(g)·ω(v,w) — Basis des orientierten Flächeninhalts F.",
    tags: ["Bilinearform", "Flächeninhalt"] },

  // — Drehspiegelgruppen —
  { nr: 9, t: 1, term: "Strahl",
    statement: "A = ℝ≥0·v (v ≠ 0). Affin: Halbgerade [p,q⟩.",
    tags: ["Strahl"] },
  { nr: 10, t: 1, term: "Drehspiegelgruppe",
    statement: "(Z,D) mit D ⊂ GL(Z), Z zweidimensional, sodass es zu je zwei Strahlen A, B genau zwei Elemente d ∈ D mit d(A) = B gibt.",
    tags: ["Drehspiegelung", "Gruppe"] },
  { nr: 11, t: 1, term: "Spiegelung & Drehung", uebung: "Ü0.3 / 1.2",
    statement: "Zu jedem Strahl A halten genau zwei Elemente A fest — id und die Spiegelung zu A; Nichtspiegelungen heißen Drehungen. Es gilt rdr = d⁻¹, Drehungen kommutieren, D wird von Spiegelungen erzeugt.",
    tags: ["Spiegelung", "Drehung"] },
  { nr: 12, t: 1, term: "Drehspiegelverträglicher Isomorphismus", uebung: "Ü3.1 / 3.2",
    statement: "ψ: (Z,D) → (Y,C): linearer Isomorphismus mit ψ ∘ D ∘ ψ⁻¹ = C.",
    tags: ["Isomorphismus"] },
  { nr: 13, t: 1, term: "Längengerade & Länge", uebung: "Ü3.1",
    statement: "L_Z, ‖v‖_Z ∈ L_Z: eindimensionaler reeller VR mit positiver Hälfte, in der die (D-invarianten) Längen liegen. Skalarprodukt mit Werten in L_Z^⊗2.",
    tags: ["Länge", "Metrik"] },
  { nr: 14, t: 1, term: "Winkelgruppe, Winkel & Überlagerung", uebung: "Ü3.2 / 4.3",
    statement: "W, ∠(A,B), W̃: der Winkel kodiert die Lage des Strahlenpaars (Drehung, die A nach B führt). In W̃ ≅ (ℝ,+) sind Winkel addierbar (z. B. Winkelsumme (n−2)·180°).",
    tags: ["Winkel"] },
  { nr: 15, t: 1, term: "Halbraumfahne (dim 3)", uebung: "Ü2.2",
    statement: "(A,H) mit A = ℝ≥0v ⊂ H = ℝv + ℝ≥0w, v, w linear unabhängig.",
    tags: ["Fahne"] },
  { nr: 16, t: 1, term: "Rotationsgruppe (dim 3)", uebung: "Ü2.2",
    statement: "R ⊂ GL(E), dim E = 3: zu je zwei Halbraumfahnen genau ein überführendes r ∈ R. Resultat: R = SO(E,s).",
    tags: ["Rotation", "Gruppe"] },

  // — Kongruenzebenen —
  { nr: 17, t: 2, term: "Kongruenzebene", uebung: "Ü5.2",
    statement: "(E,K): zweidimensionaler reeller affiner Raum mit Gruppe K von „Kongruenzen“, die alle Translationen enthält und deren lineare Anteile eine Drehspiegelgruppe auf E⃗ bilden. Modell: ℂ mit z ↦ az+b, z ↦ az̄+b, |a| = 1.",
    tags: ["Kongruenz"] },
  { nr: 18, t: 2, term: "Euklidische Ebene",
    statement: "Kongruenzebene zu einem Skalarprodukt; Kongruenzen = Isometrien (abstandserhaltend).",
    tags: ["Euklidisch", "Isometrie"] },
  { nr: 19, t: 2, term: "Ähnlichkeit", uebung: "Ü5.2",
    statement: "Isomorphismus einer Kongruenzebene mit sich selbst; in ℂ: z ↦ az+b bzw. az̄+b mit a ≠ 0. Keine Kongruenz ⇒ genau ein Fixpunkt (Drehstreckung / Spiegelstreckung).",
    tags: ["Ähnlichkeit", "Fixpunkt"] },
  { nr: 20, t: 2, term: "Angeordnetes Dreieck & angeordnet kongruent", uebung: "Ü4.2",
    statement: "Dreieck (A,B,C); angeordnet kongruent: Kongruenz mit A↦A′, B↦B′, C↦C′. Notation a,b,c gegenüber α,β,γ.",
    tags: ["Dreieck", "Kongruenz"] },
  { nr: 21, t: 2, term: "Strecke & Zwischenrelation", uebung: "Ü5.4",
    statement: "Strecke [p,q], halboffenes Segment [p,q). Zwischenrelation: kollineare Tripel (x,y,z) mit ℝ≥0(x−y) ∩ ℝ≥0(z−y) = {0}.",
    tags: ["Strecke", "Zwischenrelation"] },

  // — Axiomatik —
  { nr: 22, t: 3, term: "Inzidenzgeometrie",
    statement: "Durch je zwei verschiedene Punkte genau eine Gerade; jede Gerade hat mindestens zwei Punkte.",
    tags: ["Axiom", "Inzidenz"] },
  { nr: 23, t: 3, term: "Zwischenrelation (axiomatisch)",
    statement: "Anordnungsaxiome inklusive Pasch-Axiom.",
    tags: ["Axiom", "Anordnung"] },
  { nr: 24, t: 3, term: "Fasteuklidische Geometrie", uebung: "L5.4",
    statement: "Inzidenzgeometrie + Zwischenrelation + Kongruenzen + Supremumseigenschaft.",
    tags: ["Axiom"] },
  { nr: 25, t: 3, term: "Parallelenaxiom", uebung: "Ü0.4 / 5.4",
    statement: "Zu g und p ∉ g genau eine Gerade h durch p mit h ∩ g = ∅.",
    tags: ["Axiom", "Parallelen"] },

  // — Möbius, projektiv & hyperbolisch —
  { nr: 26, t: 4, term: "Erweiterte Ebene & verallgemeinerter Kreis", uebung: "Ü6.2",
    statement: "Ê = E ⊔ {∞}. Verallgemeinerter Kreis: echter Kreis K(c;r) oder erweiterte Gerade ĝ = g ⊔ {∞}; analog verallgemeinerte Sphären in R̂.",
    tags: ["Möbius", "Kreis"] },
  { nr: 27, t: 4, term: "Kreisspiegelung / Inversion", uebung: "Ü6.1–6.3",
    statement: "s_L am Kreis K(c;r): x ↦ c + r²(x−c)/‖x−c‖², mit c ↔ ∞. An ĝ die gewöhnliche Spiegelung mit ∞ ↦ ∞.",
    tags: ["Inversion", "Kreis"] },
  { nr: 28, t: 4, term: "Möbiustransformation", uebung: "L7.1",
    statement: "Möb(Ê): von allen Inversionen erzeugte Gruppe. Charakterisierung: genau die Bijektionen, die verallgemeinerte Kreise auf verallgemeinerte Kreise abbilden.",
    tags: ["Möbius", "Gruppe"] },
  { nr: 29, t: 4, term: "Projektiver Raum, Vervollständigung & Kollineation", uebung: "Blatt 8/9",
    statement: "PV: eindimensionale Teilräume, P-Geraden = PW mit dim W = 2. Projektive Vervollständigung VE = E ⊔ P(E⃗) mit unendlich ferner Gerade. Kollineation = geradentreue Bijektion.",
    tags: ["Projektiv"] },
  { nr: 30, t: 4, term: "Poincaré-Halbebene", uebung: "Ü7.3/7.4 · Blatt 10",
    statement: "Obere Halbebene H; „Geraden“ = Schnitte mit H von verallgemeinerten Kreisen senkrecht auf ĝ. Kongruenzen = Einschränkungen von Möb_H(Ê), via SL(2,ℝ): z ↦ (az+b)/(cz+d).",
    tags: ["Hyperbolisch"] },
];

export const DEFINITIONS = D.map((d) => ({
  ...d,
  id: `d${String(d.nr).padStart(2, "0")}`,
  thema: DEF_THEMES[d.t],
}));

export const DEF_BY_ID = Object.fromEntries(DEFINITIONS.map((d) => [d.id, d]));
