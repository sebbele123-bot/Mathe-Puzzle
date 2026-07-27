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
