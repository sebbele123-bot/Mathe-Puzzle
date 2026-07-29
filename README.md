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

## Die Modi

| Modus | Was man tut |
|-------|-------------|
| **Bibliothek** | Katalog des gesamten Materials — filtern, suchen, eine Rotation zusammenstellen, alles Übrige von hier aus öffnen. |
| **Training** | Die Rotation als Übungen: Stärke-Anzeige pro Element, Level und Erfahrungspunkte, „starten" zieht gewichtet zufällig — Schwaches kommt häufiger. |
| **Definitionen** | Strukturen aus Eigenschaften bauen (z. B. Skalarprodukt = Bilinearform + symmetrisch + positiv definit). Ergebnisse werden selbst wieder Bausteine. |
| **Beweise** | Beweise als Inferenzketten: Fakt(en) + Schlussregel → neuer Fakt, bis zum Ziel. |
| **Werkbank** | Symbol-Gitter (8×12): frei schreiben — oder eine Definition aus ihren Symbol-Bausteinen zusammensetzen. |
| **Bausteine** | Symbolbibliothek (243 Symbole, 21 Kategorien). Über **+** wandert ein Symbol ins Inventar. |

Umschalten oben in der Leiste. Die **Steckbrief**-Ansicht (Definitionskarte zum
Nachlesen) hat keinen eigenen Knopf — sie öffnet sich aus der Bibliothek.

In die **Rotation** kommt nur Material, das auch eine Frage stellt: Bau-, Beweis-
und Symbol-Aufgaben. Steckbriefe sind reine Lesekarten — sie lassen sich nicht
falsch beantworten und bleiben aus dem Training draußen.

Eine Rotationskarte zum ersten Mal aufzuschlagen zählt: der **erste Kontakt**
bringt einmalig 4 XP fürs Lesen, danach verdient nur noch das Lösen. Der
Weiter-Knopf erscheint dabei nicht — die Aufgabe wartet ja noch.

**Mechanik in beiden Craftern gleich:** Baustein antippen → er springt in die
nächste freie Zelle; eine gefüllte Zelle antippen → sie leert sich; der **Hammer**
wertet alles Gelegte gemeinsam aus (Reihenfolge egal). Nichts wird gezogen.

## Inventar, Hand und Etiketten

Das Inventar startet **leer** — Symbole kommen ausschließlich durch Einsammeln in
**Bausteine** hinein. Die Hotbar spiegelt das Inventar; der **Hand**-Slot daneben
hält eine Arbeitskopie des gewählten Bausteins. Am Rechner benennt ein Tastendruck
den Baustein **nur in der Hand** um (`G` + `h` → `H`); derselbe Buchstabe zweimal
kurz hintereinander ergibt den griechischen Partner (`ff` → φ, `ww` → ω). Der
Inventar-Baustein bleibt unverändert.

Fortschritt (Inventar, Werkbank, Rotation, Statistik, XP) liegt im `localStorage`
des Browsers — kein Server, kein Konto.

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

### Enthaltene Beweis-Missionen

1. **Neutralelement ist eindeutig** — kleines Einstiegs-Puzzle (Algebra).
2. **Ü5.2 — Fixpunkt einer Ähnlichkeit** — 3 Tiefenstufen, antiholomorpher Distraktor.
3. **Ü2.1 — O(ℚ²) ist keine Drehspiegelgruppe** — Widerspruchsbeweis, Norm-Distraktor.
4. **Ü5.1 — Verkettung von Drehungen** — 3 Tiefenstufen, mit Begriffs-Gate.
5. **Ü6.1 — Kreisspiegelung**
6. **Ü8.3 — Zentralprojektion** — 2 Tiefenstufen.
7. **Ü4.1 — Cosinus-Satz** — 2 Tiefenstufen, mit Begriffs-Gate.

## Entwicklung

```bash
npm install
npm run dev           # Entwicklungsserver
npm run build         # Produktions-Build nach dist/
npm run preview       # Build lokal ansehen
npm run build:single  # alles in eine Datei: dist-single/index.html (offline lauffähig)
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
  App.jsx                 Modus-Umschalter, Hand-Slot, XP-Vergabe
  Bibliothek.jsx          Katalog: filtern, suchen, Rotation zusammenstellen
  Training.jsx            Rotation als Übungen, Level und Stärke-Anzeige
  StrukturBaukasten.jsx   Definitions-Modus (Bausteine, Rezepte, Lektionen)
  Werkbank.jsx            Symbol-Gitter, freies Schreiben und Symbol-Aufgaben
  OpenMathPalette.jsx     Symbolbibliothek zum Einsammeln
  Inventory.jsx           Hotbar, Lager und Hand-Slot
  Steckbrief.jsx          Definitionskarte zum Nachlesen
  data/
    definitions.js        30 Kern-Definitionen der Elementargeometrie
    openmath.js           243 Symbole in 21 Kategorien, deutsche Bezeichnungen
    symboldefs.js         Symbol-Aufgaben für die Werkbank
    labels.js             umbenennbare Bausteine und ihre Schreibweisen
    catalog.js            fasst alles zu einem durchsuchbaren Katalog zusammen
    stats.js              Stärke pro Element (steuert die Rotation)
    xp.js                 Erfahrungspunkte und Level
    symbols.js            gemeinsame Symbolliste, Inventar im localStorage
  proof/
    data.js               Fakten, Regeln, Missionen
    engine.js             Auswertung eines Zuges
    BeweisCrafter.jsx     UI des Beweis-Modus
    engine.test.mjs       Logik-Test
```
