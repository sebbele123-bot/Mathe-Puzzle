/* ==========================================================================
   Mathe-Schmiede — Spiellogik
   --------------------------------------------------------------------------
   Idee: Löse Rechenaufgaben, verdiene Rohstoffe (Holz, Stein, Eisen, ...)
   und schmiede daraus Gegenstände. Jeder Bau bringt Punkte und Level.
   Der Spielstand wird im localStorage gespeichert.
   ========================================================================== */

(() => {
  "use strict";

  /* -----------------------------------------------------------------------
     Definitionen
     ----------------------------------------------------------------------- */

  // Rohstoffe: Reihenfolge = Anzeigereihenfolge, Seltenheit steigt nach unten.
  const RESOURCES = {
    holz:     { icon: "🪵", name: "Holz" },
    stein:    { icon: "🪨", name: "Stein" },
    eisen:    { icon: "⛓️", name: "Eisen" },
    kristall: { icon: "💎", name: "Kristall" },
    gold:     { icon: "🥇", name: "Gold" },
  };

  // Baurezepte. reqLevel = ab welchem Level freigeschaltet.
  const RECIPES = [
    { id: "fackel",   icon: "🔥", name: "Fackel",        reqLevel: 1, points: 15,  cost: { holz: 2 } },
    { id: "hammer",   icon: "🔨", name: "Hammer",        reqLevel: 1, points: 25,  cost: { holz: 2, stein: 2 } },
    { id: "schild",   icon: "🛡️", name: "Schild",        reqLevel: 2, points: 40,  cost: { holz: 3, eisen: 2 } },
    { id: "schwert",  icon: "⚔️", name: "Schwert",       reqLevel: 2, points: 55,  cost: { eisen: 3, holz: 1 } },
    { id: "ruestung", icon: "🥋", name: "Rüstung",       reqLevel: 3, points: 80,  cost: { eisen: 4, stein: 2 } },
    { id: "amulett",  icon: "📿", name: "Kristall-Amulett", reqLevel: 3, points: 110, cost: { kristall: 2, gold: 1 } },
    { id: "krone",    icon: "👑", name: "Königskrone",   reqLevel: 4, points: 180, cost: { gold: 3, kristall: 2 } },
    { id: "portal",   icon: "🌀", name: "Magisches Portal", reqLevel: 5, points: 300, cost: { kristall: 4, gold: 3, eisen: 5 } },
  ];

  // Punkte, die für den Levelaufstieg nötig sind (kumulativ berechnet).
  const POINTS_PER_LEVEL = 150;

  const STORAGE_KEY = "mathe-schmiede-v1";

  /* -----------------------------------------------------------------------
     Spielzustand
     ----------------------------------------------------------------------- */

  const defaultState = () => ({
    level: 1,
    score: 0,
    streak: 0,
    bestStreak: 0,
    difficulty: 2,
    resources: { holz: 0, stein: 0, eisen: 0, kristall: 0, gold: 0 },
    built: {}, // recipeId -> Anzahl
  });

  let state = loadState();
  let current = null;      // aktuelle Aufgabe { text, answer }
  let timer = null;        // Intervall-Handle für die Zeitleiste
  let timeLeft = 1;        // 1..0 (Anteil)

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      // Mit Default zusammenführen, damit fehlende Felder ergänzt werden.
      const base = defaultState();
      return {
        ...base,
        ...parsed,
        resources: { ...base.resources, ...(parsed.resources || {}) },
        built: { ...(parsed.built || {}) },
      };
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* Speicher nicht verfügbar — Spiel läuft trotzdem weiter. */
    }
  }

  /* -----------------------------------------------------------------------
     DOM-Referenzen
     ----------------------------------------------------------------------- */

  const el = {
    level: document.getElementById("level-value"),
    score: document.getElementById("score-value"),
    streak: document.getElementById("streak-value"),
    problem: document.getElementById("problem"),
    form: document.getElementById("answer-form"),
    input: document.getElementById("answer-input"),
    feedback: document.getElementById("feedback"),
    timerFill: document.getElementById("timer-fill"),
    rewardLog: document.getElementById("reward-log"),
    resourceList: document.getElementById("resource-list"),
    recipeList: document.getElementById("recipe-list"),
    trophyList: document.getElementById("trophy-list"),
    difficulty: document.getElementById("difficulty-select"),
    reset: document.getElementById("reset-btn"),
    toastLayer: document.getElementById("toast-layer"),
  };

  /* -----------------------------------------------------------------------
     Aufgaben-Generator
     ----------------------------------------------------------------------- */

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Erzeugt eine Aufgabe passend zur gewählten Schwierigkeit.
  function generateProblem(difficulty) {
    const d = Number(difficulty);
    let ops, max;
    switch (d) {
      case 1: ops = ["+", "-"];               max = 10;  break;
      case 2: ops = ["+", "-", "×"];          max = 20;  break;
      case 3: ops = ["+", "-", "×", "÷"];     max = 50;  break;
      default: ops = ["+", "-", "×", "÷"];    max = 100; break;
    }
    const op = pick(ops);

    let a, b, answer, text;
    if (op === "+") {
      a = randInt(1, max); b = randInt(1, max);
      answer = a + b; text = `${a} + ${b}`;
    } else if (op === "-") {
      a = randInt(1, max); b = randInt(1, a); // kein negatives Ergebnis
      answer = a - b; text = `${a} − ${b}`;
    } else if (op === "×") {
      const m = d >= 4 ? 12 : (d === 3 ? 12 : 10);
      a = randInt(2, m); b = randInt(2, m);
      answer = a * b; text = `${a} × ${b}`;
    } else { // ÷ — immer ganzzahlig
      const m = d >= 4 ? 12 : 10;
      b = randInt(2, m); answer = randInt(2, m);
      a = b * answer; text = `${a} ÷ ${b}`;
    }
    return { text, answer };
  }

  /* -----------------------------------------------------------------------
     Belohnungen
     ----------------------------------------------------------------------- */

  // Welche Rohstoffe kann man auf welcher Schwierigkeit finden?
  function rewardPool(difficulty) {
    const d = Number(difficulty);
    if (d === 1) return ["holz", "holz", "stein"];
    if (d === 2) return ["holz", "stein", "stein", "eisen"];
    if (d === 3) return ["stein", "eisen", "eisen", "kristall"];
    return ["eisen", "kristall", "kristall", "gold"];
  }

  // Bonus-Rohstoff bei langer Serie.
  function grantReward(difficulty, speedBonus) {
    const gains = {};
    const pool = rewardPool(difficulty);
    const main = pick(pool);
    gains[main] = (gains[main] || 0) + 1;

    // Serien-Bonus: alle 3 richtigen in Folge ein Extra-Rohstoff.
    if (state.streak > 0 && state.streak % 3 === 0) {
      const bonus = pick(pool);
      gains[bonus] = (gains[bonus] || 0) + 1;
    }
    // Tempo-Bonus: schnell geantwortet -> Chance auf seltenen Rohstoff.
    if (speedBonus && Math.random() < 0.35) {
      const rare = Number(difficulty) >= 3 ? "kristall" : "eisen";
      gains[rare] = (gains[rare] || 0) + 1;
    }

    for (const [res, n] of Object.entries(gains)) {
      state.resources[res] = (state.resources[res] || 0) + n;
    }
    return gains;
  }

  function pointsForAnswer(difficulty, speedBonus) {
    const base = 5 * Number(difficulty);
    const streakBonus = Math.min(state.streak, 10); // bis +10
    const speed = speedBonus ? 5 : 0;
    return base + streakBonus + speed;
  }

  /* -----------------------------------------------------------------------
     Level
     ----------------------------------------------------------------------- */

  function levelForScore(score) {
    return Math.max(1, Math.floor(score / POINTS_PER_LEVEL) + 1);
  }

  function checkLevelUp() {
    const newLevel = levelForScore(state.score);
    if (newLevel > state.level) {
      state.level = newLevel;
      showToast(`Level ${newLevel}! 🎉`, "good");
      logReward(`⬆️ Aufgestiegen auf Level ${newLevel} — neue Rezepte verfügbar!`);
    }
  }

  /* -----------------------------------------------------------------------
     Rendering
     ----------------------------------------------------------------------- */

  function renderStats() {
    el.level.textContent = state.level;
    el.score.textContent = state.score;
    el.streak.textContent = state.streak;
  }

  function renderResources(bumpKeys = []) {
    el.resourceList.innerHTML = "";
    for (const [key, def] of Object.entries(RESOURCES)) {
      const li = document.createElement("li");
      li.className = "resource" + (bumpKeys.includes(key) ? " bump" : "");
      li.innerHTML = `
        <span class="r-icon">${def.icon}</span>
        <span class="r-name">${def.name}</span>
        <span class="r-count">${state.resources[key] || 0}</span>`;
      el.resourceList.appendChild(li);
    }
  }

  function canAfford(recipe) {
    return Object.entries(recipe.cost).every(
      ([res, n]) => (state.resources[res] || 0) >= n
    );
  }

  function renderRecipes() {
    el.recipeList.innerHTML = "";
    for (const recipe of RECIPES) {
      const unlocked = state.level >= recipe.reqLevel;
      const affordable = unlocked && canAfford(recipe);

      const li = document.createElement("li");
      li.className = "recipe" + (!unlocked ? " locked" : affordable ? " craftable" : "");

      const costChips = Object.entries(recipe.cost)
        .map(([res, n]) => {
          const have = state.resources[res] || 0;
          const cls = have >= n ? "ok" : "missing";
          return `<span class="cost-chip ${cls}">${RESOURCES[res].icon} ${have}/${n}</span>`;
        })
        .join("");

      li.innerHTML = `
        <div class="recipe-top">
          <span class="recipe-icon">${recipe.icon}</span>
          <span class="recipe-name">${recipe.name}</span>
          <span class="recipe-reward">+${recipe.points}</span>
        </div>
        <div class="recipe-cost">${costChips}</div>
        ${
          unlocked
            ? `<button class="btn btn-primary btn-craft" data-recipe="${recipe.id}" ${affordable ? "" : "disabled"}>Schmieden</button>`
            : `<div class="req-level">🔒 ab Level ${recipe.reqLevel}</div>`
        }`;
      el.recipeList.appendChild(li);
    }
  }

  function renderTrophies() {
    el.trophyList.innerHTML = "";
    for (const recipe of RECIPES) {
      const count = state.built[recipe.id] || 0;
      if (count <= 0) continue;
      const li = document.createElement("li");
      li.className = "trophy";
      li.innerHTML = `
        <span class="t-icon">${recipe.icon}</span>
        <span class="t-name">${recipe.name}</span>
        <span class="t-count">×${count}</span>`;
      el.trophyList.appendChild(li);
    }
  }

  function renderAll(bumpKeys) {
    renderStats();
    renderResources(bumpKeys);
    renderRecipes();
    renderTrophies();
  }

  /* -----------------------------------------------------------------------
     Feedback / Effekte
     ----------------------------------------------------------------------- */

  function showToast(text, kind = "") {
    const t = document.createElement("div");
    t.className = "toast" + (kind ? " " + kind : "");
    t.textContent = text;
    el.toastLayer.appendChild(t);
    setTimeout(() => t.remove(), 1100);
  }

  function logReward(text) {
    const entry = document.createElement("div");
    entry.className = "entry";
    entry.textContent = text;
    el.rewardLog.prepend(entry);
    // Nur die letzten 4 Einträge behalten.
    while (el.rewardLog.children.length > 4) {
      el.rewardLog.lastChild.remove();
    }
  }

  function describeGains(gains) {
    return Object.entries(gains)
      .map(([res, n]) => `${n}× ${RESOURCES[res].icon} ${RESOURCES[res].name}`)
      .join(", ");
  }

  /* -----------------------------------------------------------------------
     Zeitleiste (Tempo-Bonus)
     ----------------------------------------------------------------------- */

  const BONUS_WINDOW_MS = 6000; // innerhalb dieser Zeit gibt es Tempo-Bonus

  function startTimer() {
    stopTimer();
    timeLeft = 1;
    el.timerFill.style.width = "100%";
    const started = Date.now();
    timer = setInterval(() => {
      const elapsed = Date.now() - started;
      timeLeft = Math.max(0, 1 - elapsed / BONUS_WINDOW_MS);
      el.timerFill.style.width = (timeLeft * 100).toFixed(1) + "%";
      if (timeLeft <= 0) stopTimer();
    }, 80);
  }

  function stopTimer() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  /* -----------------------------------------------------------------------
     Spielablauf
     ----------------------------------------------------------------------- */

  function nextProblem() {
    current = generateProblem(state.difficulty);
    el.problem.textContent = current.text;
    el.input.value = "";
    el.input.focus();
    startTimer();
  }

  function handleAnswer(evt) {
    evt.preventDefault();
    if (!current) return;

    const raw = el.input.value.trim().replace(",", "."); // Komma erlauben
    if (raw === "") return;
    const guess = Number(raw);
    if (Number.isNaN(guess)) {
      flashFeedback("Bitte eine Zahl eingeben.", "bad");
      return;
    }

    const speedBonus = timeLeft > 0;
    stopTimer();

    if (guess === current.answer) {
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);

      const gains = grantReward(state.difficulty, speedBonus);
      const pts = pointsForAnswer(state.difficulty, speedBonus);
      state.score += pts;

      flashFeedback(`Richtig! +${pts} Punkte${speedBonus ? " ⚡" : ""}`, "good");
      showToast(`+${pts}`, "good");
      logReward(`✅ ${describeGains(gains)}`);

      checkLevelUp();
      saveState();
      renderAll(Object.keys(gains));
      setTimeout(nextProblem, 550);
    } else {
      state.streak = 0;
      flashFeedback(`Leider falsch — die Lösung war ${current.answer}.`, "bad");
      el.problem.classList.add("shake");
      setTimeout(() => el.problem.classList.remove("shake"), 350);
      saveState();
      renderStats();
      setTimeout(nextProblem, 1100);
    }
  }

  function flashFeedback(text, kind) {
    el.feedback.textContent = text;
    el.feedback.className = "feedback " + kind;
  }

  function craft(recipeId) {
    const recipe = RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return;
    if (state.level < recipe.reqLevel || !canAfford(recipe)) return;

    // Kosten abziehen
    for (const [res, n] of Object.entries(recipe.cost)) {
      state.resources[res] -= n;
    }
    state.built[recipeId] = (state.built[recipeId] || 0) + 1;
    state.score += recipe.points;

    showToast(`${recipe.icon} +${recipe.points}`, "good");
    logReward(`⚒️ ${recipe.name} geschmiedet! +${recipe.points} Punkte`);

    checkLevelUp();
    saveState();
    renderAll();
  }

  /* -----------------------------------------------------------------------
     Ereignisse
     ----------------------------------------------------------------------- */

  el.form.addEventListener("submit", handleAnswer);

  el.recipeList.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-recipe]");
    if (btn) craft(btn.dataset.recipe);
  });

  el.difficulty.addEventListener("change", () => {
    state.difficulty = Number(el.difficulty.value);
    saveState();
    nextProblem();
  });

  el.reset.addEventListener("click", () => {
    if (!confirm("Wirklich den gesamten Spielstand zurücksetzen?")) return;
    state = defaultState();
    saveState();
    el.difficulty.value = String(state.difficulty);
    el.rewardLog.innerHTML = "";
    el.feedback.textContent = "";
    renderAll();
    nextProblem();
  });

  /* -----------------------------------------------------------------------
     Start
     ----------------------------------------------------------------------- */

  function init() {
    el.difficulty.value = String(state.difficulty);
    renderAll();
    nextProblem();
  }

  init();
})();
