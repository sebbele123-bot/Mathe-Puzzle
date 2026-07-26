/* ====================================================================
 *  Etiketten für umbenennbare Bausteine
 *  Ein Baustein trägt eine Rolle; der Buchstabe ist die Instanz.
 *  `tpl` ist die Anzeige-Vorlage, `$` wird durch das Etikett ersetzt.
 *  Geändert wird nur in der Hand — der Inventar-Baustein bleibt Standard.
 * ==================================================================== */

export const RENAMABLE = {
  // Platzhalter: der Buchstabe ist alles
  "Var.abbildung": { tpl: "$", def: "f" },
  "Var.vektor": { tpl: "$", def: "v" },
  "Var.punkt": { tpl: "$", def: "A" },
  "Var.menge": { tpl: "$", def: "M" },
  "Var.raum": { tpl: "$", def: "V" },
  "Var.skalar": { tpl: "$", def: "a" },
  "Var.gruppe": { tpl: "$", def: "G" },
  "Var.index": { tpl: "$", def: "n" },
  "Var.gerade": { tpl: "$", def: "g" },
  "Var.relation": { tpl: "$", def: "R" },

  // Strukturen: der Buchstabe steckt in der Schreibweise
  "Struktur.halbgruppe": { tpl: "($,∘)", def: "H" },
  "Struktur.monoid": { tpl: "($,∘,e)", def: "M" },
  "Struktur.gruppe": { tpl: "($,∘)", def: "G" },
  "Struktur.abelsche_gruppe": { tpl: "($,+)", def: "A" },
  "Struktur.ring": { tpl: "($,+,·)", def: "R" },
  "Struktur.koerper": { tpl: "($,+,·)", def: "K" },
  "Struktur.vektorraum": { tpl: "$", def: "V" },
  "Struktur.untervektorraum": { tpl: "$ ≤ V", def: "U" },
  "Struktur.skalarproduktraum": { tpl: "($,⟨·,·⟩)", def: "V" },
  "Struktur.affiner_raum": { tpl: "($,V)", def: "A" },
  "Struktur.kongruenzebene": { tpl: "($,K)", def: "E" },
  "Struktur.projektive_ebene": { tpl: "P($)", def: "V" },
};

export const isRenamable = (id) => !!RENAMABLE[id];
export const defaultLabel = (id) => RENAMABLE[id]?.def ?? null;

/** Anzeige-Zeichen eines Bausteins mit (optionalem) Etikett. */
export function glyphWithLabel(sym, label) {
  if (!sym) return "";
  const r = RENAMABLE[sym.id];
  if (!r || !label) return sym.glyph;
  return r.tpl.replace("$", label);
}

// Lateinisch → griechisch (Buchstabe zweimal tippen)
export const GREEK = {
  a: "α", b: "β", g: "γ", d: "δ", e: "ε", z: "ζ", h: "η", q: "θ", i: "ι",
  k: "κ", l: "λ", m: "μ", n: "ν", x: "ξ", o: "ο", p: "π", r: "ρ", s: "σ",
  t: "τ", u: "υ", f: "φ", c: "χ", y: "ψ", w: "ω",
};
export const greekFor = (ch) => GREEK[String(ch).toLowerCase()] || null;
