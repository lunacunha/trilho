// SPEC §11 (accessibility, WCAG AA), decision 047 and docs/ux-review.md "Visual design":
// every colour pair the UI uses must keep its contrast in BOTH the light and the dark theme.
// Colours are read from the design tokens in app/globals.css, so changing a token re-checks it here.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const globals = readFileSync("app/globals.css", "utf8");

type Rgb = [number, number, number]; // linear sRGB, 0–1
type Tokens = Record<string, string>;

/** The body of the first CSS block whose selector matches `selector`. */
function block(selector: RegExp): string {
  const match = globals.match(new RegExp(`${selector.source}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`Block not found: ${selector}`);
  return match[1];
}

function tokens(body: string): Tokens {
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2].toLowerCase()]));
}

const LIGHT_BLOCK = block(/:root,\s*:root\[data-theme="light"\]/);
const DARK_BLOCK = block(/:root\[data-theme="dark"\]/);
const FALLBACK_BLOCK = block(/:root:not\(\[data-theme\]\)/);
const THEMES: Record<"light" | "dark", Tokens> = { light: tokens(LIGHT_BLOCK), dark: tokens(DARK_BLOCK) };

/** Linear sRGB of a hex colour, e.g. "#171717". */
function hex(value: string): Rgb {
  const channel = (i: number) => {
    const v = parseInt(value.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return [channel(1), channel(3), channel(5)];
}

const luminance = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function ratio(fg: string, bg: string): number {
  const [hi, lo] = [luminance(hex(fg)), luminance(hex(bg))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT = 4.5; // WCAG 1.4.3, normal text
const NON_TEXT = 3; // WCAG 1.4.11, UI component boundaries and focus indicators

const PAGE_SURFACES = ["surface", "surface-raised", "surface-muted", "surface-header"];

/** [foreground, background] pairs that appear in the UI, with the minimum ratio. */
const TEXT_PAIRS: [string, string][] = [
  // Body text, secondary text, titles, links and labels on every page surface
  ...["fg", "fg-muted", "brand", "primary", "primary-hover", "accent", "danger", "success"].flatMap((fg) =>
    PAGE_SURFACES.map((bg): [string, string] => [fg, bg]),
  ),
  // Buttons
  ["on-primary", "primary"],
  ["on-primary", "primary-hover"],
  ["on-danger", "danger"],
  ["on-danger", "danger-hover"],
  ["fg", "secondary"],
  ["fg", "secondary-hover"],
  // Reminder card (rose): its text, the reminder buttons and their error message
  ["reminder-fg", "reminder-bg"],
  ["fg", "reminder-bg"],
  ["danger", "reminder-bg"],
  // Delete-account panel
  ["fg", "danger-bg"],
  ["danger", "danger-bg"],
  // Theme toggle (inactive option) and nav hover
  ["fg-muted", "surface-header"],
  ["fg", "surface-muted"],
  // Dashboard chart axis labels
  ["chart-text", "surface"],
];

const NON_TEXT_PAIRS: [string, string][] = [
  // Control boundaries (inputs, secondary buttons, theme toggle) and focus outlines
  ...["border", "focus"].flatMap((fg) =>
    [...PAGE_SURFACES, "secondary", "reminder-bg"].map((bg): [string, string] => [fg, bg]),
  ),
  ["danger", "surface"], // destructive focus outline and delete-account panel edge
  ["danger", "danger-bg"],
  ["primary", "surface-raised"], // pipeline card hover/focus-within border
  ["chart-bar", "surface"], // dashboard bars
];

describe("SPEC §11 — Light and dark themes (decision 047)", () => {
  it("SPEC §11: both themes define the same token set", () => {
    expect(Object.keys(THEMES.light).length).toBeGreaterThan(20);
    expect(Object.keys(THEMES.dark).sort()).toEqual(Object.keys(THEMES.light).sort());
  });

  it("SPEC §11: the no-JavaScript system fallback uses exactly the dark tokens", () => {
    expect(tokens(FALLBACK_BLOCK)).toEqual(THEMES.dark);
  });

  it("SPEC §11: each theme sets color-scheme so native controls match it", () => {
    expect(LIGHT_BLOCK).toMatch(/color-scheme:\s*light/);
    expect(DARK_BLOCK).toMatch(/color-scheme:\s*dark/);
    expect(FALLBACK_BLOCK).toMatch(/color-scheme:\s*dark/);
  });

  it("SPEC §11: every token used in a contrast pair exists", () => {
    for (const [fg, bg] of [...TEXT_PAIRS, ...NON_TEXT_PAIRS]) {
      expect(THEMES.light, fg).toHaveProperty(fg);
      expect(THEMES.light, bg).toHaveProperty(bg);
    }
  });
});

for (const [theme, t] of Object.entries(THEMES)) {
  describe(`SPEC §11 / WCAG 1.4.3 — Text colours (${theme})`, () => {
    for (const [fg, bg] of TEXT_PAIRS) {
      it(`WCAG 1.4.3: ${theme} ${fg} on ${bg} ≥ 4.5:1`, () => {
        expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(TEXT);
      });
    }
  });

  describe(`SPEC §11 / WCAG 1.4.11 — Control borders, focus and chart (${theme})`, () => {
    for (const [fg, bg] of NON_TEXT_PAIRS) {
      it(`WCAG 1.4.11: ${theme} ${fg} on ${bg} ≥ 3:1`, () => {
        expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(NON_TEXT);
      });
    }
  });
}

describe("SPEC §11 — Mockup colours adjusted for AA (docs/ux-review.md)", () => {
  it("WCAG 1.4.3: the mockup sage #598776 fails with white text (why primary was darkened)", () => {
    expect(ratio("#ffffff", "#598776")).toBeLessThan(TEXT);
  });

  it("WCAG 1.4.11: the mockup input border #e1dad2 fails on white (why it is decorative only)", () => {
    expect(ratio("#e1dad2", "#ffffff")).toBeLessThan(NON_TEXT);
  });

  it("WCAG 1.4.3: the muted grey fails on the rose reminder card (why reminder cards use fg)", () => {
    expect(ratio(THEMES.light["fg-muted"], THEMES.light["reminder-bg"])).toBeLessThan(TEXT);
  });
});

describe("SPEC §11 — Components use only the semantic tokens", () => {
  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return sourceFiles(path);
      return /\.tsx?$/.test(name) ? [path] : [];
    });
  }

  it("SPEC §11: no raw Tailwind palette colours in app/ or components/", () => {
    const raw = /\b(?:bg|text|border|outline|ring|fill|stroke|placeholder:text)-(?:zinc|gray|slate|neutral|stone|blue|red|green|amber|yellow|emerald|rose|sky|indigo)-\d{2,3}\b|\b(?:bg|text)-(?:white|black)\b/;
    const offenders = [...sourceFiles("app"), ...sourceFiles("components")].filter((f) => raw.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
