/* ====================================================================
 *  Bibliothek-Katalog
 *  Ein einheitliches Verzeichnis über alles Material: Definitionen,
 *  Beweise (und später Aufgaben) aus verschiedenen Fächern.
 *
 *  Jeder Eintrag hat dieselben Metadaten, damit jede Ansicht nur ein
 *  Filter über EINE Liste ist:
 *    { id, fach, quelle, typ, nummer, titel, tags, mode, targetId }
 *  - mode/targetId sagen der App, welche Ansicht sie öffnen und welche
 *    Mission sie dort laden soll.
 *
 *  Neues Material (Stochastik, Algebra …) einfach hier ergänzen —
 *  die Bibliothek zeigt es automatisch mit Filtern an.
 * ==================================================================== */

import { MISSIONS as PROOF_MISSIONS } from "../proof/data.js";
import { MISSIONS as DEF_LESSONS } from "../StrukturBaukasten.jsx";
import { DEFINITIONS } from "./definitions.js";
import { SYMBOL_TASKS } from "./symboldefs.js";

// Fächer und Typen als feste Achsen (Reihenfolge = Anzeige-Reihenfolge)
export const FAECHER = [
  { id: "elgeo", label: "Elementargeometrie", color: "#1F7A63" },
  { id: "algebra", label: "Algebra", color: "#31597F" },
  { id: "stochastik", label: "Stochastik", color: "#B26A1E" },
];
export const TYPEN = [
  { id: "definition", label: "Definition", color: "#6B4E9E" },
  { id: "beweis", label: "Beweis", color: "#1F7A63" },
  { id: "aufgabe", label: "Aufgabe", color: "#B26A1E" },
  { id: "satz", label: "Satz", color: "#31597F" },
];
export const FACH_LABEL = Object.fromEntries(FAECHER.map((f) => [f.id, f.label]));
export const FACH_COLOR = Object.fromEntries(FAECHER.map((f) => [f.id, f.color]));
export const TYP_LABEL = Object.fromEntries(TYPEN.map((t) => [t.id, t.label]));
export const TYP_COLOR = Object.fromEntries(TYPEN.map((t) => [t.id, t.color]));

// --- Hilfen zum Ableiten der Metadaten aus den vorhandenen Titeln -----
// Die reinen String-Heuristiken liegen in catalogMeta.js, damit sie ohne
// den JSX-Import dieser Datei getestet werden können.
import { parseTitle, tagsFor, fachFor, fachForSymbolRef } from "./catalogMeta.js";
export { parseTitle, tagsFor, fachFor, fachForSymbolRef, TAG_HINTS } from "./catalogMeta.js";

// Rubriken innerhalb eines Fachs (ausklappbare Abschnitte)
export const RUBRIKEN = [
  { id: "definitionen", label: "Definitionen" },
  { id: "saetze", label: "Sätze" },
  { id: "uebungsblaetter", label: "Übungsblätter" },
];

// --- Katalog aus den vorhandenen Missionen bauen ----------------------
const defItems = DEF_LESSONS.map((m) => {
  const p = parseTitle(m.task);
  return {
    id: `def:${m.id}`, mode: "definition", targetId: m.id,
    typ: "definition", fach: fachFor(p.name, p.code),
    // Bauschema-Lektionen sind Definitionen; die L-Lektionen sind Übungsblatt-Konstruktionen
    rubrik: p.quelle.startsWith("Bauschema") ? "definitionen" : "uebungsblaetter",
    code: p.code, kap: p.kap, nr: p.nr, quelle: p.quelle,
    titel: p.name, lektion: p.lektion, tags: tagsFor(p.name),
  };
});

const proofItems = PROOF_MISSIONS.map((m) => {
  const p = parseTitle(m.title);
  return {
    id: `proof:${m.id}`, mode: "beweis", targetId: m.id,
    typ: "beweis", fach: fachFor(p.name, p.code), rubrik: "saetze",
    code: p.code, kap: p.kap, nr: p.nr, quelle: p.quelle,
    titel: p.name, lektion: null, hatBegriffscheck: !!m.vocab, tags: tagsFor(p.name),
  };
});

// Kern-Definitionen als Steckbrief-Karten (öffnen in der Steckbrief-Ansicht)
const defCards = DEFINITIONS.map((d) => ({
  id: `defcard:${d.id}`, mode: "steckbrief", targetId: d.id,
  typ: "definition", fach: "elgeo", rubrik: "definitionen",
  code: `D${d.nr}`, kap: 100 + d.t, nr: d.nr,
  quelle: `Definitionen · ${d.thema}`,
  titel: d.term, lektion: null, tags: d.tags,
}));

// Symbol-Aufgaben: Definition in der Werkbank aus Symbol-Bausteinen bauen
const symbolItems = SYMBOL_TASKS.map((t, i) => ({
  id: `sym:${t.id}`, mode: "werkbank", targetId: t.id,
  typ: "definition", fach: fachForSymbolRef(t.ref),
  rubrik: "definitionen",
  code: "⊕", kap: 300, nr: i,
  quelle: "Symbol-Aufgaben · Werkbank",
  titel: t.term, lektion: null, tags: tagsFor(t.term),
}));

export const CATALOG = [...defItems, ...proofItems, ...defCards, ...symbolItems];
export const CATALOG_BY_ID = Object.fromEntries(CATALOG.map((c) => [c.id, c]));

// nach Kapitel/Nummer sortiert (Grundlagen mit kap=-1 zuerst)
export const CATALOG_SORTED = [...CATALOG].sort(
  (a, b) => a.kap - b.kap || a.nr - b.nr || a.titel.localeCompare(b.titel)
);

// alle vorkommenden Tags (für die Tag-Leiste)
export const ALL_TAGS = [...new Set(CATALOG.flatMap((c) => c.tags))].sort((a, b) => a.localeCompare(b));

// Zählungen je Fach / Typ (für Chip-Badges)
export const countBy = (key) =>
  CATALOG.reduce((acc, c) => ((acc[c[key]] = (acc[c[key]] || 0) + 1), acc), {});

// --- Rotation (kuratierte Übungsauswahl) im localStorage --------------
const ROT_KEY = "mp_rotation_v1";
export const loadRotation = () => {
  try {
    const r = JSON.parse(localStorage.getItem(ROT_KEY) || "[]");
    return Array.isArray(r) ? r : [];
  } catch { return []; }
};
export const saveRotation = (ids) => {
  try { localStorage.setItem(ROT_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
};
