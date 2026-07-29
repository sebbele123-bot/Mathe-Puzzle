/* ====================================================================
 *  Erfahrungspunkte & Level
 *  XP belohnt dieselbe Richtung wie die Rotation: fälliges Schwaches üben.
 *  Deshalb Multiplikatoren statt fixer Punkte —
 *    Grundwert (nach Typ) + Sauber-Bonus, mal Schwäche-Faktor,
 *    mal Wiederholungs-Dämpfung (gegen Grinding desselben Elements).
 * ==================================================================== */
const KEY = "mp_xp_v1";

const BASE = { beweis: 18, definition: 10 };
const CLEAN_BONUS = 6;
const FIRST_SOLVE_BONUS = 10;
const FIRST_CONTACT = 4; // einmalig fürs erste Aufschlagen einer Rotationskarte
const REPEAT = [1, 0.4, 0.2, 0.1]; // 1., 2., 3., ab 4. Mal am selben Tag

// Bedarf für den Aufstieg von `level` auf `level+1`
export const xpForNext = (level) => 80 + 40 * (level - 1);

/** Gesamt-XP → { level, inLevel, need, progress } */
export function levelFromXp(totalXp) {
  let level = 1;
  let rest = Math.max(0, totalXp);
  while (rest >= xpForNext(level)) { rest -= xpForNext(level); level += 1; }
  const need = xpForNext(level);
  return { level, inLevel: rest, need, progress: need ? rest / need : 0 };
}

const dayKey = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);

const empty = () => ({ xp: 0, day: dayKey(), perItemToday: {}, solved: [], seen: [], streak: 0, lastDay: null });

export function loadXp() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!s || typeof s !== "object") return empty();
    return { ...empty(), ...s };
  } catch { return empty(); }
}
export function saveXp(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

/**
 * Erster Kontakt mit einer Rotationskarte: das Aufschlagen und Lesen wird
 * einmalig belohnt — danach zählt nur noch das Lösen.
 * @param id  Katalog-id der Karte
 * @returns { gained, total, level, leveledUp, kind } oder null, wenn die Karte
 *          schon einmal aufgeschlagen wurde
 */
export function awardFirstContact(id) {
  if (!id) return null;
  const s = loadXp();
  if (s.seen.includes(id)) return null;

  const beforeLevel = levelFromXp(s.xp).level;
  s.seen = [...s.seen, id];
  s.xp += FIRST_CONTACT;
  saveXp(s);

  const after = levelFromXp(s.xp);
  return {
    gained: FIRST_CONTACT, total: s.xp, level: after.level,
    leveledUp: after.level > beforeLevel, kind: "erstkontakt",
  };
}

/**
 * XP für eine abgeschlossene Übung vergeben.
 * @param id             Katalog-id
 * @param kind           "beweis" | "definition"
 * @param fails          gemessene Fehlversuche
 * @param strengthBefore Stärke VOR dieser Übung (null = ungeübt)
 * @returns { gained, total, level, leveledUp, streak, breakdown }
 */
export function awardXp(id, kind, fails = 0, strengthBefore = null) {
  const s = loadXp();
  const today = dayKey();

  // Tageswechsel: Wiederholungszähler zurücksetzen, Streak fortschreiben
  if (s.day !== today) {
    s.day = today;
    s.perItemToday = {};
  }
  if (s.lastDay !== today) {
    const yesterday = dayKey(Date.now() - 86400000);
    s.streak = s.lastDay === yesterday ? (s.streak || 0) + 1 : 1;
    s.lastDay = today;
  }

  const beforeLevel = levelFromXp(s.xp).level;

  const base = BASE[kind] ?? BASE.definition;
  const clean = fails === 0 ? CLEAN_BONUS : 0;
  // ungeübt/schwach zieht mehr XP als längst Beherrschtes
  const weakness = 1 + (1 - (strengthBefore ?? 0)) * 0.5;
  const times = s.perItemToday[id] || 0;
  const repeat = REPEAT[Math.min(times, REPEAT.length - 1)];
  const first = s.solved.includes(id) ? 0 : FIRST_SOLVE_BONUS;

  const gained = Math.max(1, Math.round((base + clean) * weakness * repeat + first));

  s.xp += gained;
  s.perItemToday[id] = times + 1;
  if (first) s.solved = [...s.solved, id];
  saveXp(s);

  const after = levelFromXp(s.xp);
  return {
    gained, total: s.xp, level: after.level, leveledUp: after.level > beforeLevel,
    streak: s.streak,
    breakdown: { base, clean, weakness: +weakness.toFixed(2), repeat, first },
  };
}
