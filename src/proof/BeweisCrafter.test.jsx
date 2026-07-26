/* Rauchtest: Beweis-Crafter — Regel + Aussagen ablegen, Hammer, Folgerung.
 * Führt den Beweis „Neutralelement ist eindeutig" komplett durch die
 * Oberfläche und prüft die Ergebnismeldung. */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BeweisCrafter from "./BeweisCrafter.jsx";
import { tapTile, hammer, placedCells, clearBench } from "../test/utils.jsx";

// Kacheltexte der Mission p_neutral (Standard-Mission)
const R_NEUTRAL = /Neutralität anwenden/;
const R_TRANS = /Gleichungen verketten/;
const R_KOMMUT = /Kommutativität/;
const N_E = /e∘x = x∘e = x/;      // „e neutral" (n_e)
const N_E2 = /e′ neutral/;         // „e′ neutral" (n_e2)
const N_EQ1 = /e∘e′ = e(?!′)/;     // „e∘e′ = e"  (nicht e′)
const N_EQ2 = /e∘e′ = e′/;         // „e∘e′ = e′"

describe("BeweisCrafter — Inferenz über die Werkbank", () => {
  // Regression: ohne initialId (Aufruf über die Navigation statt über die
  // Bibliothek) muss die Standard-Mission ihre Startaussagen zeigen —
  // sonst lässt sich der Beweis gar nicht beginnen.
  it("zeigt auch ohne initialId die Startaussagen der Standard-Mission", () => {
    render(<BeweisCrafter />);
    expect(screen.getAllByTitle(/antippen → auf die Werkbank/).some((t) => N_E.test(t.textContent))).toBe(true);
    expect(screen.getAllByTitle(/antippen → auf die Werkbank/).some((t) => N_E2.test(t.textContent))).toBe(true);
  });

  it("leitet aus Regel + Prämisse eine neue Aussage ab", async () => {
    render(<BeweisCrafter />);

    tapTile(R_NEUTRAL);
    tapTile(N_E2);
    expect(placedCells()).toHaveLength(2);
    hammer();

    // die gefolgerte Aussage taucht in den bekannten Aussagen auf
    await waitFor(() => tapTile(N_EQ1));
  });

  it("führt den Beweis zu Ende und meldet das Ergebnis", async () => {
    const onOutcome = vi.fn();
    render(<BeweisCrafter onOutcome={onOutcome} />);

    // 1. r_neutral + e′ neutral → e∘e′ = e
    tapTile(R_NEUTRAL); tapTile(N_E2); hammer();
    await waitFor(() => expect(screen.getAllByTitle(/antippen → auf die Werkbank/).some((t) => N_EQ1.test(t.textContent))).toBe(true));

    // 2. r_neutral + e neutral → e∘e′ = e′
    clearBench();
    tapTile(R_NEUTRAL); tapTile(N_E); hammer();
    await waitFor(() => expect(screen.getAllByTitle(/antippen → auf die Werkbank/).some((t) => N_EQ2.test(t.textContent))).toBe(true));

    // 3. r_trans + beide Gleichungen → Ziel e = e′
    clearBench();
    tapTile(R_TRANS); tapTile(N_EQ1); tapTile(N_EQ2); hammer();

    await waitFor(() => expect(onOutcome).toHaveBeenCalledWith("p_neutral", 0));
  });

  it("lässt eine unpassende Regel nicht einrasten und zählt den Fehlversuch", async () => {
    const onOutcome = vi.fn();
    render(<BeweisCrafter onOutcome={onOutcome} />);

    // Distraktor-Regel (Kommutativität) passt zu keinem Schritt
    tapTile(R_KOMMUT); tapTile(N_E2); hammer();

    await waitFor(() => expect(screen.getByText(/rastet nicht ein/)).toBeTruthy());
    expect(onOutcome).not.toHaveBeenCalled();

    // korrekte Regel danach rastet ein — der Fehlversuch bleibt gezählt
    clearBench();
    tapTile(R_NEUTRAL); tapTile(N_E2); hammer();
    await waitFor(() => tapTile(N_EQ1));
  });
});
