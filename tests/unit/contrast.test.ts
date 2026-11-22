// SPEC §11 (accessibility, WCAG AA) and docs/ux-review.md: the colour pairs the UI uses
// must keep their contrast. Colours are read from Tailwind's own theme (oklch), so a
// Tailwind upgrade that shifts a shade is caught here.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const theme = readFileSync("node_modules/tailwindcss/theme.css", "utf8");
const globals = readFileSync("app/globals.css", "utf8");

type Rgb = [number, number, number]; // linear sRGB, 0–1

/** Linear sRGB of a Tailwind colour token, e.g. "zinc-600". */
function tw(token: string): Rgb {
  const match = theme.match(new RegExp(`--color-${token}:\\s*oklch\\(([\\d.]+)% ([\\d.]+) ([\\d.]+)\\)`));
  if (!match) throw new Error(`Colour token not found: ${token}`);
  const [L, C, h] = [Number(match[1]) / 100, Number(match[2]), (Number(match[3]) * Math.PI) / 180];
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return [
    clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

/** Linear sRGB of a hex colour, e.g. "#171717". */
function hex(value: string): Rgb {
  const channel = (i: number) => {
    const v = parseInt(value.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return [channel(1), channel(3), channel(5)];
}

const luminance = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function ratio(fg: Rgb, bg: Rgb): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE = hex("#ffffff");
const FOREGROUND = hex("#171717");
const TEXT = 4.5; // WCAG 1.4.3, normal text
const NON_TEXT = 3; // WCAG 1.4.11, UI component boundaries and focus indicators

describe("SPEC §11 — Light theme only (decision 046)", () => {
  it("SPEC §11: globals.css has no dark-mode block", () => {
    expect(globals).not.toMatch(/prefers-color-scheme:\s*dark/);
  });

  it("SPEC §11: globals.css sets color-scheme: light so native controls render light", () => {
    expect(globals).toMatch(/color-scheme:\s*light/);
  });

  it("SPEC §11: body text #171717 on white ≥ 4.5:1", () => {
    expect(globals).toMatch(/--foreground:\s*#171717/);
    expect(globals).toMatch(/--background:\s*#ffffff/);
    expect(ratio(FOREGROUND, WHITE)).toBeGreaterThanOrEqual(TEXT);
  });
});

describe("SPEC §11 / WCAG 1.4.3 — Text colours", () => {
  const backgrounds = { white: WHITE, "zinc-100": tw("zinc-100"), "red-50": tw("red-50") };
  const text = ["zinc-900", "zinc-700", "zinc-600", "blue-700", "red-700", "red-800", "green-800", "amber-900"];

  for (const token of text) {
    for (const [bgName, bg] of Object.entries(backgrounds)) {
      it(`WCAG 1.4.3: ${token} text on ${bgName} ≥ 4.5:1`, () => {
        expect(ratio(tw(token), bg)).toBeGreaterThanOrEqual(TEXT);
      });
    }
  }

  it("WCAG 1.4.3: placeholder zinc-600 on the white input ≥ 4.5:1", () => {
    expect(ratio(tw("zinc-600"), WHITE)).toBeGreaterThanOrEqual(TEXT);
  });

  for (const button of ["blue-700", "blue-800", "red-700", "red-800"]) {
    it(`WCAG 1.4.3: white button text on ${button} ≥ 4.5:1`, () => {
      expect(ratio(WHITE, tw(button))).toBeGreaterThanOrEqual(TEXT);
    });
  }
});

describe("SPEC §11 / WCAG 1.4.11 — Control borders and focus", () => {
  it("WCAG 1.4.11: zinc-500 control border on white ≥ 3:1", () => {
    expect(ratio(tw("zinc-500"), WHITE)).toBeGreaterThanOrEqual(NON_TEXT);
  });

  it("WCAG 1.4.11: the old zinc-400 border fails (why it was replaced)", () => {
    expect(ratio(tw("zinc-400"), WHITE)).toBeLessThan(NON_TEXT);
  });

  for (const focus of ["blue-600", "red-600", "red-700"]) {
    it(`WCAG 1.4.11: ${focus} focus outline on white ≥ 3:1`, () => {
      expect(ratio(tw(focus), WHITE)).toBeGreaterThanOrEqual(NON_TEXT);
    });
  }
});
