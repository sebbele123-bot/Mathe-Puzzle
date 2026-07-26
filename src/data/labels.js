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

// Fenster (ms), in dem derselbe Buchstabe erneut getippt „griechisch" macht.
export const DOUBLE_MS = 700;

/**
 * Entscheidet das neue Hand-Etikett aus einem Tastendruck (reine Logik,
 * ohne DOM). Denselben Buchstaben zweimal innerhalb DOUBLE_MS → griechisch;
 * sonst der Buchstabe in der Schreibweise des Standard-Etiketts (Räume/
 * Gruppen groß, Abbildungen/Vektoren klein).
 * @param handId  id des Bausteins in der Hand (renamable vorausgesetzt)
 * @param key     getippter Buchstabe
 * @param prev    { ch, at } — letzter Tastendruck (ch=null ⇒ kein Vorgänger)
 * @param now     Zeitstempel (ms)
 * @returns { label, lastKey } — neues Etikett und der zu merkende Zustand
 */
export function nextHandLabel(handId, key, prev = { ch: null, at: 0 }, now = Date.now()) {
  const same = prev.ch && prev.ch.toLowerCase() === key.toLowerCase() && now - prev.at < DOUBLE_MS;
  const greek = same ? greekFor(key) : null;
  const def = defaultLabel(handId) || "";
  const upper = def && def === def.toUpperCase() && def !== def.toLowerCase();
  const label = greek || (upper ? key.toUpperCase() : key.toLowerCase());
  // nach einem Greek-Treffer ch=null: ein dritter Tastendruck startet neu
  return { label, lastKey: { ch: greek ? null : key, at: now } };
}
