# AGENTS.md

Guidance for AI coding agents working in this repository. Human-facing docs live in `README.md`; this file is the fast, accurate map of *how the project is built and how to change it safely*.

## What this is

**Mathe-Puzzle** is a browser crafting game for university **Elementargeometrie** (Prof. Soergel, SS 2026). Players rebuild mathematical **definitions**, **structures**, and **proofs** from meaningfully-sized building blocks. No backend — everything is client-side React, state persists in `localStorage`.

The UI language is **German**. Keep all user-facing strings German; code identifiers and comments may be German or English (match the surrounding file).

## Stack & commands

- **Vite 5** + **React 18** (no TypeScript) + **TailwindCSS v3**, icons from `lucide-react`.
- Two test layers: dependency-free Node scripts (`*.test.mjs`) for pure logic, **Vitest + jsdom** (`*.test.jsx`) for component smoke tests.

```bash
npm install
npm run dev        # dev server
npm run build      # production build → dist/
npm run preview    # serve the build locally
npm run build:single   # SINGLEFILE=1 → dist-single/index.html (one self-contained file)
```

- `BASE_PATH` env sets Vite's `base` (used by the Pages workflow to prefix `/Mathe-Puzzle/`). Local builds default to `/`.
- `SINGLEFILE=1` inlines all JS/CSS into one `dist-single/index.html` (via `vite-plugin-singlefile`) — used for the standalone/offline artifact.

## Testing & verification

**`npm test` runs everything** (logic scripts, then Vitest) and is enforced by `.github/workflows/test.yml` on push/PR. Sub-commands: `npm run test:logic`, `npm run test:ui`.

- **Logic tests — plain Node, no framework** (`npm run test:logic`). Each file is standalone and exits non-zero on failure; keep that style when adding one, and wire it into the `test:logic` chain.
  - `src/proof/engine.test.mjs` — rebuilds every proof mission; `engine.edge.test.mjs` — `givenFor` clamping + multiset premises. Run after touching `src/proof/`.
  - `src/data/xp.test.mjs` + `xp.transitions.test.mjs` (stubbed clock: day rollover, streaks), `stats.test.mjs` (strength/weighting), `labels.test.mjs` (`nextHandLabel` relabel rule).
  - `src/data/catalogMeta.test.mjs` — the title/Fach heuristics (see the Catalog gotcha below).
  - `src/data/grounding.test.mjs` — **content integrity**, the check to run after authoring content: proof-mission ids resolve in `FACTS`/`RULES`, `SYMBOL_TASKS` `need`/`distract` ground in the OpenMath palette, every palette symbol has a `DE` label, and every recipe/mission in `StrukturBaukasten.jsx` decomposes to elementary `BLOCKS` with no dangling ids. Because `StrukturBaukasten.jsx` is JSX and can't be imported by plain Node, that part **extracts the data from the source text** — keep the `BLOCKS`/`RESULTS`/`RECIPES`/`MISSIONS` declarations in their current `const X = [/{` form or the extraction regexes need updating (a self-check asserts plausible counts).
- **Component smoke tests — Vitest + jsdom** (`npm run test:ui`, config in `vitest.config.js`, setup in `src/test/setup.js`). Deliberately few: the tap→hammer→result mechanic for both crafters and the `onOutcome → recordStat` chain (`src/App.test.jsx`). `vitest.config.js` scopes `include` to `src/**/*.test.jsx` **on purpose** — the `.mjs` logic scripts call `process.exit` and must not be collected. Helpers in `src/test/utils.jsx` select tiles by visible text (`tapTile`, `hammer`, `clearBench`).
- **UI checks (Playwright):** Chromium is pre-installed at `/opt/pw-browsers`; do **not** run `playwright install`. Launch with:
  ```js
  chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    ignoreDefaultArgs: ['--headless'], args: ['--headless=new', '--no-sandbox'] })
  ```
  (The exact `chromium-####` folder can change; glob `/opt/pw-browsers/chromium-*/chrome-linux/chrome`.) Serve the built app over HTTP (`python3 -m http.server`) and `page.goto` it — `setContent` does not execute the inlined module scripts.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on push to `main` or the active feature branch. **The branch name is hardcoded** in the workflow's `on.push.branches` list (currently `claude/math-crafting-game-p0rebr`) — work on a differently-named branch simply never deploys, with no error. Add the new branch there when the working branch changes. Pages must be enabled once in repo settings (Source: **GitHub Actions**); the workflow token cannot enable it. Live site: **https://sebbele123-bot.github.io/Mathe-Puzzle/**.

## Architecture

Single-page app; `src/App.jsx` holds `mode` and renders one view. The global `Inventory` (hotbar + collectable lager) is always mounted.

| Mode | Component | Purpose |
|------|-----------|---------|
| `bibliothek` | `Bibliothek.jsx` | Catalog of all material; filter/search, rotation, opens other views |
| `training` | `Training.jsx` | The rotation as exercises: strength dots, level/XP header, weighted random draw |
| `werkbank` | `Werkbank.jsx` | 8×12 symbol-crafting grid; free stamping **and** Symbol-Aufgaben (`SYMBOL_TASKS`) |
| `bausteine` | `OpenMathPalette.jsx` | 243-symbol library in 21 categories; **+** collects a symbol into the inventory |
| `beweis` | `proof/BeweisCrafter.jsx` | Proof crafter (grid werkbench + inference engine) |
| `definition` | `StrukturBaukasten.jsx` | Structure crafter (grid werkbench + recipe engine) |
| `steckbrief` | `Steckbrief.jsx` | Read-only definition card; no nav button — reachable only from Bibliothek or Training |
| `karte` | `Karteikarte.jsx` | **Karteikarte** — how a single catalog entry is opened everywhere (Bibliothek *and* Training) |

### Karteikarte
A single catalog entry is a **Karteikarte**. It offers several modes and draws **one per opening**, based on the measured strength (`pickModus` in `src/data/karten.js`): never practised or weak → `bauen` (Stufe 0 hands over most parts), middling → build or quiz, strong → `quiz`. The player can override the draw with the mode chips.

- **`bauen`** delegates to the existing crafter for that entry, with an automatic **Stufe** from the strength (`stufeFor`): weak → many prefabricated parts, strong → from scratch. Proofs use their existing `depths` (`initialDepth`); structure lessons and symbol tasks pre-supply the first *n* parts (`vorgaben`) — the last step always stays for the player.
- **`quiz`** uses hand-written questions in `src/data/quiz.js` (`abcd` or `janein`, each with a `hinweis` that explains rather than just scoring). A card without questions simply doesn't offer the mode.
  **The answer options are shuffled on every showing** (`mischeOptionen`) — in the raw data the correct answer sits at index 0 in 6 of 7 questions, so without shuffling "always pick the first" would score 86 % and the quiz would measure nothing. Keep `richtig` as the index into the *stored* order; the shuffle maps it. A component test fails if the shuffle is ever removed.
- **`aufloesung`** shows the definition plus *„Wozu"* — for structures derived from `RECIPES`: which other structures consume this one.

Only **Bauen** and **Quiz** award XP; the Auflösung reports nothing. The amount follows the difficulty 1–10 (see `data/schwierigkeit.js`), not the card type. `pickModus` therefore only ever draws an exercise — the Auflösung stays available as a tab but is never set as the task. `karten.js` is deliberately JSX-free so the logic is Node-testable (`karten.test.mjs`).

**Only trainable cards may enter the rotation.** `istUebbar(item)` = buildable **or** has quiz questions. A card offering nothing but the Auflösung would count as "practised" by merely being looked at, raising its strength without anything being tested — so its rotation button is disabled (removing an *existing* entry stays possible, or old entries would be stuck). `uebbareIds` filters the stored rotation both at the draw (`App.nextInRotation`) and in the Training list, so display and draw agree. Currently 63 of 91 entries are trainable; the other 28 are Steckbriefe without questions — writing questions for one makes it trainable, no code change needed.

`App` routes "open from library" via `openReq` (`{definition, beweis, steckbrief, werkbank}`) + `initialId`/`taskId` props. Switching mode swaps the rendered component, so views mount fresh; a view that must react to a *new* target while already mounted needs a `useEffect` on `[initialId]` (as in `StrukturBaukasten` and `BeweisCrafter`) — a `useState` initializer alone would keep the stale mission. The active hotbar symbol is lifted from `Inventory` to `App` via `onActive` and passed to `Werkbank` as `hand`.

Every exercise view reports back through **`onOutcome(id, fails)`**; `App.recordStat` turns that into a namespaced catalog id (`proof:`, `def:`, `sym:`, `defcard:`), writes the rotation statistic and awards XP. The **Weiter-Schleife** (session bar above the nav, `award` state) shows the XP gained and draws the next rotation item without a detour through the Bibliothek — keep new exercise modes wired into `recordStat`, or they stay invisible to rotation and level.

### Werkbench interaction (both crafters)
Both `BeweisCrafter` and `StrukturBaukasten` use the **same grid mechanic** — do not reintroduce free-drag:
- Tap a shelf/palette tile → places it in the first empty grid cell.
- Tap a filled cell → clears it.
- **Hammer** evaluates *all placed cells together* (position-independent) against the engine; on success it consumes them and drops the result into cell 0 (also added to `have`/`discovered`).

### Two engines
- **Proofs** — `proof/engine.js` `craftFromCluster(mission, have, tiles)`: needs exactly one rule + a premise multiset matching a `steps` entry; enforces "premises must already be known" (Ordnungszwang). Data in `proof/data.js` (`FACTS`, `RULES`, `MISSIONS`).
- **Structures** — recipe match in `StrukturBaukasten.jsx`: `RECIPES` is `{ need: [...blockIds], result }`, matched as a **set** (`eqSet`). Ids resolve via `BLOCKS` (elementary) or `RESULTS` (buildable; `chainable: true` ones become placeable blocks). `MISSIONS` are lessons (`base` = given, `steps` = structures to build).
- **Symbol tasks** — `data/symboldefs.js` `SYMBOL_TASKS`: a definition assembled in the Werkbank from its defining symbol blocks. `need` = required symbol ids (set match, order irrelevant), `distract` = tempting extras that must *not* be placed, `beschreibung` = the short prose shown after a correct build. Grounded in `openmath.js` ids — verify each `need`/`distract` id exists there when authoring.

### Progress: strength & level
Two independent stores, both fed from `recordStat`:
- **`data/stats.js`** — Anki-style rotation statistic. Per catalog id it records `attempts`, `failsTotal`, `cleanSolves`, `lastFails`, `lastSeen` and derives a **strength 0..1** (`strengthOf`; `null` = never practised). The rotation draws **randomly weighted by weakness**, so weak and stale items come up more often — it is not a sorted queue. Training lists items weakest-first only as a display.
- **`data/xp.js`** — XP and levels, deliberately pointed the same direction: base × weakness factor × `REPEAT` damping (1 / 0.4 / 0.2 / 0.1 for the *n*-th solve of the same item on one day), plus `CLEAN_BONUS` and `FIRST_SOLVE_BONUS`. `xpForNext(level) = 80 + 40·(level−1)`. The damping exists to stop grinding one easy item — don't replace the multipliers with flat point awards.
  **The base comes from the difficulty** (`XP_PRO_STUFE · schwierigkeit`, 4…40 for 1…10); `BASE` per type is only the fallback when no difficulty is supplied. **Only Bauen and Quiz award XP** — the Auflösung reports nothing at all, so looking something up never moves progress.

- **`data/schwierigkeit.js`** — every exercise carries a difficulty 1–10. **When you add a quiz question or a build task, rating it is not optional:** `schwierigkeit.test.jsx` fails and names the offending card until it is either rated in `SCHWIERIGKEIT` or explicitly listed in `SCHAETZUNG_OK` (= "the estimate is fine here"). A reminder alone would be skipped; the failing test is what actually enforces it. The **scale with anchor examples** is the doc comment above `SCHWIERIGKEIT` — use it so ratings stay comparable, and keep the chain monotone (nothing that builds on another task may be rated easier; the test checks the Halbgruppe → … → Kongruenzebene chain). A hand-written entry in `SCHWIERIGKEIT` (keyed by catalog id) always wins; otherwise it is *estimated* from the size of the task (`geschaetzt`, anchored at `ROH_MIN`/`ROH_MAX` so new content doesn't shift the scale). The estimate is a stopgap: symbol tasks all measure 4–5 blocks even though Halbgruppe and Kongruenzebene are worlds apart — those are hand-rated, and anything that feels wrong should be. Quiz questions do **not** carry a typed number. Their difficulty is *derived* from three named parts (`frageSchwierigkeit`), so it cannot drift and every question carries its own justification:
  `anforderung` (nachschlagen 1 · unterscheiden 2 · folgern 3 · grenzfall 4 · beweisidee 5) — what you must *do* with the knowledge;
  `distraktoren` (fern 0 · plausibel 1 · nah 2, ABCD only) — how close the wrong answers sit, the strongest lever in multiple choice;
  minus 1 for `janein`, because a coin flip already wins half the time.
  A run reports the **sum** over its questions (`quizSchwierigkeit`), so more questions and harder questions both pay more. The 1–10 scale applies per question — a run may exceed 10, which is why `awardXp` only guards against nonsense (`STUFE_MAX`) instead of clamping to 10.

## Data model & content authoring

| File | Holds | Add content by… |
|------|-------|-----------------|
| `src/proof/data.js` | Proof facts, rules, missions | new `FACTS`/`RULES`, a `MISSIONS` entry (`goal`, `pool`, `steps`, `depths`, optional `vocab` Begriffs-Gate) |
| `src/StrukturBaukasten.jsx` | `BLOCKS`, `RESULTS`, `RECIPES`, `MISSIONS` | add elementary `BLOCKS`, a `RESULTS` entry + a `RECIPES` line grounded in blocks, then a `MISSIONS` lesson |
| `src/data/definitions.js` | 30 ElGeo core definitions (Steckbriefe D1–D30) | append to the `D` array (`nr`, `t` theme index, `term`, `statement`, `uebung?`, `tags`) |
| `src/data/openmath.js` | 243 symbols in 21 `PALETTE_CATEGORIES` (OpenMath + Ergänzungen + Struktur-Axiome, Strukturen, Platzhalter), German labels in `DE` | extend the category arrays **and** the `DE` map — a symbol without a `DE` entry shows its raw id |
| `src/data/symboldefs.js` | `SYMBOL_TASKS` — Werkbank definition puzzles | add `{ id, term, ref, need, distract, beschreibung }`; ids must exist in `openmath.js` |
| `src/data/labels.js` | `RENAMABLE` — which blocks carry a letter, and how they render | add `id: { tpl, def }`; `$` in `tpl` is replaced by the label (`"$"` = bare letter, `"($,∘)"` = structure notation) |
| `src/data/stats.js` | rotation statistic + `strengthOf` | no content; change only the strength model |
| `src/data/xp.js` | XP curve, level thresholds, repeat damping | tune constants at the top of the file |
| `src/data/symbols.js` | shared symbol list + `localStorage` collection helpers | usually no change |
| `src/data/catalog.js` | unifies **four** sources — structure lessons (`def:`), proof missions (`proof:`), Steckbriefe (`defcard:`), symbol tasks (`sym:`) — into one catalog | derives metadata via `parseTitle`; assigns `fach`, `typ`, `rubrik` |

**Catalog gotcha:** `fach` is assigned by string heuristics, not by a field you set. `fachFor` sends anything containing *Neutralelement* or a `Basis…` code to `algebra`, everything else to `elgeo`; symbol tasks are classified by `/Def \d/.test(t.ref)`. So a new symbol task lands in `elgeo` only if its `ref` reads like `"Def 3.1"` — otherwise it silently shows up under Algebra. Check where a new entry appears in the Bibliothek after adding it. Note also that `catalog.js` imports `StrukturBaukasten.jsx`, so it **cannot be loaded by plain Node** (`ERR_UNKNOWN_FILE_EXTENSION`) — verification scripts must extract the data, not import it. The heuristics themselves (`parseTitle`, `fachFor`, `fachForSymbolRef`, `tagsFor`) therefore live in **`src/data/catalogMeta.js`**, which is free of JSX imports and unit-tested by `catalogMeta.test.mjs`; `catalog.js` imports and re-exports them. Keep new heuristics there. Catalog-wide invariants (unique ids, valid Fach/Typ/Rubrik, sorting) are checked by `catalog.test.jsx` under Vitest, which *can* resolve the JSX chain.

**Tag matching is case-sensitive**, so a compound word does not pick up the tag of its lowercased part — `Drehspiegelgruppe` gets only `Drehspiegelung`, not `Gruppe` or `Spiegelung`. Add an explicit `TAG_HINTS` entry if a compound needs its own tag.

**Bibliothek grouping:** Fach → **Rubrik** (`Definitionen` / `Sätze` / `Übungsblätter`, `RUBRIKEN` in `catalog.js`) → Quelle. Rubriken are collapsible (default collapsed, auto-open when a filter/search is active). Filters (Fach/Typ/Thema) are **multi-select arrays**. Rotation is a curated list in `localStorage`.

**Faithful build schemes:** `StrukturBaukasten.jsx` contains a "Bauschema" layer where all *buildable* A/B definitions decompose fully into elementary blocks (e.g. Kongruenzebene → affine Ebene + Translationen + Drehspiegelgruppe → Strahl → ℝ≥0·v). Five definitions are intentionally **not** buildable because they need higher-order constructors beyond "conjunction of ingredients": **Orientierung** (quotient), **Spiegelung/Drehung** (derived classification — belongs in proof mode), **Längengerade** (tensor/invariant), **Winkelgruppe** (covering), **Möbius** (generated group). Don't force-fit these into flat recipes.

## Conventions & gotchas

- **No explanatory or tutorial text** in the product unless explicitly requested. Don't add intro paragraphs, how-to hints, onboarding copy, or "so funktioniert's" blurbs to the UI. Keep labels and content functional; the game teaches through interaction, not prose.
- **Hand slot / labels.** The hotbar mirrors the *inventory* (immutable defaults); the **Hand** slot next to it holds a working copy of the selected block. On desktop, typing a letter relabels the block **in the hand only** — the inventory entry never changes. Typing the same letter twice within 700 ms yields its Greek counterpart (`ff` → φ, `ww` → ω); the label adopts the default's case (group `G` + `h` → `H`). Switching hotbar slots resets the label to the default. Renamable blocks and their display templates live in `src/data/labels.js` (`RENAMABLE`, `tpl` with `$`); placed cells store `{ id, label }`. No relabeling on mobile — deliberate. `E` stays the inventory toggle, so `e` is not available as a label.
- **Inventory starts empty.** Do not auto-fill the hotbar. Symbols enter the inventory only by collecting them in **Bausteine** (the **+** on a tile). `localStorage` keys: `mp_hotbar_v2`, `mp_inventory_v1`, `mp_werkbank_v2`, `mp_rotation_v1`, `mp_stats_v1`, `mp_xp_v1`. Bump the version suffix when changing a schema so stale data doesn't linger — `mp_stats_v1` and `mp_xp_v1` are the player's actual progress, so migrate rather than drop them if the shape has to change.
- **Mobile-first.** Long chip rows must be single horizontally-scrollable lines (`overflow-x-auto`, not `flex-wrap`); the top nav shows only the active mode's label on small screens so the fullscreen button stays visible; theme-aware and responsive.
- **Definition sign:** write `:=` with a tiny "Definition" label above it, not the word "Definition".
- **Colors** are per-file `C` objects (paper `#EAEEF2`, ink `#1B2430`, plus role hues). Reuse them; match the existing palette.
- Fullscreen only works when the app is opened in its own tab (blocked inside embedded/artifact iframes) — the toggle already shows an explanatory hint; keep it.

## Known limitations / open work

- **Labels are cosmetic so far.** Placed cells store `{ id, label }`, but both matchers compare **ids only** (`eqSet(r.need, ids)` in `StrukturBaukasten.jsx`, the sorted `task.need` join in `Werkbank.jsx`). A block renamed in the hand therefore solves a task exactly like the default one. The intended next step is **matching up to renaming**: a solution counts when a *consistent* bijection of labels maps the built term onto the target (`f∘g` ≙ `g∘h`), so the letter choice is free but reusing one letter for two different roles fails. Implement it in the matchers, not by baking letters into the recipes.
- **Five definitions are deliberately unbuildable** (Orientierung, Spiegelung/Drehung, Längengerade, Winkelgruppe, Möbius) — see "Faithful build schemes" above. Don't force-fit them into flat recipes.
- **Self-assessment doesn't exist yet.** `strengthOf` derives strength purely from measured attempts/failures; the docstring in `stats.js` anticipates a personal rating that additionally shifts it.
- **No relabeling on mobile** — deliberate, not a bug.

## Publishing the standalone artifact (claude.ai)

When asked to update the live artifact: `npm run build:single`, then extract the inlined `<style>`+`<script>` from `dist-single/index.html` into a fragment file (no `<html>/<head>/<body>`, just styles + `<div id="root"></div>` + scripts) and publish that file to the **same** artifact URL to keep it stable.

## Git

Work on the designated feature branch (`claude/math-crafting-game-p0rebr`), commit with clear messages, push with `git push -u origin <branch>`. Only open a PR when explicitly asked. Do not commit `dist/`, `dist-single/`, or `node_modules/` (already git-ignored).
