/* Rauchtest: Struktur-Crafter — der Kernablauf tippen → Hammer → Ergebnis.
 * Deckt ab, was die reinen Logiktests nicht erreichen: die Verdrahtung von
 * Raster, Rezept-Treffer und Ergebnismeldung (onOutcome). */
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import StrukturBaukasten from "./StrukturBaukasten.jsx";
import { tapTile, hammer, placedCells } from "./test/utils.jsx";

// Lektion „A · Def 1 — Skalarprodukt": base vr2, Ziel skp
// Rezept: bilin + symm + posdef → skp
const BILIN = /Bilinearform/;
const SYMM = /symmetrisch/;
const POSDEF = /positiv definit/;

describe("StrukturBaukasten — Raster-Werkbank", () => {
  it("legt angetippte Bausteine ins Raster und räumt eine Zelle wieder frei", () => {
    render(<StrukturBaukasten initialId="dA1" />);
    expect(placedCells()).toHaveLength(0);

    tapTile(BILIN);
    tapTile(SYMM);
    expect(placedCells()).toHaveLength(2);

    // belegte Zelle antippen → wieder frei
    fireEvent.click(placedCells()[0]);
    expect(placedCells()).toHaveLength(1);
  });

  it("baut aus den drei Zutaten das Skalarprodukt und meldet das Ergebnis", async () => {
    const onOutcome = vi.fn();
    render(<StrukturBaukasten initialId="dA1" onOutcome={onOutcome} />);

    tapTile(BILIN);
    tapTile(SYMM);
    tapTile(POSDEF);
    expect(placedCells()).toHaveLength(3);

    hammer();

    // Erfolgsmeldung erscheint …
    await waitFor(() => expect(screen.getByText("Gebaut")).toBeTruthy());
    // … die Teile sind verbraucht, das Ergebnis liegt in Zelle 0
    expect(placedCells()).toHaveLength(1);
    // … und das Missionsziel wird ohne Fehlversuche gemeldet
    await waitFor(() => expect(onOutcome).toHaveBeenCalledWith("dA1", 0));
  });

  it("weist eine unvollständige Konstruktion zurück und zählt sie als Fehlversuch", async () => {
    const onOutcome = vi.fn();
    render(<StrukturBaukasten initialId="dA1" onOutcome={onOutcome} />);

    // nur zwei der drei Zutaten → kein Rezept
    tapTile(BILIN);
    tapTile(SYMM);
    hammer();

    await waitFor(() => expect(screen.getByText(/Fast — hier fehlt noch ein Baustein/)).toBeTruthy());
    expect(screen.queryByText("Gebaut")).toBeNull();
    expect(onOutcome).not.toHaveBeenCalled();

    // dritte Zutat ergänzen → jetzt rastet es ein, mit 1 gezähltem Fehlversuch
    tapTile(POSDEF);
    hammer();
    await waitFor(() => expect(onOutcome).toHaveBeenCalledWith("dA1", 1));
  });
});
