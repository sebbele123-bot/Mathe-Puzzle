# AGENTS.md

Guidance for AI coding agents working in this repository. Human-facing docs live in `README.md`; this file is the fast, accurate map of *how the project is built and how to change it safely*.

## What this is

**Mathe-Puzzle** is a browser crafting game for university **Elementargeometrie** (Prof. Soergel, SS 2026). Players rebuild mathematical **definitions**, **structures**, and **proofs** from meaningfully-sized building blocks. No backend — everything is client-side React, state persists in `localStorage`.

The UI language is **German**. Keep all user-facing strings German; code identifiers and comments may be German or English (match the surrounding file).

## Stack & commands

- **Vite 5** + **React 18** (no TypeScript) + **TailwindCSS v3**, icons from `lucide-react`.
- No test runner framework; tests are a plain Node script + ad-hoc Playwright.

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

- **Proof engine unit test (no browser):** `node src/proof/engine.test.mjs`. Run this after touching `src/proof/`.
- **Recipe grounding:** when editing `StrukturBaukasten.jsx` recipes, verify every `need`/`step`/`base` id exists and every buildable structure decomposes to elementary `BLOCKS` (no dangling ids). A throwaway Node script that extracts `BLOCKS`/`RESULTS`/`RECIPES` and recursively expands each result to leaves is the reliable check.
- **UI checks (Playwright):** Chromium is pre-installed at `/opt/pw-browsers`; do **not** run `playwright install`. Launch with:
  ```js
  chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    ignoreDefaultArgs: ['--headless'], args: ['--headless=new', '--no-sandbox'] })
  ```
  (The exact `chromium-####` folder can change; glob `/opt/pw-browsers/chromium-*/chrome-linux/chrome`.) Serve the built app over HTTP (`python3 -m http.server`) and `page.goto` it — `setContent` does not execute the inlined module scripts.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on push to `main` or the active feature branch. Pages must be enabled once in repo settings (Source: **GitHub Actions**); the workflow token cannot enable it. Live site: **https://sebbele123-bot.github.io/Mathe-Puzzle/**.

## Architecture

Single-page app; `src/App.jsx` holds `mode` and renders one view. The global `Inventory` (hotbar + collectable lager) is always mounted.

| Mode | Component | Purpose |
|------|-----------|---------|
| `bibliothek` | `Bibliothek.jsx` | Catalog of all material; filter/search, rotation, opens other views |
| `werkbank` | `Werkbank.jsx` | 8×12 symbol-crafting grid; stamps the active hotbar symbol |
| `bausteine` | `OpenMathPalette.jsx` | 233-symbol OpenMath library; **+** collects a symbol into the inventory |
| `beweis` | `proof/BeweisCrafter.jsx` | Proof crafter (grid werkbench + inference engine) |
| `definition` | `StrukturBaukasten.jsx` | Structure crafter (grid werkbench + recipe engine) |
| `steckbrief` | `Steckbrief.jsx` | Read-only definition card; reachable only via Bibliothek |

`App` routes "open from library" via `openReq` (`{definition, beweis, steckbrief}`) + `initialId` props; views remount on mode switch and read `initialId`. The active hotbar symbol is lifted from `Inventory` to `App` via `onActive` and passed to `Werkbank`.

### Werkbench interaction (both crafters)
Both `BeweisCrafter` and `StrukturBaukasten` use the **same grid mechanic** — do not reintroduce free-drag:
- Tap a shelf/palette tile → places it in the first empty grid cell.
- Tap a filled cell → clears it.
- **Hammer** evaluates *all placed cells together* (position-independent) against the engine; on success it consumes them and drops the result into cell 0 (also added to `have`/`discovered`).

### Two engines
- **Proofs** — `proof/engine.js` `craftFromCluster(mission, have, tiles)`: needs exactly one rule + a premise multiset matching a `steps` entry; enforces "premises must already be known" (Ordnungszwang). Data in `proof/data.js` (`FACTS`, `RULES`, `MISSIONS`).
- **Structures** — recipe match in `StrukturBaukasten.jsx`: `RECIPES` is `{ need: [...blockIds], result }`, matched as a **set** (`eqSet`). Ids resolve via `BLOCKS` (elementary) or `RESULTS` (buildable; `chainable: true` ones become placeable blocks). `MISSIONS` are lessons (`base` = given, `steps` = structures to build).

## Data model & content authoring

| File | Holds | Add content by… |
|------|-------|-----------------|
| `src/proof/data.js` | Proof facts, rules, missions | new `FACTS`/`RULES`, a `MISSIONS` entry (`goal`, `pool`, `steps`, `depths`, optional `vocab` Begriffs-Gate) |
| `src/StrukturBaukasten.jsx` | `BLOCKS`, `RESULTS`, `RECIPES`, `MISSIONS` | add elementary `BLOCKS`, a `RESULTS` entry + a `RECIPES` line grounded in blocks, then a `MISSIONS` lesson |
| `src/data/definitions.js` | 30 ElGeo core definitions (Steckbriefe D1–D30) | append to the `D` array (`nr`, `t` theme index, `term`, `statement`, `uebung?`, `tags`) |
| `src/data/openmath.js` | 233 categorized symbols (OpenMath + Ergänzungen), German labels | extend the category arrays and the `DE` map |
| `src/data/symbols.js` | shared symbol list + `localStorage` collection helpers | usually no change |
| `src/data/catalog.js` | unifies proofs + structure lessons + Steckbriefe into one catalog | derives metadata via `parseTitle`; assigns `fach`, `typ`, `rubrik` |

**Bibliothek grouping:** Fach → **Rubrik** (`Definitionen` / `Sätze` / `Übungsblätter`, `RUBRIKEN` in `catalog.js`) → Quelle. Rubriken are collapsible (default collapsed, auto-open when a filter/search is active). Filters (Fach/Typ/Thema) are **multi-select arrays**. Rotation is a curated list in `localStorage`.

**Faithful build schemes:** `StrukturBaukasten.jsx` contains a "Bauschema" layer where all *buildable* A/B definitions decompose fully into elementary blocks (e.g. Kongruenzebene → affine Ebene + Translationen + Drehspiegelgruppe → Strahl → ℝ≥0·v). Five definitions are intentionally **not** buildable because they need higher-order constructors beyond "conjunction of ingredients": **Orientierung** (quotient), **Spiegelung/Drehung** (derived classification — belongs in proof mode), **Längengerade** (tensor/invariant), **Winkelgruppe** (covering), **Möbius** (generated group). Don't force-fit these into flat recipes.

## Conventions & gotchas

- **No explanatory or tutorial text** in the product unless explicitly requested. Don't add intro paragraphs, how-to hints, onboarding copy, or "so funktioniert's" blurbs to the UI. Keep labels and content functional; the game teaches through interaction, not prose.
- **Hand slot / labels.** The hotbar mirrors the *inventory* (immutable defaults); the **Hand** slot next to it holds a working copy of the selected block. On desktop, typing a letter relabels the block **in the hand only** — the inventory entry never changes. Typing the same letter twice within 700 ms yields its Greek counterpart (`ff` → φ, `ww` → ω); the label adopts the default's case (group `G` + `h` → `H`). Switching hotbar slots resets the label to the default. Renamable blocks and their display templates live in `src/data/labels.js` (`RENAMABLE`, `tpl` with `$`); placed cells store `{ id, label }`. No relabeling on mobile — deliberate. `E` stays the inventory toggle, so `e` is not available as a label.
- **Inventory starts empty.** Do not auto-fill the hotbar. Symbols enter the inventory only by collecting them in **Bausteine** (the **+** on a tile). `localStorage` keys: `mp_hotbar_v2`, `mp_inventory_v1`, `mp_werkbank_v1`, `mp_rotation_v1`. Bump the version suffix when changing a schema so stale data doesn't linger.
- **Mobile-first.** Long chip rows must be single horizontally-scrollable lines (`overflow-x-auto`, not `flex-wrap`); the top nav shows only the active mode's label on small screens so the fullscreen button stays visible; theme-aware and responsive.
- **Definition sign:** write `:=` with a tiny "Definition" label above it, not the word "Definition".
- **Colors** are per-file `C` objects (paper `#EAEEF2`, ink `#1B2430`, plus role hues). Reuse them; match the existing palette.
- Fullscreen only works when the app is opened in its own tab (blocked inside embedded/artifact iframes) — the toggle already shows an explanatory hint; keep it.

## Publishing the standalone artifact (claude.ai)

When asked to update the live artifact: `SINGLEFILE=1 npm run build`, then extract the inlined `<style>`+`<script>` from `dist-single/index.html` into a fragment file (no `<html>/<head>/<body>`, just styles + `<div id="root"></div>` + scripts) and publish that file to the **same** artifact URL to keep it stable.

## Git

Work on the designated feature branch (`claude/math-crafting-game-p0rebr`), commit with clear messages, push with `git push -u origin <branch>`. Only open a PR when explicitly asked. Do not commit `dist/`, `dist-single/`, or `node_modules/` (already git-ignored).
