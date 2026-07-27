/* ====================================================================
 *  Schwierigkeit 1–10
 *  Jede Übung — eine Quizfrage oder ein Bauauftrag — trägt eine
 *  Schwierigkeit. Sie bestimmt die Erfahrungspunkte: je schwerer, desto
 *  mehr. Nur Bauen und Quiz zählen; die Auflösung ist Nachschlagen.
 *
 *  Eine von Hand vergebene Bewertung gilt immer. Fehlt sie, wird aus
 *  dem Umfang der Aufgabe eine geschätzt — das ist ein Notbehelf: bei
 *  Symbol-Aufgaben etwa liegt der Umfang praktisch konstant bei 4–5
 *  Bausteinen, obwohl Halbgruppe und Kongruenzebene weit auseinander
 *  liegen. Solche Karten gehören von Hand bewertet.
 * ==================================================================== */

export const MIN = 1;
export const MAX = 10;

/** Auf die Skala 1–10 begrenzen und runden. */
export const stufe = (x) =>
  Number.isFinite(x) ? Math.min(MAX, Math.max(MIN, Math.round(x))) : MIN;

// Anker für die Schätzung aus dem Umfang. Fest gewählt (nicht aus den
// aktuellen Daten abgeleitet), damit neue Inhalte die Skala nicht
// nachträglich verschieben.
export const ROH_MIN = 3;
export const ROH_MAX = 24;

/** Umfang einer Aufgabe → geschätzte Schwierigkeit auf einer Skala. */
export function geschaetzt(roh, min = ROH_MIN, max = ROH_MAX) {
  if (!Number.isFinite(roh)) return MIN;
  if (max <= min) return MIN;
  const anteil = (roh - min) / (max - min);
  return stufe(MIN + anteil * (MAX - MIN));
}

/* --------------------------------------------------------------------
 *  Maßstab. Ohne ihn driften Bewertungen zwischen Autoren auseinander.
 *  Gefragt ist der gedankliche Aufwand, nicht die Zahl der Klicks.
 *
 *   1–2  eine einzige Eigenschaft oder ein Fertigteil, nichts zu
 *        kombinieren.                      → Halbgruppe (1)
 *   3–4  zwei bis drei Zutaten, alle direkt genannt, kein
 *        Zwischenschritt.                  → Monoid (2), Ring (4)
 *   5–6  mehrere Zutaten mit einem Zwischenergebnis, oder ein Begriff,
 *        der auf zwei anderen aufbaut.     → Körper (5), Skalarproduktraum (6)
 *   7–8  Kette über mehrere Ebenen, oder ein Schritt, der eine Idee
 *        braucht.                          → Ähnlichkeit (7), Kongruenzebene (8)
 *  9–10  lange Kette mit mehreren Zwischenergebnissen, oder ein Beweis
 *        mit Widerspruch bzw. Fallunterscheidung.
 *
 *  Bei Quizfragen zählt, wie viel man wissen muss, um die falschen
 *  Antworten auszuschließen — nicht die Länge der Frage.
 * ------------------------------------------------------------------ */

/**
 * Von Hand vergebene Schwierigkeiten je Katalog-id.
 * Ergänzen, wo die Schätzung danebenliegt — der Eintrag gewinnt immer.
 */
export const SCHWIERIGKEIT = {
  // Symbol-Aufgaben: der Umfang sagt hier nichts, die Kette schon
  "sym:s_halbgruppe": 1,
  "sym:s_monoid": 2,
  "sym:s_gruppe": 2,
  "sym:s_abelsch": 3,
  "sym:s_ring": 4,
  "sym:s_koerper": 5,
  "sym:s_vektorraum": 5,
  "sym:s_untervr": 5,
  "sym:s_skalarprodukt": 5,
  "sym:s_skpraum": 6,
  "sym:s_isometrie": 6,
  "sym:s_affraum": 6,
  "sym:s_aehnlichkeit": 7,
  "sym:s_kongebene": 8,
  "sym:s_projebene": 8,
};

/**
 * Aufgaben, bei denen die Schätzung bewusst genügt.
 * Der Sinn dieser Liste ist nicht Bequemlichkeit, sondern Sichtbarkeit:
 * Wer eine neue Aufgabe einbaut, steht weder hier noch in SCHWIERIGKEIT
 * — und genau das lässt den Test fehlschlagen. Man muss sich also
 * entscheiden: bewerten oder die Schätzung ausdrücklich annehmen.
 *
 * Die folgenden Einträge stammen aus der Umstellung und sind noch
 * ungeprüft. Wer eine davon anfasst, bewertet sie nach dem Maßstab oben
 * und verschiebt sie nach SCHWIERIGKEIT.
 */
export const SCHAETZUNG_OK = new Set([
  "def:dA1",              // ~1  Def 1 Skalarprodukt
  "def:dA23",             // ~1  Def 23 Zwischenrelation
  "def:dA5",              // ~1  Def 5 Affiner Raum
  "def:dA8",              // ~1  Def 8 Flächeninhalt
  "def:dA9",              // ~1  Def 9 Strahl
  "def:dB19",             // ~1  Def 19 Ähnlichkeit
  "def:dB20",             // ~1  Def 20 Angeordnetes Dreieck
  "def:dB29",             // ~1  Def 29 Projektiver Raum
  "def:m44",              // ~1  Ü4.4 Flächeninhalt
  "def:dA22",             // ~2  Def 22 Inzidenzgeometrie
  "def:m10",              // ~2  Blatt 10 hyperbolische Ebene
  "def:m52",              // ~2  Ü5.2 Ähnlichkeiten
  "def:m53",              // ~2  Ü5.3 Dreispiegelungssatz
  "def:m81",              // ~2  L14 projektive Ebene
  "def:dA25",             // ~3  Def 25 Parallelenaxiom
  "def:dB18",             // ~3  Def 18 Euklidische Ebene
  "def:dB21",             // ~3  Def 21 Strecke & Zwischenrelation
  "def:dB6",              // ~3  Def 6 Affine Gerade
  "def:dB7",              // ~3  Def 7 Affinität
  "def:m11",              // ~3  Ü1.1 D auf ℂ
  "def:m22",              // ~3  L5 Rotationsgruppe
  "def:m54",              // ~3  Ü5.4 fasteukl. Geometrie
  "def:m63",              // ~3  Ü6.3 Kreisspiegelung
  "proof:p_inv61",        // ~3  Ü6.1 Kreisspiegelung
  "proof:p_neutral",      // ~3  Basis Neutralelement ist eindeutig
  "def:dA26",             // ~4  Def 26 Erweiterte Ebene
  "def:dB10",             // ~4  Def 10 Drehspiegelgruppe
  "def:dB15",             // ~4  Def 15 Halbraumfahne
  "def:dB2",              // ~4  Def 2 Orthogonale Gruppe
  "def:m01",              // ~4  Ü0.1 Drehspiegelgruppe
  "def:m13",              // ~4  Ü1.3 endliche Untergruppen
  "def:m224",             // ~4  L6 D_Z aus R
  "def:m31",              // ~4  Ü3.1 Längengerade
  "def:m71",              // ~4  Ü7.1 Möbiustransformationen
  "proof:p_proj83",       // ~4  Ü8.3 Zentralprojektion
  "proof:p_sqrt2",        // ~4  Ü2.1 O(ℚ²) ist keine Drehspiegelgruppe
  "def:dB16",             // ~5  Def 16 Rotationsgruppe
  "def:dB24",             // ~5  Def 24 Fasteuklidische Geometrie
  "def:dB3",              // ~5  Def 3 SO(Z,s)
  "proof:p_rot51",        // ~5  Ü5.1 Verkettung von Drehungen
  "def:dB27",             // ~6  Def 27 Kreisspiegelung
  "proof:p_cos41",        // ~6  Ü4.1 Cosinus-Satz
  "proof:p_fixpunkt",     // ~6  Ü5.2 Fixpunkt einer Ähnlichkeit
  "def:m00",              // ~7  L0 Körper & Vektorraum
  "def:dB17",             // ~10  Def 17 Kongruenzebene
  "def:m21",              // ~10  Ü2.1 Scheitern über ℚ
]);

/** Schwierigkeit einer Karte: Handbewertung, sonst die Schätzung. */
export const schwierigkeitFor = (catalogId, roh) =>
  SCHWIERIGKEIT[catalogId] ?? geschaetzt(roh);

/**
 * Schwierigkeit eines Quizdurchgangs: Summe der gestellten Fragen.
 * Jede Frage trägt ihre eigene Stufe bei — mehr Fragen bringen also mehr,
 * und schwerere mehr als leichte. Der Wert darf 10 überschreiten: die
 * Skala 1–10 gilt je Frage, nicht für den ganzen Durchgang.
 */
export function quizSchwierigkeit(fragen) {
  const werte = (fragen || []).map((f) => f.schwierigkeit).filter(Number.isFinite);
  if (!werte.length) return MIN;
  return Math.max(MIN, Math.round(werte.reduce((a, b) => a + b, 0)));
}
