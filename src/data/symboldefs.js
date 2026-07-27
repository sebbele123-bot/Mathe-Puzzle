/* ====================================================================
 *  Symbol-Aufgaben für die Werkbank
 *  Eine Definition wird aus ihren definierenden Symbol-Bausteinen
 *  zusammengesetzt (Reihenfolge egal, Menge muss stimmen).
 *  `need` = nötige Symbol-ids, `distract` = verführerische Zusätze.
 * ==================================================================== */

// Neue Bauaufgabe? Sie braucht eine Schwierigkeit (1–10) in
// `data/schwierigkeit.js` — entweder in SCHWIERIGKEIT bewertet oder
// ausdrücklich in SCHAETZUNG_OK. Sonst schlägt schwierigkeit.test.jsx fehl.
export const SYMBOL_TASKS = [
  {
    id: "s_halbgruppe", term: "Halbgruppe", ref: "Grundlagen (Algebra)",
    need: ["Axiom.abgeschlossen", "Axiom.assoziativ"],
    distract: ["Axiom.neutrales_element", "Axiom.kommutativ"],
    beschreibung: "Eine Halbgruppe ist eine Menge mit einer abgeschlossenen, assoziativen Verknüpfung.",
  },
  {
    id: "s_monoid", term: "Monoid", ref: "Grundlagen (Algebra)",
    need: ["Struktur.halbgruppe", "Axiom.neutrales_element"],
    distract: ["Axiom.inverses_element", "Axiom.kommutativ"],
    beschreibung: "Ein Monoid ist eine Halbgruppe mit neutralem Element.",
  },
  {
    id: "s_gruppe", term: "Gruppe", ref: "Grundlagen (Algebra)",
    need: ["Struktur.monoid", "Axiom.inverses_element"],
    distract: ["Axiom.kommutativ", "Axiom.distributiv"],
    beschreibung: "Eine Gruppe ist ein Monoid, in dem jedes Element ein Inverses besitzt.",
  },
  {
    id: "s_abelsch", term: "Abelsche Gruppe", ref: "Grundlagen (Algebra)",
    need: ["Struktur.gruppe", "Axiom.kommutativ"],
    distract: ["Axiom.distributiv", "Axiom.idempotent"],
    beschreibung: "Eine abelsche Gruppe ist eine Gruppe mit kommutativer Verknüpfung.",
  },
  {
    id: "s_ring", term: "Ring", ref: "Grundlagen (Algebra)",
    need: ["Struktur.abelsche_gruppe", "Struktur.halbgruppe", "Axiom.distributiv"],
    distract: ["Axiom.inverses_element", "Struktur.koerper"],
    beschreibung: "Ein Ring ist eine abelsche Gruppe (+) mit einer zweiten, assoziativen Verknüpfung und Distributivgesetz.",
  },
  {
    id: "s_koerper", term: "Körper", ref: "Grundlagen (Algebra)",
    need: ["Struktur.ring", "Axiom.kommutativ", "Axiom.inverses_element"],
    distract: ["Axiom.idempotent", "Struktur.vektorraum"],
    beschreibung: "Ein Körper ist ein kommutativer Ring, in dem jedes Element ungleich 0 multiplikativ invertierbar ist.",
  },
  {
    id: "s_vektorraum", term: "Vektorraum", ref: "Grundlagen (LA)",
    need: ["Struktur.abelsche_gruppe", "Struktur.koerper", "arith1.times"],
    distract: ["Struktur.ring", "LinAlg.dimension"],
    beschreibung: "Ein Vektorraum ist eine abelsche Gruppe mit Skalarmultiplikation über einem Körper.",
  },
  {
    id: "s_untervr", term: "Untervektorraum", ref: "Grundlagen (LA)",
    need: ["Struktur.vektorraum", "Mengen.subset_c"],
    distract: ["LinAlg.direct_sum", "LinAlg.span"],
    beschreibung: "Ein Untervektorraum ist eine Teilmenge eines Vektorraums, die selbst ein Vektorraum ist.",
  },
  {
    id: "s_skalarprodukt", term: "Skalarprodukt", ref: "Def 1",
    need: ["Abb.bilinear", "Axiom.kommutativ", "setname1.R"],
    distract: ["Abb.linear", "linalg1.vectorproduct"],
    beschreibung: "Ein Skalarprodukt ist eine symmetrische, positiv definite Bilinearform mit Werten in ℝ.",
  },
  {
    id: "s_skpraum", term: "Skalarproduktraum", ref: "Grundlagen (LA)",
    need: ["Struktur.vektorraum", "linalg1.scalarproduct"],
    distract: ["LinAlg.norm", "Struktur.koerper"],
    beschreibung: "Ein Skalarproduktraum ist ein Vektorraum zusammen mit einem Skalarprodukt.",
  },
  {
    id: "s_isometrie", term: "Isometrie", ref: "Def 18",
    need: ["Abb.bijektiv", "LinAlg.norm"],
    distract: ["Abb.linear", "Geom.aehnlich"],
    beschreibung: "Eine Isometrie ist eine bijektive, abstandserhaltende Abbildung.",
  },
  {
    id: "s_affraum", term: "Affiner Raum", ref: "Def 5",
    need: ["Struktur.vektorraum", "Geom.translation"],
    distract: ["Geom.drehung", "LinAlg.dimension"],
    beschreibung: "Ein affiner Raum ist eine Punktmenge, auf der der Richtungsraum einfach transitiv durch Translationen wirkt.",
  },
  {
    id: "s_kongebene", term: "Kongruenzebene", ref: "Def 17",
    need: ["Struktur.affiner_raum", "Geom.isometrie", "LinAlg.dimension"],
    distract: ["Geom.aehnlich", "Struktur.projektive_ebene"],
    beschreibung: "Eine Kongruenzebene ist ein zweidimensionaler affiner Raum mit einer Gruppe von Kongruenzen.",
  },
  {
    id: "s_aehnlichkeit", term: "Ähnlichkeit", ref: "Def 19",
    need: ["Geom.aehnlich", "Abb.bijektiv"],
    distract: ["Geom.kongruent", "Geom.spiegelung"],
    beschreibung: "Eine Ähnlichkeit ist eine bijektive Abbildung, die alle Längen um denselben Faktor streckt.",
  },
  {
    id: "s_projebene", term: "Projektive Ebene", ref: "Def 29",
    need: ["Struktur.vektorraum", "Struktur.projektive_ebene", "LinAlg.dimension"],
    distract: ["Struktur.affiner_raum", "Mengen.disjoint_union"],
    beschreibung: "Die projektive Ebene besteht aus den eindimensionalen Teilräumen eines dreidimensionalen Vektorraums.",
  },
];

export const SYMBOL_TASK_BY_ID = Object.fromEntries(SYMBOL_TASKS.map((t) => [t.id, t]));
