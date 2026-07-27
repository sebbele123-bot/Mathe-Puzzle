/* Rauchtest: freie Werkbank — Rastergröße und das Inventar an der Werkbank. */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Werkbank from "./Werkbank.jsx";

const COLS = 8, ROWS = 10;
const emptyCells = () => screen.getAllByTitle("leer");
const SAMMLUNG = ["setname1.N", "arith1.plus"];

describe("Werkbank — freies Raster", () => {
  it("hat 8×10 Zellen", () => {
    render(<Werkbank />);
    expect(emptyCells()).toHaveLength(COLS * ROWS);
  });

  it("übernimmt einen zu langen gespeicherten Stand, statt ihn zu verwerfen", () => {
    // alter 8×12-Stand mit einem Symbol in Zelle 0
    const alt = Array(96).fill(null);
    alt[0] = { id: "setname1.N", label: null };
    window.localStorage.setItem("mp_werkbank_v2", JSON.stringify(alt));

    render(<Werkbank />);
    expect(emptyCells()).toHaveLength(COLS * ROWS - 1); // Zelle 0 ist belegt
    expect(screen.getByTitle(/natürliche Zahlen — tippen leert/)).toBeTruthy();
  });
});

describe("Werkbank — an die Werkbank setzen", () => {
  it("blendet das Inventar erst auf Knopfdruck unter der Werkbank ein", () => {
    render(<Werkbank collection={SAMMLUNG} />);
    expect(screen.queryByText("Inventar")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /an die Werkbank setzen/ }));
    expect(screen.getByText("Inventar")).toBeTruthy();
    // beide gesammelten Bausteine liegen bereit
    expect(screen.getByTitle(/natürliche Zahlen — in Zelle/)).toBeTruthy();
    expect(screen.getByTitle(/Addition — in Zelle/)).toBeTruthy();
  });

  it("setzt einen Baustein aus dem Inventar in die gewählte Zelle", () => {
    render(<Werkbank collection={SAMMLUNG} />);
    fireEvent.click(screen.getByRole("button", { name: /an die Werkbank setzen/ }));
    expect(emptyCells()).toHaveLength(COLS * ROWS);

    fireEvent.click(screen.getByTitle(/natürliche Zahlen — in Zelle 1 setzen/));
    expect(emptyCells()).toHaveLength(COLS * ROWS - 1);
    // die Auswahl rückt weiter: der nächste Baustein landet in Zelle 2
    expect(screen.getByTitle(/Addition — in Zelle 2 setzen/)).toBeTruthy();
  });

  it("ist im Training von vornherein aufgeklappt", () => {
    render(<Werkbank collection={SAMMLUNG} training />);
    expect(screen.getByText("Inventar")).toBeTruthy();
    expect(screen.getByRole("button", { name: /aufstehen/ })).toBeTruthy();
  });

  it("zeigt bei leerem Inventar einen Hinweis statt Bausteinen", () => {
    render(<Werkbank collection={[]} training />);
    expect(screen.getByText("Dein Inventar ist leer.")).toBeTruthy();
  });
});
