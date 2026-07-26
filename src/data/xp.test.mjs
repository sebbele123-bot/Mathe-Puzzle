// Minimal-localStorage für Node
const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
};
const { awardXp, levelFromXp, xpForNext, loadXp } = await import("./xp.js");

let pass = 0, fail = 0;
const t = (name, cond, info = "") => { cond ? pass++ : fail++; console.log(`${cond ? "ok  " : "FAIL"} ${name}${info ? "  " + info : ""}`); };

// Levelkurve
t("Level 1 bei 0 XP", levelFromXp(0).level === 1);
t("Bedarf L1→L2 = 80", xpForNext(1) === 80);
t("79 XP bleibt Level 1", levelFromXp(79).level === 1);
t("80 XP wird Level 2", levelFromXp(80).level === 2);
t("Bedarf steigt", xpForNext(3) > xpForNext(2));
const l = levelFromXp(200);
t("Fortschritt in [0,1)", l.progress >= 0 && l.progress < 1, `L${l.level} ${l.inLevel}/${l.need}`);

// Beweis, sauber, ungeübt (stärkster Fall) + Erstlösung
const a1 = awardXp("proof:x", "beweis", 0, null);
t("Beweis sauber+neu großzügig", a1.gained === Math.round((18 + 6) * 1.5) + 10, `= ${a1.gained}`);

// Wiederholung am selben Tag wird gedämpft
const a2 = awardXp("proof:x", "beweis", 0, null);
t("2. Mal deutlich weniger", a2.gained < a1.gained * 0.5, `${a1.gained} → ${a2.gained}`);
const a3 = awardXp("proof:x", "beweis", 0, null);
t("3. Mal noch weniger", a3.gained <= a2.gained, `${a2.gained} → ${a3.gained}`);

// Starkes Element bringt weniger als schwaches
const weak = awardXp("def:weak", "definition", 0, 0.05);
const strong = awardXp("def:strong", "definition", 0, 0.95);
t("schwach > stark", weak.gained > strong.gained, `${weak.gained} vs ${strong.gained}`);

// Fehlversuche kosten den Sauber-Bonus
const clean = awardXp("def:c", "definition", 0, 0.5);
const dirty = awardXp("def:d", "definition", 3, 0.5);
t("sauber > mit Fehlversuchen", clean.gained > dirty.gained, `${clean.gained} vs ${dirty.gained}`);

// Streak & Persistenz
t("Streak gesetzt", loadXp().streak === 1);
t("XP summiert", loadXp().xp === a1.gained + a2.gained + a3.gained + weak.gained + strong.gained + clean.gained + dirty.gained);
t("Level-up meldbar", typeof a1.leveledUp === "boolean");
t("XP nie 0", [a1,a2,a3,weak,strong,clean,dirty].every(a => a.gained >= 1));

console.log(`\n${pass} ok, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
