# ⚒️ Mathe-Schmiede

Ein kleines Lernspiel: **Löse Rechenaufgaben, sammle Rohstoffe und schmiede daraus Gegenstände.**
Je mehr du baust, desto höher steigt dein Level – und desto anspruchsvollere Rezepte werden freigeschaltet.

Kein Server, kein Build-Schritt, keine Abhängigkeiten – reines HTML, CSS und JavaScript.

## 🎮 Spielen

Einfach `index.html` im Browser öffnen:

```bash
# Direkt öffnen
xdg-open index.html      # Linux
open index.html          # macOS

# Oder mit einem lokalen Server
python3 -m http.server 8000
# danach http://localhost:8000 im Browser aufrufen
```

## 🧩 So funktioniert's

1. **Rechnen** – Löse die angezeigte Aufgabe und tippe deine Antwort ein.
2. **Rohstoffe sammeln** – Für jede richtige Antwort bekommst du Rohstoffe
   (🪵 Holz, 🪨 Stein, ⛓️ Eisen, 💎 Kristall, 🥇 Gold).
3. **Schmieden** – Kombiniere Rohstoffe an der Werkbank zu Gegenständen
   (🔥 Fackel, 🔨 Hammer, ⚔️ Schwert, 👑 Krone …). Jeder Bau bringt Punkte.
4. **Aufsteigen** – Punkte erhöhen dein Level und schalten neue, wertvollere
   Rezepte frei.

### Boni

- **🔥 Serie:** Mehrere richtige Antworten in Folge geben Extra-Rohstoffe und Bonuspunkte.
- **⚡ Tempo:** Wer schnell antwortet (bevor die Leiste leerläuft), hat eine Chance
  auf seltene Rohstoffe und Zusatzpunkte.

## 🎚️ Schwierigkeitsgrade

| Stufe            | Rechenarten            | Zahlenraum |
| ---------------- | ---------------------- | ---------- |
| Klasse 1–2       | + −                    | bis 10     |
| Klasse 3–4       | + − ×                  | bis 20     |
| Klasse 5–6       | + − × ÷                | bis 50     |
| Profi            | + − × ÷                | bis 100    |

Divisionsaufgaben gehen immer glatt auf (keine Kommazahlen).

## 💾 Speichern

Der Spielstand (Level, Punkte, Rohstoffe, gebaute Gegenstände) wird automatisch
im `localStorage` des Browsers gespeichert. Über **„Neu starten"** lässt sich
alles zurücksetzen.

## 📁 Projektstruktur

```
Mathe-Puzzle/
├── index.html      # Aufbau der Seite
├── css/
│   └── style.css   # Gestaltung
├── js/
│   └── game.js     # Spiellogik (Aufgaben, Belohnungen, Schmieden, Level)
└── README.md
```

## ♿ Barrierefreiheit

- Vollständig per Tastatur bedienbar (Aufgabe eingeben, Enter zum Prüfen).
- Reduzierte Bewegungen werden respektiert (`prefers-reduced-motion`).
- Responsives Layout für Handy, Tablet und Desktop.
