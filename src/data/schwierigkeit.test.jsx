/* Jede Übung braucht eine Schwierigkeit — und zwar bewusst vergeben.
 * Läuft unter Vitest, weil der Katalog über StrukturBaukasten.jsx eine
 * JSX-Datei hereinzieht. */
import { describe, it, expect } from "vitest";
import { CATALOG, CATALOG_BY_ID } from "./catalog.js";
import { istUebbar, kannBauen } from "./karten.js";
import { SCHWIERIGKEIT, SCHAETZUNG_OK, MIN, MAX } from "./schwierigkeit.js";
import { QUIZ } from "./quiz.js";

const bauaufgaben = CATALOG.filter((c) => istUebbar(c) && kannBauen(c));

describe("Schwierigkeit — Vollständigkeit", () => {
  // Der eigentliche Wächter: eine neu eingebaute Aufgabe steht in keiner
  // der beiden Listen und bringt diesen Test zu Fall. Damit ist die
  // Bewertung keine Sache des Erinnerns mehr.
  it("jede Bauaufgabe ist bewertet oder nimmt die Schätzung ausdrücklich an", () => {
    const offen = bauaufgaben
      .filter((c) => SCHWIERIGKEIT[c.id] == null && !SCHAETZUNG_OK.has(c.id))
      .map((c) => `${c.id} (${c.code} ${c.titel})`);
    expect(offen).toEqual([]);
  });

  it("jede Quizfrage trägt eine Schwierigkeit in 1–10", () => {
    const schlecht = [];
    for (const [id, fragen] of Object.entries(QUIZ))
      fragen.forEach((f, i) => {
        if (!Number.isFinite(f.schwierigkeit)) schlecht.push(`${id}[${i}] ohne Schwierigkeit`);
        else if (f.schwierigkeit < MIN || f.schwierigkeit > MAX)
          schlecht.push(`${id}[${i}] = ${f.schwierigkeit} außerhalb 1–10`);
      });
    expect(schlecht).toEqual([]);
  });
});

describe("Schwierigkeit — Sauberkeit der Listen", () => {
  it("bewertet keine Karte doppelt", () => {
    const doppelt = Object.keys(SCHWIERIGKEIT).filter((id) => SCHAETZUNG_OK.has(id));
    expect(doppelt).toEqual([]);
  });

  it("verweist nur auf Karten, die es gibt", () => {
    const unbekannt = [...Object.keys(SCHWIERIGKEIT), ...SCHAETZUNG_OK]
      .filter((id) => !CATALOG_BY_ID[id]);
    expect(unbekannt).toEqual([]);
  });

  it("bewertet nur Aufgaben, die man auch bauen kann", () => {
    const daneben = [...Object.keys(SCHWIERIGKEIT), ...SCHAETZUNG_OK]
      .filter((id) => CATALOG_BY_ID[id] && !kannBauen(CATALOG_BY_ID[id]));
    expect(daneben).toEqual([]);
  });

  it("hält alle Handbewertungen in 1–10", () => {
    const daneben = Object.entries(SCHWIERIGKEIT)
      .filter(([, s]) => !Number.isInteger(s) || s < MIN || s > MAX)
      .map(([id, s]) => `${id} = ${s}`);
    expect(daneben).toEqual([]);
  });
});

describe("Schwierigkeit — Stimmigkeit entlang der Kette", () => {
  // Was auf etwas anderem aufbaut, darf nicht leichter bewertet sein.
  // Prüfbar dort, wo die Abhängigkeit in den Daten steht: die
  // Symbol-Aufgaben bilden die Kette Halbgruppe → Monoid → … → Körper.
  const KETTE = [
    ["sym:s_halbgruppe", "sym:s_monoid"],
    ["sym:s_monoid", "sym:s_gruppe"],
    ["sym:s_gruppe", "sym:s_abelsch"],
    ["sym:s_abelsch", "sym:s_ring"],
    ["sym:s_ring", "sym:s_koerper"],
    ["sym:s_koerper", "sym:s_vektorraum"],
    ["sym:s_vektorraum", "sym:s_untervr"],
    ["sym:s_vektorraum", "sym:s_skpraum"],
    ["sym:s_vektorraum", "sym:s_affraum"],
    ["sym:s_affraum", "sym:s_kongebene"],
  ];

  it("baut eine Aufgabe auf einer anderen auf, ist sie nicht leichter", () => {
    const verdreht = KETTE
      .filter(([a, b]) => SCHWIERIGKEIT[a] != null && SCHWIERIGKEIT[b] != null)
      .filter(([a, b]) => SCHWIERIGKEIT[a] > SCHWIERIGKEIT[b])
      .map(([a, b]) => `${a}(${SCHWIERIGKEIT[a]}) > ${b}(${SCHWIERIGKEIT[b]})`);
    expect(verdreht).toEqual([]);
  });

  it("prüft die Kette wirklich gegen vorhandene Bewertungen", () => {
    const bewertet = KETTE.filter(([a, b]) => SCHWIERIGKEIT[a] != null && SCHWIERIGKEIT[b] != null);
    expect(bewertet.length).toBe(KETTE.length);
  });
});
