// Logik-Test ohne Browser für die Rotations-Statistik.
// Lauf: node src/data/stats.test.mjs
// Minimal-localStorage für Node (wie in xp.test.mjs)
const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
const { recordOutcome, weightFor, pickWeighted, strengthOf, loadStats } =
  await import("./stats.js");

let pass = 0, fail = 0;
const t = (name, cond, info = "") => { cond ? pass++ : fail++; console.log(`${cond ? "ok  " : "FAIL"} ${name}${info ? "  " + info : ""}`); };
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

const DAY = 86400000;

// --- recordOutcome: sauberes Lösen zieht Richtung Beherrschung ----------
{
  const r1 = recordOutcome("def:a", 0);
  t("1. sauber → strength 0.45", near(r1.strength, 0.45), `= ${r1.strength}`);
  t("attempts gezählt", r1.attempts === 1);
  t("cleanSolves gezählt", r1.cleanSolves === 1);
  t("lastFails = 0", r1.lastFails === 0);
  t("lastSeen gesetzt", r1.lastSeen > 0);

  const r2 = recordOutcome("def:a", 0);
  t("2. sauber steigt weiter", r2.strength > r1.strength, `${r1.strength} → ${r2.strength}`);
  t("strength bleibt < 1", r2.strength < 1);
}

// --- recordOutcome: Fehlversuche drücken die Stärke --------------------
{
  recordOutcome("def:b", 0);            // strength 0.45 aufbauen
  const before = strengthOf("def:b", loadStats());
  const rf = recordOutcome("def:b", 4); // 4 Fehler = maximaler Abzug
  t("Fehlversuche senken strength", rf.strength < before, `${before} → ${rf.strength}`);
  t("mehr Fehler zählt in failsTotal", rf.failsTotal === 4);
  t("lastFails übernommen", rf.lastFails === 4);
  t("cleanSolves unverändert bei Fehler", rf.cleanSolves === 1);
  t("strength nie negativ", rf.strength >= 0);

  // aus strength 0 heraus bleibt ein Fehlversuch bei 0 (kein Unterlauf)
  const rz = recordOutcome("def:zero", 2);
  t("Fehler aus strength 0 bleibt 0", rz.strength === 0, `= ${rz.strength}`);
}

// --- recordOutcome: Persistenz ----------------------------------------
{
  recordOutcome("def:persist", 0);
  const reread = loadStats()["def:persist"];
  t("gespeichert & wieder ladbar", reread && reread.attempts === 1);
}

// --- weightFor: Fälligkeit & Schwäche ---------------------------------
{
  const now = 1_000 * DAY; // fester Bezugszeitpunkt
  // Nie geübt → klar bevorzugt (Gewicht 3)
  t("nie geübt → Gewicht 3", weightFor("x", {}, now) === 3);
  t("leerer Eintrag → Gewicht 3", weightFor("x", { x: { attempts: 0 } }, now) === 3);

  // Gerade eben gesehen: recency = 1
  const strong = { s: { attempts: 5, strength: 1, lastSeen: now } };
  const weak = { w: { attempts: 5, strength: 0, lastSeen: now } };
  t("schwach schwerer gewichtet als stark",
    weightFor("w", weak, now) > weightFor("s", strong, now),
    `${weightFor("w", weak, now)} vs ${weightFor("s", strong, now)}`);
  t("starkes Element hat Bodengewicht > 0", weightFor("s", strong, now) > 0);

  // Recency: länger her → höheres Gewicht, gedeckelt bei 3× (bei 9+ Tagen)
  const seenNow = { a: { attempts: 3, strength: 0.5, lastSeen: now } };
  const seenOld = { a: { attempts: 3, strength: 0.5, lastSeen: now - 9 * DAY } };
  t("älter → fälliger", weightFor("a", seenOld, now) > weightFor("a", seenNow, now));
  const capped = { a: { attempts: 3, strength: 0.5, lastSeen: now - 100 * DAY } };
  t("Recency gedeckelt bei 3×",
    near(weightFor("a", capped, now), weightFor("a", seenOld, now)),
    `${weightFor("a", capped, now)} vs ${weightFor("a", seenOld, now)}`);
}

// --- pickWeighted: Auswahl & exclude ----------------------------------
{
  t("leere Liste → null", pickWeighted([], {}) === null);
  t("ein Element → dieses", pickWeighted(["only"], {}) === "only");

  // exclude bei mehreren Kandidaten: das ausgeschlossene taucht nie auf
  const ids = ["p", "q", "r"];
  const stats = {};
  let excludedSeen = false, allValid = true;
  for (let i = 0; i < 200; i++) {
    const got = pickWeighted(ids, stats, "p");
    if (got === "p") excludedSeen = true;
    if (!ids.includes(got)) allValid = false;
  }
  t("exclude wird nie gezogen", !excludedSeen);
  t("Ergebnis immer aus der Liste", allValid);

  // exclude als einziges Element: es darf trotzdem gezogen werden (kein null)
  t("einziges Element trotz exclude", pickWeighted(["p"], {}, "p") === "p");
}

// --- strengthOf: null wenn ungeübt ------------------------------------
{
  t("ungeübt → null", strengthOf("nie", {}) === null);
  t("ohne attempts → null", strengthOf("x", { x: { attempts: 0, strength: 0.9 } }) === null);
  t("geübt → Zahlwert", strengthOf("def:a", loadStats()) > 0);
}

console.log(`\n${pass} ok, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
