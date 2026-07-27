/* Rauchtest: Karteikarte — Modus-Wahl, Quiz und Auflösung, Meldekette. */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Karteikarte, { inhaltFor } from "./Karteikarte.jsx";
import { recordOutcome } from "./data/stats.js";
import { CATALOG } from "./data/catalog.js";

const KARTE = "def:dA1"; // A · Def 1 — Skalarprodukt: bauen + Quiz + Auflösung
const RICHTIG = /Bilinearform \+ symmetrisch \+ positiv definit/;

describe("Karteikarte", () => {
  it("zeigt Kopf und die verfügbaren Modi", () => {
    render(<Karteikarte catalogId={KARTE} />);
    expect(screen.getAllByText("Skalarprodukt").length).toBeGreaterThan(0);
    for (const m of ["Bauen", "Quiz", "Auflösung"]) {
      expect(screen.getByRole("button", { name: m })).toBeTruthy();
    }
  });

  it("zieht bei einer nie geübten Karte das Bauen — nicht die Auflösung", () => {
    render(<Karteikarte catalogId={KARTE} />);
    expect(screen.getByRole("button", { name: "Bauen" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("zeigt in der Auflösung den Definitionstext", () => {
    render(<Karteikarte catalogId={KARTE} />);
    fireEvent.click(screen.getByRole("button", { name: "Auflösung" }));
    expect(screen.getByText(/symmetrische, positiv definite Bilinearform/)).toBeTruthy();
  });

  it("vergibt für die Auflösung nichts — sie ist Nachschlagen", () => {
    const onOutcome = vi.fn();
    render(<Karteikarte catalogId={KARTE} onOutcome={onOutcome} />);
    fireEvent.click(screen.getByRole("button", { name: "Auflösung" }));
    expect(screen.getByText(/symmetrische, positiv definite Bilinearform/)).toBeTruthy();
    // kein Knopf, der Fortschritt meldet, und keine Meldung
    expect(screen.queryByRole("button", { name: /verstanden/ })).toBeNull();
    expect(onOutcome).not.toHaveBeenCalled();
  });

  it("wertet das Quiz aus und meldet die Fehlerzahl", () => {
    const onOutcome = vi.fn();
    render(<Karteikarte catalogId={KARTE} onOutcome={onOutcome} />);
    fireEvent.click(screen.getByRole("button", { name: "Quiz" }));

    expect(screen.getByText(/Aus welchen drei Zutaten/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: RICHTIG }));
    // Begründung erscheint nach der Antwort
    expect(screen.getByText(/Genau das Rezept/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "fertig" }));
    expect(onOutcome).toHaveBeenCalledWith(KARTE, "quiz", 0, 3);
  });

  it("zählt eine falsche Antwort als Fehler", () => {
    const onOutcome = vi.fn();
    render(<Karteikarte catalogId={KARTE} onOutcome={onOutcome} />);
    fireEvent.click(screen.getByRole("button", { name: "Quiz" }));
    fireEvent.click(screen.getByRole("button", { name: /Vektorraum \+ Dimension 2/ }));
    fireEvent.click(screen.getByRole("button", { name: "fertig" }));
    expect(onOutcome).toHaveBeenCalledWith(KARTE, "quiz", 1, 3);
  });

  it("öffnet im Baumodus die Bauansicht mit Stufenangabe", () => {
    render(<Karteikarte catalogId={KARTE} />);
    fireEvent.click(screen.getByRole("button", { name: "Bauen" }));
    expect(screen.getByRole("heading", { name: /Struktur-Baukasten/ })).toBeTruthy();
    // dA1 hat einen Schritt → keine Stufen, also auch keine Stufenanzeige
    expect(screen.queryByText(/^Stufe /)).toBeNull();
  });

  it("wählt bei einer starken Karte das Quiz statt des Bauens", () => {
    // dreimal fehlerfrei gelöst → Stärke deutlich über 0.7
    recordOutcome(KARTE, 0); recordOutcome(KARTE, 0); recordOutcome(KARTE, 0);
    render(<Karteikarte catalogId={KARTE} />);
    expect(screen.getByRole("button", { name: "Quiz" }).getAttribute("aria-pressed")).toBe("true");
  });

  // „Wird gebraucht in Ü0.4" sagt nichts darüber, wozu eine Definition
  // taugt. Das Wozu nennt ausschließlich konkrete Bausteine.
  it("nennt im Wozu niemals Übungsblatt-Kürzel", () => {
    const beanstandet = [];
    for (const c of CATALOG) {
      const { kann } = inhaltFor(c);
      if (!kann) continue;
      if (/Wird gebraucht/.test(kann)) beanstandet.push(`${c.id}: Ü-Beschreibung`);
      if (/Ü\s*\d/.test(kann)) beanstandet.push(`${c.id}: ${kann}`);
      if (!/^Baustein für:/.test(kann)) beanstandet.push(`${c.id}: unerwartete Form „${kann}"`);
    }
    expect(beanstandet).toEqual([]);
  });

  it("gibt einer mehrstufigen Beweiskarte die leichteste Stufe, wenn sie neu ist", () => {
    render(<Karteikarte catalogId="proof:p_fixpunkt" />);
    fireEvent.click(screen.getByRole("button", { name: "Bauen" }));
    expect(screen.getByText("Stufe 0/2")).toBeTruthy();
  });
});
