/* Katalog-Integrität. Läuft unter Vitest (nicht als Node-Skript), weil
 * catalog.js über StrukturBaukasten.jsx eine JSX-Datei hereinzieht.
 * Prüft die Achsen, auf denen die Bibliothek filtert und sortiert. */
import { describe, it, expect } from "vitest";
import {
  CATALOG, CATALOG_BY_ID, CATALOG_SORTED, ALL_TAGS, countBy,
  FAECHER, TYPEN, RUBRIKEN,
} from "./catalog.js";

const FACH_IDS = new Set(FAECHER.map((f) => f.id));
const TYP_IDS = new Set(TYPEN.map((t) => t.id));
const RUBRIK_IDS = new Set(RUBRIKEN.map((r) => r.id));
const MODES = new Set(["definition", "beweis", "steckbrief", "werkbank"]);

describe("CATALOG", () => {
  it("ist nicht leer und hat eindeutige ids", () => {
    expect(CATALOG.length).toBeGreaterThan(50);
    expect(new Set(CATALOG.map((c) => c.id)).size).toBe(CATALOG.length);
  });

  it("hält sich an die Achsen Fach / Typ / Rubrik", () => {
    const bad = CATALOG.filter(
      (c) => !FACH_IDS.has(c.fach) || !TYP_IDS.has(c.typ) || !RUBRIK_IDS.has(c.rubrik)
    );
    expect(bad.map((c) => `${c.id}: ${c.fach}/${c.typ}/${c.rubrik}`)).toEqual([]);
  });

  it("kann jeden Eintrag öffnen (mode + targetId + Titel)", () => {
    const bad = CATALOG.filter((c) => !MODES.has(c.mode) || !c.targetId || !c.titel);
    expect(bad.map((c) => c.id)).toEqual([]);
  });

  it("führt jede id in CATALOG_BY_ID", () => {
    expect(Object.keys(CATALOG_BY_ID)).toHaveLength(CATALOG.length);
    for (const c of CATALOG) expect(CATALOG_BY_ID[c.id]).toBe(c);
  });

  it("sortiert vollständig nach Kapitel, dann Nummer", () => {
    expect(CATALOG_SORTED).toHaveLength(CATALOG.length);
    for (let i = 1; i < CATALOG_SORTED.length; i++) {
      const a = CATALOG_SORTED[i - 1], b = CATALOG_SORTED[i];
      expect(a.kap < b.kap || (a.kap === b.kap && a.nr <= b.nr)).toBe(true);
    }
  });

  it("sammelt Tags eindeutig und alphabetisch", () => {
    expect(new Set(ALL_TAGS).size).toBe(ALL_TAGS.length);
    expect([...ALL_TAGS]).toEqual([...ALL_TAGS].sort((a, b) => a.localeCompare(b)));
  });

  it("zählt je Fach vollständig ab", () => {
    const counts = countBy("fach");
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(CATALOG.length);
  });

  it("erzeugt die vier Quellen mit ihren id-Präfixen", () => {
    for (const prefix of ["def:", "proof:", "defcard:", "sym:"]) {
      expect(CATALOG.some((c) => c.id.startsWith(prefix))).toBe(true);
    }
  });
});
