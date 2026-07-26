/* ====================================================================
 *  Katalog-Metadaten aus Titeln ableiten
 *  Bewusst frei von JSX-Importen: `catalog.js` zieht `StrukturBaukasten.jsx`
 *  herein und ist damit für Node nicht ladbar — diese reinen
 *  String-Heuristiken sollen aber testbar bleiben.
 * ==================================================================== */

// "Ü5.2 — …"  ->  { code:"Ü5.2", kap:5, nr:2, quelle:"Blatt 5", name:"…" }
// "L4 · Ü2.1 — …" -> Kürzel L-Nummer, Übung, Blatt
export const parseTitle = (raw) => {
  let s = raw;
  // Bauschema-Lektionen: "A · Def 9 — Strahl" / "B · Def 17 — Kongruenzebene"
  const sm = s.match(/^([AB])\s*·\s*Def\s*(\d+)\s*—\s*/);
  if (sm) {
    return { code: `Def ${sm[2]}`, kap: 200 + (sm[1] === "A" ? 0 : 1), nr: Number(sm[2]),
      quelle: `Bauschema ${sm[1]} — aus Elementarteilen`, name: s.slice(sm[0].length), lektion: null };
  }
  let lektion = null;
  const lm = s.match(/^L(\d+)\s*·\s*/);
  if (lm) { lektion = `L${lm[1]}`; s = s.slice(lm[0].length); }
  const cm = s.match(/^Ü(\d+)\.(\d+)\s*—\s*/);
  if (cm) {
    return { code: `Ü${cm[1]}.${cm[2]}`, kap: Number(cm[1]), nr: Number(cm[2]),
      quelle: `Blatt ${cm[1]}`, name: s.slice(cm[0].length), lektion };
  }
  const bm = s.match(/^Blatt\s*(\d+)\s*—\s*/);
  if (bm) return { code: `Blatt ${bm[1]}`, kap: Number(bm[1]), nr: 0, quelle: `Blatt ${bm[1]}`, name: s.slice(bm[0].length), lektion };
  // ohne Übungskürzel (z. B. Grundlagen)
  const dash = s.indexOf(" — ");
  const name = dash >= 0 ? s.slice(dash + 3) : s;
  return { code: lektion || "Basis", kap: -1, nr: 0, quelle: lektion ? "Grundlagen" : "Grundlagen", name, lektion };
};

// simple Stichwort-Tags aus dem Namen (klein halten, nur grobe Themen)
export const TAG_HINTS = [
  ["Fixpunkt", "Fixpunkt"], ["Ähnlichkeit", "Ähnlichkeit"], ["Drehung", "Drehung"],
  ["Drehspiegel", "Drehspiegelung"], ["Spiegel", "Spiegelung"], ["Kreis", "Kreis"],
  ["Kongruenz", "Kongruenz"], ["Gruppe", "Gruppe"], ["Körper", "Körper"],
  ["Vektorraum", "Vektorraum"], ["projektiv", "Projektion"], ["Projektion", "Projektion"],
  ["Cosinus", "Trigonometrie"], ["Möbius", "Möbius"], ["hyperbol", "Hyperbolisch"],
  ["Fläche", "Flächeninhalt"], ["Länge", "Metrik"], ["Neutral", "Gruppenaxiome"],
];
export const tagsFor = (name) => {
  const t = [];
  for (const [needle, tag] of TAG_HINTS) if (name.includes(needle) && !t.includes(tag)) t.push(tag);
  return t;
};

// Neutralelement ist ein reiner Algebra-Grundbaustein, der Rest ist ElGeo.
export const fachFor = (name, code) => (name.includes("Neutralelement") || code.startsWith("Basis") ? "algebra" : "elgeo");

// Symbol-Aufgaben: nur ein `ref` der Form "Def 3.1" gilt als ElGeo.
// (Stolperstelle beim Autorieren — daher als eigene Funktion testbar.)
export const fachForSymbolRef = (ref) => (/Def \d/.test(ref) ? "elgeo" : "algebra");
