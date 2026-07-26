/* ====================================================================
 *  Katalog-Heuristiken (catalogMeta.js)
 *  Fach, Rubrik und Sortierung der Bibliothek hängen an reinen
 *  String-Treffern im Titel — eine falsch geformte Überschrift landet
 *  daher stillschweigend im falschen Fach. Diese Tests halten das
 *  tatsächliche Verhalten fest.
 *  Lauf: node src/data/catalogMeta.test.mjs
 * ==================================================================== */
import { parseTitle, tagsFor, fachFor, fachForSymbolRef } from "./catalogMeta.js";

let pass = 0, fail = 0;
const t = (name, cond, info = "") => { cond ? pass++ : fail++; console.log(`${cond ? "ok  " : "FAIL"} ${name}${info ? "  " + info : ""}`); };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// --- parseTitle: Bauschema-Lektionen ----------------------------------
{
  const a = parseTitle("A · Def 9 — Strahl");
  t("Bauschema A: code/nr/name", a.code === "Def 9" && a.nr === 9 && a.name === "Strahl");
  t("Bauschema A: kap 200 (sortiert hinter den Blättern)", a.kap === 200);
  t("Bauschema A: Quelle", a.quelle === "Bauschema A — aus Elementarteilen");
  t("Bauschema A: keine Lektion", a.lektion === null);

  const b = parseTitle("B · Def 17 — Kongruenzebene");
  t("Bauschema B: kap 201 (nach A)", b.kap === 201, `= ${b.kap}`);
  t("Bauschema B: Quelle", b.quelle === "Bauschema B — aus Elementarteilen");
}

// --- parseTitle: Übungen mit und ohne Lektionskürzel -------------------
{
  const u = parseTitle("Ü5.2 — Fixpunkt einer Ähnlichkeit");
  t("Übung: code/kap/nr", u.code === "Ü5.2" && u.kap === 5 && u.nr === 2);
  t("Übung: Quelle = Blatt", u.quelle === "Blatt 5");
  t("Übung: Name ohne Kürzel", u.name === "Fixpunkt einer Ähnlichkeit");

  const l = parseTitle("L4 · Ü2.1 — Scheitern über ℚ");
  t("Lektion wird abgetrennt", l.lektion === "L4" && l.code === "Ü2.1");
  t("Lektion: kap/nr aus der Übung", l.kap === 2 && l.nr === 1);
  t("Lektion: Name ohne beide Kürzel", l.name === "Scheitern über ℚ");
}

// --- parseTitle: ganze Blätter ---------------------------------------
{
  const b = parseTitle("L15 · Blatt 10 — hyperbolische Ebene");
  t("Blatt: code/kap, nr = 0", b.code === "Blatt 10" && b.kap === 10 && b.nr === 0);
  t("Blatt: Lektion bleibt erhalten", b.lektion === "L15");
  t("Blatt: Name", b.name === "hyperbolische Ebene");
}

// --- parseTitle: Titel ohne Übungskürzel -----------------------------
{
  const g = parseTitle("Neutralelement ist eindeutig");
  t("ohne Kürzel: code Basis, kap −1 (steht vorn)", g.code === "Basis" && g.kap === -1);
  t("ohne Kürzel: Name unverändert", g.name === "Neutralelement ist eindeutig");
  t("ohne Kürzel: Quelle Grundlagen", g.quelle === "Grundlagen");

  const gl = parseTitle("L0 · Grundlagen — Körper & Vektorraum");
  t("Lektion ohne Übung: code = Lektion", gl.code === "L0" && gl.lektion === "L0");
  t("Lektion ohne Übung: Name nach dem Gedankenstrich", gl.name === "Körper & Vektorraum");
}

// --- fachFor: die dokumentierte Stolperstelle -------------------------
{
  t("Neutralelement → Algebra", fachFor("Neutralelement ist eindeutig", "Def 9") === "algebra");
  t("code Basis… → Algebra", fachFor("Strahl", "Basis") === "algebra");
  t("sonst → Elementargeometrie", fachFor("Strahl", "Def 9") === "elgeo");
  t("Kongruenzebene → ElGeo", fachFor("Kongruenzebene", "Def 17") === "elgeo");
}

// --- fachForSymbolRef: nur "Def <Ziffer>" gilt als ElGeo --------------
{
  t("ref „Def 3.1“ → ElGeo", fachForSymbolRef("Def 3.1") === "elgeo");
  t("ref „Def 12“ → ElGeo", fachForSymbolRef("Def 12") === "elgeo");
  t("ref „Grundlagen (Algebra)“ → Algebra", fachForSymbolRef("Grundlagen (Algebra)") === "algebra");
  // ohne Ziffer greift die Heuristik nicht — Aufgabe landet unter Algebra
  t("ref „Definition“ (ohne Ziffer) → Algebra", fachForSymbolRef("Definition") === "algebra");
}

// --- tagsFor ----------------------------------------------------------
{
  t("mehrere Treffer in Reihenfolge der Hinweise",
    eq(tagsFor("Fixpunkt einer Ähnlichkeit"), ["Fixpunkt", "Ähnlichkeit"]));
  t("kein Treffer → leer", eq(tagsFor("Strahl"), []));
  t("Neutral… → Gruppenaxiome", eq(tagsFor("Neutralelement ist eindeutig"), ["Gruppenaxiome"]));
  t("klein geschriebenes „projektiv“ trifft", eq(tagsFor("projektive Ebene"), ["Projektion"]));
  // Treffer sind case-sensitiv: in Komposita steht das Nomen klein und
  // wird deshalb NICHT getaggt („…gruppe“ ⇏ Gruppe, „…spiegel“ ⇏ Spiegelung).
  t("Komposita: nur der groß geschriebene Treffer",
    eq(tagsFor("Drehspiegelgruppe"), ["Drehspiegelung"]), JSON.stringify(tagsFor("Drehspiegelgruppe")));
  t("Duplikate werden nicht doppelt vergeben",
    eq(tagsFor("Projektion und projektive Ebene"), ["Projektion"]));
}

console.log(`\n${pass} ok, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
