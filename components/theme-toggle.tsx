"use client";
// Light / Dark theme choice (prompt 11, decision 047). The inline script in app/layout.tsx
// sets data-theme before first paint (system setting on first visit, then the saved choice);
// this toggle reads that attribute and saves new choices in localStorage.
import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
export const THEME_STORAGE_KEY = "theme";

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getTheme(): Theme | null {
  const value = document.documentElement.getAttribute("data-theme");
  return value === "light" || value === "dark" ? value : null;
}

/** The server does not know the theme, so neither button is pressed until hydration. */
const getServerTheme = (): Theme | null => null;

function chooseTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked (private mode): the choice still applies until the page is reloaded
  }
}

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  return (
    <div role="group" aria-label="Theme" className="flex rounded-full border border-border p-0.5 text-sm">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={theme === o.value}
          onClick={() => chooseTheme(o.value)}
          className="rounded-full px-3 py-0.5 text-fg-muted hover:text-fg focus:outline-2 focus:outline-offset-1 focus:outline-focus aria-pressed:bg-primary aria-pressed:text-on-primary"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
