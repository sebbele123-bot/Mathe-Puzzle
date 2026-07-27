/* Definitionssatz aufteilen — damit „:=“ zwischen Definiendum und
 * Definiens steht und nicht davor.
 * Lauf: node src/data/defsatz.test.mjs */
import { splitDefinition } from "./defsatz.js";
import { DEFINITIONS } from "./definitions.js";

let pass = 0, fail = 0;
const t = (name, cond, info = "") => { cond ? pass++ : fail++; console.log(`${cond ? "ok  " : "FAIL"} ${name}${info ? "  " + info : ""}`); };

// --- die gemeldete Stelle: „s: …“ wird zu „s := …“ --------------------
{
  const r = splitDefinition("s: symmetrische, positiv definite Bilinearform auf einem reellen Vektorraum.");
  t("D1: Definiendum abgetrennt", r.definiendum === "s", `= ${JSON.stringify(r.definiendum)}`);
  t("D1: Definiens ohne Doppelpunkt", r.definiens.startsWith("symmetrische, positiv definite"));
}

// --- weitere Doppelpunkt-Formen ---------------------------------------
{
  t("mehrwortiges Definiendum",
    splitDefinition("Affine Gerade: p + ℝv (v ≠ 0).").definiendum === "Affine Gerade");
  t("Rest bleibt vollständig",
    splitDefinition("Affine Gerade: p + ℝv (v ≠ 0). Parallel: gleicher Richtungsraum.").definiens
      === "p + ℝv (v ≠ 0). Parallel: gleicher Richtungsraum.");
}

// --- was NICHT geteilt werden darf ------------------------------------
{
  // „=“ in der Formel ist kein Definitionszeichen
  const d7 = splitDefinition("Bijektion φ(p + v⃗) = φ(p) + φ⃗(v⃗) mit invertierbarem linearem Anteil.");
  t("Formel mit „=“ bleibt unangetastet", d7.definiendum === null);

  const d2 = splitDefinition("O(Z,s) = { g ∈ GL(Z) | s(gv,gw) = s(v,w) ∀ v,w }.");
  t("Gleichheitsform bleibt unangetastet", d2.definiendum === null);

  // Doppelpunkt erst nach einem Satzende zählt nicht
  const d3 = splitDefinition("Orthogonale Elemente mit det = 1 (Drehmatrizen). O(2) enthält: mehr.");
  t("Doppelpunkt nach Satzende zählt nicht", d3.definiendum === null, `= ${JSON.stringify(d3.definiendum)}`);

  t("reine Prosa bleibt unangetastet",
    splitDefinition("Anordnungsaxiome inklusive Pasch-Axiom.").definiendum === null);
  t("zu langes Definiendum wird nicht abgetrennt",
    splitDefinition("ein sehr langer Vorspann der die Grenze deutlich überschreitet: Rest.").definiendum === null);
}

// --- Randfälle --------------------------------------------------------
{
  t("leerer Satz → kein Definiendum", splitDefinition("").definiendum === null);
  t("undefined → leerer Definiens", splitDefinition(undefined).definiens === "");
  t("Doppelpunkt ohne Rest teilt nicht", splitDefinition("s:").definiendum === null);
}

// --- gegen die echten Daten: nichts geht verloren ----------------------
{
  const verloren = [];
  for (const d of DEFINITIONS) {
    const { definiendum, definiens } = splitDefinition(d.statement);
    const wieder = definiendum ? `${definiendum}: ${definiens}` : definiens;
    if (wieder.replace(/\s+/g, " ") !== d.statement.replace(/\s+/g, " ")) verloren.push(`D${d.nr}`);
  }
  t("alle 30 Aussagen bleiben verlustfrei", verloren.length === 0, verloren.join(", "));
}

console.log(`\n${pass} ok, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
