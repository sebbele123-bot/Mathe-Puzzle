/* Kleine Helfer für die Komponenten-Rauchtests.
 * Die Kacheln der Vorräte tragen alle denselben `title`; ausgewählt wird
 * über ihren sichtbaren Text — so bleiben die Tests unabhängig von der
 * konkreten DOM-Verschachtelung. */
import { screen, fireEvent } from "@testing-library/react";

const TILE_TITLE = "antippen → auf die Werkbank";

/** Vorrats-Kachel mit passendem Text antippen (legt sie auf die Werkbank). */
export function tapTile(match) {
  const tiles = screen.getAllByTitle(TILE_TITLE);
  const re = match instanceof RegExp ? match : new RegExp(match);
  const hit = tiles.find((t) => re.test(t.textContent));
  if (!hit) {
    throw new Error(
      `Keine Kachel passt zu ${re}. Vorhanden: ${tiles.map((t) => JSON.stringify(t.textContent)).join(", ")}`
    );
  }
  fireEvent.click(hit);
  return hit;
}

/** Den Hammer auslösen (wertet alle abgelegten Zellen aus). */
export function hammer() {
  fireEvent.click(screen.getByRole("button", { name: /Hammer/ }));
}

/** Belegte Werkbank-Zellen. */
export const placedCells = () => screen.queryAllByTitle("antippen leert die Zelle");

/** Werkbank leeren — nach einem Treffer bleibt das Ergebnis in Zelle 0 liegen. */
export function clearBench() {
  let guard = 0;
  while (placedCells().length && guard++ < 20) fireEvent.click(placedCells()[0]);
}
