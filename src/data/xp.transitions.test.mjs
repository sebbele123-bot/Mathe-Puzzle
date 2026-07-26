/* ====================================================================
 *  XP — Zustandsübergänge über Tagesgrenzen (Wiederholungs-Reset,
 *  Streak-Fortschreibung) und robustes Laden.
 *  Ergänzt xp.test.mjs, das nur den „heutigen" Tag betrachtet.
 *  Der Kniff: Date.now() wird gestellt, um Tage zu simulieren.
 *  Lauf: node src/data/xp.transitions.test.mjs
 * ==================================================================== */
const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};

// steuerbare Uhr (UTC-Mittag, damit +24 h sicher auf den Folgetag fällt)
const DAY = 86400000;
let NOW = Date.parse("2026-03-10T12:00:00Z");
const realNow = Date.now;
Date.now = () => NOW;

const { awardXp, levelFromXp, xpForNext, loadXp } = await import("./xp.js");

let pass = 0, fail = 0;
const t = (name, cond, info = "") => { cond ? pass++ : fail++; console.log(`${cond ? "ok  " : "FAIL"} ${name}${info ? "  " + info : ""}`); };

// --- Wiederholungs-Dämpfung setzt am neuen Tag zurück ------------------
{
  const a1 = awardXp("def:rep", "definition", 0, 0.5);
  const a2 = awardXp("def:rep", "definition", 0, 0.5);
  const a3 = awardXp("def:rep", "definition", 0, 0.5);
  t("Tag 1: 1. Mal repeat = 1", a1.breakdown.repeat === 1);
  t("Tag 1: 2. Mal repeat = 0.4", a2.breakdown.repeat === 0.4);
  t("Tag 1: 3. Mal repeat = 0.2", a3.breakdown.repeat === 0.2);
  t("Tag 1: Erstlösungs-Bonus nur beim 1. Mal", a1.breakdown.first === 10 && a2.breakdown.first === 0);

  NOW += DAY; // nächster Tag
  const b1 = awardXp("def:rep", "definition", 0, 0.5);
  t("Tag 2: repeat wieder 1 (perItemToday zurückgesetzt)", b1.breakdown.repeat === 1, `= ${b1.breakdown.repeat}`);
  t("Tag 2: kein Erstlösungs-Bonus mehr (schon gelöst)", b1.breakdown.first === 0);
  t("Tag 2: mehr XP als die gedämpfte Wiederholung von Tag 1", b1.gained > a3.gained, `${a3.gained} → ${b1.gained}`);
}

// --- Streak: +1 an aufeinanderfolgenden Tagen, Reset bei Lücke ---------
{
  // frischer Zustand für saubere Streak-Rechnung
  delete store["mp_xp_v1"];
  NOW = Date.parse("2026-04-01T12:00:00Z");

  const d1 = awardXp("def:s", "definition", 0, 0.5);
  t("Tag 1: Streak = 1", d1.streak === 1, `= ${d1.streak}`);
  const d1b = awardXp("def:s", "definition", 0, 0.5);
  t("gleicher Tag: Streak bleibt 1", d1b.streak === 1, `= ${d1b.streak}`);

  NOW += DAY;
  t("Folgetag: Streak = 2", awardXp("def:s", "definition", 0, 0.5).streak === 2);
  NOW += DAY;
  t("weiterer Folgetag: Streak = 3", awardXp("def:s", "definition", 0, 0.5).streak === 3);

  NOW += 2 * DAY; // ein Tag ausgelassen
  t("Lücke: Streak fällt auf 1 zurück", awardXp("def:s", "definition", 0, 0.5).streak === 1);
}

// --- robustes Laden: kaputte / unvollständige Daten -------------------
{
  store["mp_xp_v1"] = "{ das ist kein JSON";
  const corrupt = loadXp();
  t("kaputtes JSON → leerer Zustand", corrupt.xp === 0 && corrupt.streak === 0 && Array.isArray(corrupt.solved));

  store["mp_xp_v1"] = JSON.stringify({ xp: 500 }); // nur ein Feld gesetzt
  const partial = loadXp();
  t("Teil-Objekt: xp übernommen", partial.xp === 500);
  t("Teil-Objekt: fehlende Felder ergänzt",
    partial.perItemToday && typeof partial.perItemToday === "object" &&
    Array.isArray(partial.solved) && partial.solved.length === 0 &&
    partial.lastDay === null && typeof partial.day === "string");
}

// --- Levelkurve: kumulierte Schwellen über mehrere Level --------------
{
  t("xpForNext(1)=80, (2)=120, (3)=160", xpForNext(1) === 80 && xpForNext(2) === 120 && xpForNext(3) === 160);
  const start3 = xpForNext(1) + xpForNext(2); // 200 XP → Anfang Level 3
  t("kumuliert 200 XP → Level 3, inLevel 0", levelFromXp(start3).level === 3 && levelFromXp(start3).inLevel === 0);
  t("199 XP → noch Level 2", levelFromXp(start3 - 1).level === 2);
  const mid = levelFromXp(start3 + 80);
  t("Fortschritt in [0,1)", mid.progress >= 0 && mid.progress < 1, `L${mid.level} ${mid.inLevel}/${mid.need}`);
  t("negative XP → Level 1", levelFromXp(-50).level === 1);
}

Date.now = realNow;
console.log(`\n${pass} ok, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
