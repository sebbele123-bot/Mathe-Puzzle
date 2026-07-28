/* Schwierigkeit 1–10 und ihre Wirkung auf die Erfahrungspunkte.
 * Lauf: node src/data/schwierigkeit.test.mjs */
const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
const { stufe, geschaetzt, quizSchwierigkeit, schwierigkeitFor, frageSchwierigkeit,
        ANFORDERUNG, DISTRAKTOREN, SCHWIERIGKEIT, MIN, MAX } =
  await import("./schwierigkeit.js");
const { QUIZ, mischeOptionen } = await import("./quiz.js");
const { awardXp } = await import("./xp.js");

const abcd = (anforderung, distraktoren) => ({ art: "abcd", anforderung, distraktoren });
const janein = (anforderung) => ({ art: "janein", anforderung });

let pass = 0, fail = 0;
const t = (name, cond, info = "") => { cond ? pass++ : fail++; console.log(`${cond ? "ok  " : "FAIL"} ${name}${info ? "  " + info : ""}`); };

// --- Skala begrenzen ---------------------------------------------------
{
  t("innerhalb der Skala unverändert", stufe(5) === 5);
  t("unter 1 wird 1", stufe(0) === MIN && stufe(-3) === MIN);
  t("über 10 wird 10", stufe(11) === MAX && stufe(99) === MAX);
  t("wird gerundet", stufe(4.6) === 5 && stufe(4.4) === 4);
  t("ohne Zahl → 1", stufe(null) === MIN && stufe(undefined) === MIN && stufe(NaN) === MIN);
}

// --- Schätzung aus dem Umfang -----------------------------------------
{
  t("Untergrenze → 1", geschaetzt(3) === 1);
  t("Obergrenze → 10", geschaetzt(24) === 10);
  t("Mitte → mittlere Stufe", geschaetzt(13) === 5 || geschaetzt(13) === 6, `= ${geschaetzt(13)}`);
  t("größerer Umfang → nie kleinere Stufe", geschaetzt(9) <= geschaetzt(15));
  t("außerhalb wird begrenzt", geschaetzt(1) === 1 && geschaetzt(99) === 10);
  t("ohne Umfang → 1", geschaetzt(null) === 1);
}

// --- Handbewertung schlägt Schätzung ----------------------------------
{
  // Halbgruppe und Kongruenzebene haben fast denselben Umfang (4 bzw. 5),
  // sind aber unterschiedlich schwer — genau dafür die Handbewertung.
  t("Handbewertung gewinnt", schwierigkeitFor("sym:s_halbgruppe", 4) === SCHWIERIGKEIT["sym:s_halbgruppe"]);
  t("Halbgruppe leichter als Kongruenzebene",
    schwierigkeitFor("sym:s_halbgruppe", 4) < schwierigkeitFor("sym:s_kongebene", 5));
  t("ohne Handbewertung wird geschätzt", schwierigkeitFor("def:gibtsnicht", 24) === 10);
}

// --- Schwierigkeit aus den Bestandteilen -------------------------------
{
  t("Nachschlagen mit fernen Distraktoren ist am leichtesten",
    frageSchwierigkeit(abcd("nachschlagen", "fern")) === 1);
  t("Beweisidee mit nahen Distraktoren ist am schwersten",
    frageSchwierigkeit(abcd("beweisidee", "nah")) === 7);
  t("nähere Distraktoren machen dieselbe Frage schwerer",
    frageSchwierigkeit(abcd("unterscheiden", "nah")) >
    frageSchwierigkeit(abcd("unterscheiden", "fern")));
  t("höhere Anforderung wiegt schwerer",
    frageSchwierigkeit(abcd("grenzfall", "fern")) >
    frageSchwierigkeit(abcd("nachschlagen", "fern")));

  // Rate-Chance: dieselbe Anforderung als ja/nein zählt weniger
  t("ja/nein zählt weniger als ABCD bei gleicher Anforderung",
    frageSchwierigkeit(janein("folgern")) < frageSchwierigkeit(abcd("folgern", "fern")));
  t("ja/nein bleibt bei 1, wenn nur nachgeschlagen wird",
    frageSchwierigkeit(janein("nachschlagen")) === 1);

  // unbrauchbare Angaben werden nicht stillschweigend zu einer 1
  t("unbekannte Anforderung → null", frageSchwierigkeit(abcd("erfunden", "nah")) === null);
  t("fehlende Distraktoren bei ABCD → null", frageSchwierigkeit({ art: "abcd", anforderung: "folgern" }) === null);
  t("ohne Frage → null", frageSchwierigkeit(null) === null);
  t("ja/nein braucht keine Distraktoren", frageSchwierigkeit(janein("grenzfall")) === 3);
}

// --- Quizdurchgang: Summe der Fragen ----------------------------------
{
  t("Summe zweier Fragen",
    quizSchwierigkeit([janein("nachschlagen"), abcd("unterscheiden", "nah")]) === 1 + 4);
  t("einzelne Frage", quizSchwierigkeit([abcd("beweisidee", "plausibel")]) === 6);
  t("mehr Fragen → höherer Wert",
    quizSchwierigkeit([abcd("folgern", "nah"), abcd("folgern", "nah")]) >
    quizSchwierigkeit([abcd("folgern", "nah")]));
  t("schwerere Fragen → höherer Wert bei gleicher Anzahl",
    quizSchwierigkeit([abcd("beweisidee", "nah")]) >
    quizSchwierigkeit([abcd("nachschlagen", "fern")]));
  t("Summe darf 10 überschreiten",
    quizSchwierigkeit([abcd("beweisidee", "nah"), abcd("beweisidee", "nah")]) === 14);
  t("ohne Fragen → 1", quizSchwierigkeit([]) === MIN && quizSchwierigkeit(null) === MIN);
  t("unbrauchbare Fragen zählen nicht mit",
    quizSchwierigkeit([abcd("grenzfall", "fern"), { art: "abcd" }]) === 4);
}

// --- alle Quizfragen tragen brauchbare Bestandteile -------------------
{
  const schlecht = [];
  for (const [id, fragen] of Object.entries(QUIZ))
    fragen.forEach((f, i) => {
      const w = frageSchwierigkeit(f);
      if (w === null) schlecht.push(`${id}[${i}] unbrauchbar`);
      else if (w < MIN || w > MAX) schlecht.push(`${id}[${i}] = ${w}`);
    });
  t("jede Quizfrage ergibt eine Schwierigkeit in 1–10", schlecht.length === 0, schlecht.join(", "));
  t("Anforderung und Distraktoren sind bekannte Stufen",
    Object.values(QUIZ).flat().every((f) =>
      ANFORDERUNG[f.anforderung] != null &&
      (f.art !== "abcd" || DISTRAKTOREN[f.distraktoren] != null)));
}

// --- Wirkung auf die XP ------------------------------------------------
{
  const leicht = awardXp("a:leicht", "quiz", 0, 0.5, 1);
  const schwer = awardXp("a:schwer", "quiz", 0, 0.5, 10);
  t("schwerer bringt mehr XP", schwer.gained > leicht.gained, `${leicht.gained} vs ${schwer.gained}`);
  t("Schwierigkeit steht in der Aufschlüsselung", schwer.breakdown.schwierigkeit === 10);
  t("Grundwert wächst mit der Stufe", schwer.breakdown.base === 40 && leicht.breakdown.base === 4);

  // monoton über die ganze Skala
  const werte = [];
  for (let s = 1; s <= 10; s++) werte.push(awardXp(`m:${s}`, "quiz", 0, 0.5, s).gained);
  t("XP steigen über die Skala monoton", werte.every((v, i) => i === 0 || v >= werte[i - 1]), werte.join(" "));

  // ohne Angabe bleibt der alte Typ-Wert
  const ohne = awardXp("a:ohne", "beweis", 0, 0.5);
  t("ohne Schwierigkeit gilt der Typ-Grundwert", ohne.breakdown.base === 18);
  // ein längeres Quiz bringt mehr als ein kürzeres mit denselben Fragen
  const kurz = awardXp("q:kurz", "quiz", 0, 0.5, quizSchwierigkeit([abcd("nachschlagen", "nah")]));
  const lang = awardXp("q:lang", "quiz", 0, 0.5, quizSchwierigkeit([abcd("nachschlagen", "nah"), abcd("nachschlagen", "nah")]));
  t("mehr Fragen bringen mehr XP", lang.gained > kurz.gained, `${kurz.gained} vs ${lang.gained}`);
  t("Summe über 10 wirkt sich aus", awardXp("a:13", "quiz", 0, 0.5, 13).breakdown.base === 52);
  t("Unsinn in den Daten bleibt gedeckelt",
    awardXp("a:absurd", "quiz", 0, 0.5, 99999).breakdown.base === 400);
}

// --- Mischen der Antwortmöglichkeiten ----------------------------------
{
  const frage = { art: "abcd", optionen: ["A", "B", "C", "D"], richtig: 0 };

  // Inhalt bleibt vollständig, nur die Reihenfolge ändert sich
  let alleVollstaendig = true, richtigStimmt = true;
  for (let i = 0; i < 200; i++) {
    const g = mischeOptionen(frage);
    if ([...g.optionen].sort().join() !== ["A","B","C","D"].join()) alleVollstaendig = false;
    if (g.optionen[g.richtig] !== frage.optionen[frage.richtig]) richtigStimmt = false;
  }
  t("Mischen behält alle Antworten", alleVollstaendig);
  t("richtig zeigt weiter auf denselben Text", richtigStimmt);

  // die richtige Antwort landet auf allen Positionen
  const gesehen = new Set();
  for (let i = 0; i < 400; i++) gesehen.add(mischeOptionen(frage).richtig);
  t("richtige Antwort erscheint auf jeder Position", gesehen.size === 4, `Positionen: ${[...gesehen].sort()}`);

  // gesteuerter Zufall: nachvollziehbar statt zufällig geprüft
  const fest = mischeOptionen(frage, () => 0);
  t("mit festem Zufall reproduzierbar", fest.optionen.length === 4 && fest.optionen[fest.richtig] === "A");

  // eine einzelne Antwort bleibt unverändert
  const einzel = mischeOptionen({ art: "abcd", optionen: ["nur eine"], richtig: 0 });
  t("eine Antwort bleibt an Position 0", einzel.richtig === 0);
}

console.log(`\n${pass} ok, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
