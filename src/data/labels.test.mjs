/* ====================================================================
 *  Etiketten-Logik (labels.js) — reine Funktionen, ohne DOM.
 *  Deckt v. a. nextHandLabel ab: die aus Inventory.jsx herausgezogene
 *  Tastendruck→Etikett-Entscheidung (Groß/Klein-Übernahme, doppelter
 *  Buchstabe → griechisch innerhalb des Zeitfensters).
 *  Lauf: node src/data/labels.test.mjs
 * ==================================================================== */
import {
  isRenamable, defaultLabel, glyphWithLabel, greekFor, nextHandLabel, DOUBLE_MS,
} from "./labels.js";

let pass = 0, fail = 0;
const t = (name, cond, info = "") => { cond ? pass++ : fail++; console.log(`${cond ? "ok  " : "FAIL"} ${name}${info ? "  " + info : ""}`); };

// --- isRenamable / defaultLabel ---------------------------------------
t("renamable erkannt", isRenamable("Var.gruppe") && isRenamable("Struktur.halbgruppe"));
t("nicht-renamable → false", !isRenamable("arith1.plus") && !isRenamable("nope"));
t("defaultLabel liefert def", defaultLabel("Var.gruppe") === "G" && defaultLabel("Var.abbildung") === "f");
t("defaultLabel unbekannt → null", defaultLabel("nope") === null);

// --- glyphWithLabel ---------------------------------------------------
{
  const abb = { id: "Var.abbildung", glyph: "f" };
  const hg = { id: "Struktur.halbgruppe", glyph: "(H,∘)" };
  const plain = { id: "arith1.plus", glyph: "+" };
  t("Platzhalter-tpl $ ersetzt", glyphWithLabel(abb, "g") === "g");
  t("Struktur-tpl setzt Buchstaben ein", glyphWithLabel(hg, "H") === "(H,∘)");
  t("Struktur-tpl mit anderem Buchstaben", glyphWithLabel(hg, "K") === "(K,∘)");
  t("ohne Etikett → glyph", glyphWithLabel(abb, null) === "f");
  t("nicht renamable → glyph unverändert", glyphWithLabel(plain, "X") === "+");
  t("kein Symbol → leerer String", glyphWithLabel(null, "X") === "");
}

// --- greekFor ---------------------------------------------------------
t("greekFor f → φ, w → ω", greekFor("f") === "φ" && greekFor("w") === "ω");
t("greekFor Großbuchstabe wird gemappt", greekFor("Q") === "θ");
t("greekFor ohne Pendant → null", greekFor("1") === null && greekFor("j") === null);

// --- nextHandLabel: Groß/Klein-Übernahme aus dem Standard -------------
{
  // Var.abbildung def "f" (klein) → Buchstabe klein
  const a = nextHandLabel("Var.abbildung", "G", { ch: null, at: 0 }, 1000);
  t("kleiner Standard → Buchstabe klein", a.label === "g", `= ${a.label}`);
  // Var.gruppe def "G" (groß) → Buchstabe groß (AGENTS-Beispiel G + h → H)
  const b = nextHandLabel("Var.gruppe", "h", { ch: null, at: 0 }, 1000);
  t("großer Standard → Buchstabe groß (G + h → H)", b.label === "H", `= ${b.label}`);
  const c = nextHandLabel("Struktur.halbgruppe", "k", { ch: null, at: 0 }, 1000);
  t("Struktur-Standard groß → K", c.label === "K", `= ${c.label}`);
  t("lastKey merkt sich den Buchstaben", a.lastKey.ch === "G" && a.lastKey.at === 1000);
}

// --- nextHandLabel: doppelter Buchstabe → griechisch ------------------
{
  // 'ff' innerhalb des Fensters → φ
  const first = nextHandLabel("Var.abbildung", "f", { ch: null, at: 0 }, 100);
  t("1. f → f", first.label === "f" && first.lastKey.ch === "f");
  const second = nextHandLabel("Var.abbildung", "f", first.lastKey, 100 + DOUBLE_MS - 1);
  t("2. f knapp im Fenster → φ", second.label === "φ", `= ${second.label}`);
  t("nach Greek: lastKey.ch = null", second.lastKey.ch === null);
  // dritter Druck (ch=null) darf nicht wieder griechisch werden
  const third = nextHandLabel("Var.abbildung", "f", second.lastKey, 100 + DOUBLE_MS);
  t("3. f → wieder f (kein erneutes Greek)", third.label === "f", `= ${third.label}`);

  // 'ww' → ω, auch bei großem Standard bleibt es das Greek-Zeichen
  const w1 = nextHandLabel("Var.gruppe", "w", { ch: null, at: 0 }, 0);
  const w2 = nextHandLabel("Var.gruppe", "w", w1.lastKey, 300);
  t("ww → ω (Greek schlägt Groß/Klein)", w2.label === "ω", `= ${w2.label}`);
}

// --- nextHandLabel: Fenster & Buchstabenwechsel ----------------------
{
  // zweiter f, aber außerhalb des Fensters → kein Greek
  const late = nextHandLabel("Var.abbildung", "f", { ch: "f", at: 0 }, DOUBLE_MS + 1);
  t("außerhalb des Fensters → kein Greek", late.label === "f" && late.lastKey.ch === "f");
  // anderer Buchstabe setzt zurück
  const diff = nextHandLabel("Var.abbildung", "g", { ch: "f", at: 0 }, 100);
  t("anderer Buchstabe → kein Greek", diff.label === "g" && diff.lastKey.ch === "g");
  // Groß/Klein zählt als „gleich" (prev 'F', key 'f')
  const caseSame = nextHandLabel("Var.abbildung", "f", { ch: "F", at: 0 }, 100);
  t("Groß/Klein-Variante zählt als gleicher Buchstabe → φ", caseSame.label === "φ", `= ${caseSame.label}`);
}

console.log(`\n${pass} ok, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
