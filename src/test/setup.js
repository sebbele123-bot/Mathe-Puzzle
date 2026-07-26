/* Testumgebung für die Komponenten-Rauchtests (jsdom).
 * Hält nur das Nötigste bereit, was jsdom nicht mitbringt. */
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

// prefers-reduced-motion: reduce → die Crafter kürzen ihre Einrast-Animation
// auf 60 ms ab. Das macht die Tests schnell und unabhängig von Timing.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: /prefers-reduced-motion/.test(query),
    media: query,
    onchange: null,
    addListener() {}, removeListener() {},
    addEventListener() {}, removeEventListener() {},
    dispatchEvent() { return false; },
  });
}

// Jeder Test startet mit leerem localStorage (Fortschritt/Stats/XP).
beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { cleanup(); });
