# Mathe-Puzzle

Ein Crafting-Spiel, das mathematische **Definitionen** und **Beweise** in sinnvoll
große Einzelteile zerlegt, aus denen man die Definition bzw. den Beweis wieder
zusammensetzt. Jede Definition/Aufgabe ist eine eigene Mission mit vorgefertigten
Bausteinen — klein genug, dass es herausfordernd bleibt, aber ohne bei den
Axiomen anfangen zu müssen.

Inhaltlich orientiert an den Übungsblättern der Elementargeometrie.

## Website (GitHub Pages)

Die App wird per GitHub Actions gebaut und veröffentlicht
(`.github/workflows/deploy.yml`). Sobald GitHub Pages aktiviert ist, läuft sie unter:

**https://sebbele123-bot.github.io/Mathe-Puzzle/**

Einmalige Aktivierung (nur der Repo-Eigentümer kann das):
**Settings → Pages → Build and deployment → Source: „GitHub Actions"**.
Danach deployt jeder Push (auf `main` oder den aktiven Feature-Branch) automatisch;
der Basis-Pfad wird über `BASE_PATH` auf den Repo-Namen gesetzt.

## Zwei Modi

| Modus | Was man baut | Mechanik |
|-------|--------------|----------|
| **Definitionen** (`StrukturBaukasten`) | Strukturen aus Eigenschaften (z. B. Skalarprodukt = Bilinearform + symmetrisch + positiv definit) | Bausteine auf der Werkbank zusammenschieben, mit dem Hammer einrasten. Ergebnisse werden selbst wieder Bausteine. |
| **Beweise** (`BeweisCrafter`) | Beweise als Inferenzketten (Fakt + Schlussregel → neuer Fakt) | Fakten auswählen, Schlussregel anwenden, Kette bis zum Ziel bauen. |

Umschalten oben in der Leiste.

## Der Beweis-Modus im Detail

Ein Beweis ist hier ein gerichteter Graph aus Kacheln:

```
Fakt(en)  +  Schlussregel  →  neuer Fakt
```

Vier Schwierigkeits-Mechaniken sind aktiv:

- **Tiefen-Regler** — dieselbe Aussage ab wählbarer Starttiefe (viel geschenkt … fast von vorn).
- **Ordnungszwang** — ein Fakt lässt sich erst als Prämisse benutzen, wenn er bewiesen ist (kein Zirkelschluss).
- **Regelwahl** — mehrere Regeln liegen bereit; nur die passende führt weiter.
- **Distraktoren** — verführerische, aber falsche oder abseitige Bausteine (Sackgassen).

Das **Beweisprotokoll** unten wächst mit jedem Schritt und ist am Ende der
zusammengesetzte Beweis.

### Enthaltene Beweis-Missionen (Prototyp)

1. **Neutralelement ist eindeutig** — kleines Einstiegs-Puzzle (Algebra).
2. **Ü5.2 — Fixpunkt einer Ähnlichkeit** — 3 Tiefenstufen, antiholomorpher Distraktor.
3. **Ü2.1 — O(ℚ²) ist keine Drehspiegelgruppe** — Widerspruchsbeweis, Norm-Distraktor.

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm run build    # Produktions-Build nach dist/
npm run preview  # Build lokal ansehen
```

Logik-Test des Beweis-Modus (ohne Browser):

```bash
node src/proof/engine.test.mjs
```

## Neue Beweis-Mission hinzufügen

Alles steckt in `src/proof/data.js`:

1. **Fakten** in `FACTS` ergänzen (`role: "ziel"` für das Beweisziel,
   `role: "sackgasse"` für Distraktoren).
2. **Schlussregeln** in `RULES` ergänzen.
3. Eine **Mission** in `MISSIONS` anlegen mit:
   - `goal` — der Zielfakt,
   - `pool.facts` / `pool.rules` — was auf dem Tisch liegt (inkl. Distraktoren),
   - `steps` — die gültigen Inferenzen `{ rule, premises:[…], produces }`,
   - `depths` — Tiefenstufen (jede mit ihrer `given`-Menge), leicht → schwer.

Die Engine (`src/proof/engine.js`) prüft einen Zug rein über Regel + Prämissen-
Multimenge gegen `steps`; es ist kein zusätzlicher Code nötig.

## Projektstruktur

```
src/
  App.jsx                 Modus-Umschalter
  StrukturBaukasten.jsx   Definitions-Modus (erste Version)
  proof/
    data.js               Fakten, Regeln, Missionen
    engine.js             Auswertung eines Zuges
    BeweisCrafter.jsx     UI des Beweis-Modus
    engine.test.mjs       Logik-Test
```
