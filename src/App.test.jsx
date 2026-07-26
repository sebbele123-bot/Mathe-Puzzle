/* Rauchtest: App-Verdrahtung — Ansichtswechsel und die Meldekette
 * onOutcome → recordStat → Rotations-Statistik + XP.
 * Genau diese Verdrahtung sehen die reinen Logiktests nicht: dort stimmen
 * Engine und XP-Kurve für sich, hier wird geprüft, dass eine gelöste
 * Übung unter der richtigen Katalog-id ankommt. */
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";
import { tapTile, hammer } from "./test/utils.jsx";

// eindeutige Kacheltexte (im freien Modus liegen alle Bausteine aus)
const BILIN = /β: V×V→ℝ/;
const SYMM = /β\(v,w\)=β\(w,v\)/;
const POSDEF = /β\(v,v\)>0/;

const readJson = (key) => JSON.parse(window.localStorage.getItem(key) || "null");

describe("App — Ansichten und Fortschrittsmeldung", () => {
  it("startet in der Bibliothek und wechselt in den Struktur-Baukasten", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Bibliothek" }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Definitionen" }));
    expect(screen.getByRole("heading", { name: /Struktur-Baukasten/ })).toBeTruthy();
  });

  it("schreibt eine gelöste Lektion in Statistik und XP — unter der Katalog-id def:…", async () => {
    render(<App />);
    expect(readJson("mp_stats_v1")).toBeNull();

    // Definitionen öffnen und die Lektion „A · Def 1 — Skalarprodukt" wählen
    fireEvent.click(screen.getByRole("button", { name: "Definitionen" }));
    fireEvent.click(screen.getByRole("button", { name: /A · Def 1 — Skalarprodukt/ }));

    // Skalarprodukt bauen
    tapTile(BILIN); tapTile(SYMM); tapTile(POSDEF);
    hammer();

    // Sitzungsleiste meldet die vergebenen XP
    await waitFor(() => expect(screen.getByText(/^\+\d+ XP$/)).toBeTruthy());

    // Rotations-Statistik: unter „def:dA1", fehlerfrei gelöst
    const stats = readJson("mp_stats_v1");
    expect(Object.keys(stats)).toContain("def:dA1");
    expect(stats["def:dA1"].attempts).toBe(1);
    expect(stats["def:dA1"].cleanSolves).toBe(1);
    expect(stats["def:dA1"].strength).toBeGreaterThan(0);

    // XP-Speicher: Punkte vergeben und als erstmals gelöst vermerkt
    const xp = readJson("mp_xp_v1");
    expect(xp.xp).toBeGreaterThan(0);
    expect(xp.solved).toContain("def:dA1");
  });
});
