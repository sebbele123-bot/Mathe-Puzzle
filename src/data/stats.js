/* ====================================================================
 *  Rotations-Statistik (Anki-artig)
 *  Misst pro Element konkrete Werte — v. a. Fehlversuche beim Bauen und
 *  Aktualität — und leitet daraus eine "Stärke" 0..1 ab. Die Rotation
 *  schlägt zufällig vor, gewichtet nach Schwäche (schwache öfter).
 *  (Persönliche Selbsteinschätzung kommt später und kann die Stärke
 *   zusätzlich verschieben.)
 * ==================================================================== */
const KEY = "mp_stats_v1";
const DAY = 86400000;

export const loadStats = () => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "{}");
    return s && typeof s === "object" ? s : {};
  } catch { return {}; }
};
export const saveStats = (s) => {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
};

/**
 * Ergebnis einer Übung festhalten.
 * @param id     Katalog-id (z. B. "def:dB17", "proof:p_cos41", "defcard:d01")
 * @param fails  gemessene Fehlversuche in dieser Sitzung (0 = fehlerfrei)
 */
export function recordOutcome(id, fails = 0) {
  const s = loadStats();
  const cur = s[id] || { attempts: 0, failsTotal: 0, cleanSolves: 0, lastFails: 0, strength: 0, lastSeen: 0 };
  cur.attempts += 1;
  cur.failsTotal += fails;
  cur.lastFails = fails;
  if (fails === 0) {
    cur.cleanSolves += 1;
    cur.strength = cur.strength + (1 - cur.strength) * 0.45; // Richtung Beherrschung
  } else {
    // je mehr Fehlversuche, desto stärker fällt die Stärke (gedeckelt)
    const hit = Math.min(fails, 4) / 4;
    cur.strength = Math.max(0, cur.strength * (0.6 - 0.3 * hit));
  }
  cur.lastSeen = Date.now();
  s[id] = cur;
  saveStats(s);
  return cur;
}

// Gewicht für die gewichtete Zufallsauswahl: höher = eher vorgeschlagen.
export function weightFor(id, stats, now = Date.now()) {
  const st = stats[id];
  if (!st || !st.attempts) return 3; // noch nie geübt → klar bevorzugen
  const days = (now - (st.lastSeen || 0)) / DAY;
  const recency = 1 + Math.min(days / 3, 2); // länger her → fälliger (bis 3×)
  const base = 1 - 0.8 * st.strength; // stark → wenig Gewicht
  return Math.max(0.15, base) * recency; // Boden: Starke tauchen selten trotzdem auf
}

// gewichteter Zufalls-Zug aus einer id-Liste (optional das zuletzt gezeigte auslassen)
export function pickWeighted(ids, stats, exclude = null) {
  if (!ids.length) return null;
  const cand = ids.length > 1 && exclude ? ids.filter((x) => x !== exclude) : ids;
  const list = cand.length ? cand : ids;
  const w = list.map((id) => weightFor(id, stats));
  const sum = w.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < list.length; i++) { r -= w[i]; if (r <= 0) return list[i]; }
  return list[list.length - 1];
}

export const strengthOf = (id, stats) => (stats[id]?.attempts ? stats[id].strength : null);
