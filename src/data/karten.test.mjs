/* Karteikarten-Logik: Modi-Auswahl und Stufe aus der Stärke.
 * Lauf: node src/data/karten.test.mjs */
import {
  BAUEN, QUIZ, AUFLOESUNG, kannBauen, modiFor, pickModus, stufeFor, vorgabenFor,
} from "./karten.js";

let pass = 0, fail = 0;
const t = (name, cond, info = "") => { cond ? pass++ : fail++; console.log(`${cond ? "ok  " : "FAIL"} ${name}${info ? "  " + info : ""}`); };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const bauKarte = { mode: "definition" };
const beweisKarte = { mode: "beweis" };
const symKarte = { mode: "werkbank" };
const steckbrief = { mode: "steckbrief" };

// --- welche Karten kann man bauen? ------------------------------------
{
  t("Definition/Beweis/Werkbank sind Bau-Ansichten",
    kannBauen(bauKarte) && kannBauen(beweisKarte) && kannBauen(symKarte));
  t("Steckbrief ist keine Bau-Ansicht", !kannBauen(steckbrief));
  t("ohne Eintrag → false", !kannBauen(null));
}

// --- verfügbare Modi ---------------------------------------------------
{
  t("Bau-Karte ohne Quiz: bauen + Auflösung", eq(modiFor(bauKarte, false), [BAUEN, AUFLOESUNG]));
  t("Bau-Karte mit Quiz: alle drei", eq(modiFor(bauKarte, true), [BAUEN, QUIZ, AUFLOESUNG]));
  t("Steckbrief ohne Quiz: nur Auflösung", eq(modiFor(steckbrief, false), [AUFLOESUNG]));
  t("Steckbrief mit Quiz: Quiz + Auflösung", eq(modiFor(steckbrief, true), [QUIZ, AUFLOESUNG]));
}

// --- Modus-Wahl nach Stärke -------------------------------------------
{
  const alle = [BAUEN, QUIZ, AUFLOESUNG];
  t("nie geübt → erst zeigen", pickModus(alle, null) === AUFLOESUNG);
  t("schwach → bauen", pickModus(alle, 0.1) === BAUEN);
  t("mittel + niedriger Wurf → bauen", pickModus(alle, 0.5, 0.2) === BAUEN);
  t("mittel + hoher Wurf → Quiz", pickModus(alle, 0.5, 0.9) === QUIZ);
  t("stark → Quiz", pickModus(alle, 0.95) === QUIZ);

  // fehlende Modi werden übersprungen
  t("stark ohne Quiz → bauen", pickModus([BAUEN, AUFLOESUNG], 0.95) === BAUEN);
  t("schwach ohne Bauen → Auflösung", pickModus([QUIZ, AUFLOESUNG], 0.1) === AUFLOESUNG);
  t("nur ein Modus → dieser", pickModus([AUFLOESUNG], 0.5, 0.9) === AUFLOESUNG);
  t("keine Modi → null", pickModus([], 0.5) === null);

  // Bänder an den Rändern
  t("0.34 zählt noch als schwach", pickModus(alle, 0.34) === BAUEN);
  t("0.7 zählt noch als mittel", pickModus(alle, 0.7, 0.9) === QUIZ);
  t("0.71 ist stark", pickModus(alle, 0.71, 0.1) === QUIZ);
}

// --- Stufe aus der Stärke ---------------------------------------------
{
  t("nie geübt → Stufe 0 (viel Vorgabe)", stufeFor(null, 2) === 0);
  t("Stärke 0 → Stufe 0", stufeFor(0, 2) === 0);
  t("volle Stärke → höchste Stufe", stufeFor(1, 2) === 2);
  t("Mitte → mittlere Stufe", stufeFor(0.5, 2) === 1, `= ${stufeFor(0.5, 2)}`);
  t("ohne Stufen bleibt 0", stufeFor(0.9, 0) === 0);
  t("Stufe bleibt im Bereich", stufeFor(5, 3) === 3 && stufeFor(-2, 3) === 0);
  t("eine einzige Tiefe → immer 0", stufeFor(0.8, 0) === 0);
}

// --- vorgefertigte Teile ----------------------------------------------
{
  t("Stufe 0 → alle Vorgaben", vorgabenFor(0, 3) === 3);
  t("höchste Stufe → keine Vorgabe", vorgabenFor(3, 3) === 0);
  t("dazwischen", vorgabenFor(1, 3) === 2);
  t("nie negativ", vorgabenFor(9, 3) === 0);
}

console.log(`\n${pass} ok, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
