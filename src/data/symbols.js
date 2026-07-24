/* Gemeinsame Symbol-Bausteinliste (für Inventar und Werkbank). */
import { PALETTE_CATEGORIES, DE } from "./openmath.js";
import { CAT_COLOR } from "../OpenMathPalette.jsx";

export const SYM_ALL = PALETTE_CATEGORIES.flatMap((c) =>
  c.symbols.map((s) => ({ ...s, id: `${s.cd}.${s.name}`, cat: c.id, color: CAT_COLOR[c.id] || "#31597F" }))
);
export const SYM_BY_ID = Object.fromEntries(SYM_ALL.map((s) => [s.id, s]));
export const symLabel = (s) => (s ? DE[s.id] || s.name : "");
