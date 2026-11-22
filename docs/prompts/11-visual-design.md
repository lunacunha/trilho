# Prompt 11 — Visual design and light/dark theme

## Goal
Make Trilho look like the Assignment 1 mockups (palette, typography, cards) and let the user choose between a light and a dark theme. Visual changes only.

## Read first
- Mockups: `~/Desktop/trilho-screenshots/mockups/` (pages S1–S5 of the Assignment 1 PDF). Extract the palette and styling from them.
- `docs/ux-review.md` and `tests/unit/contrast.test.ts` (WCAG AA work from prompt 10, which must not regress)
- `app/globals.css`, `app/layout.tsx`, all pages in `app/` and components in `components/`

## Style to match (from the mockups)
- Wordmark "Trilho" and page titles: serif, burgundy.
- Primary buttons: sage green, rounded, white text. Secondary buttons: light neutral.
- Pipeline columns: light sage background, white cards with a soft shadow, column title in dark green with the count.
- Reminder card: rose background with burgundy text.
- Header: warm off-white bar; the active nav item in green.
- Body text: a clean sans-serif. Use fonts already available (next/font with a Google font is fine; no new npm dependency).

## Decisions already made
- **Visual only.** Do not add pages, nav items, features or copy that are in the mockups but not in the MVP (Companies / Insights menus, hiring process, sidebar, filters, "Typical hiring process", follow-up button on the company page, user name in the header). Do not change business rules, services, data or tests' expectations.
- **Design tokens:** define the palette once as semantic CSS variables (e.g. brand, primary, primary-hover, surface, surface-muted, text, text-muted, border, reminder-bg, reminder-text, danger, focus) in `app/globals.css` (Tailwind v4 `@theme`), with a light and a dark set. Components use the semantic tokens, not raw colours.
- **WCAG AA in both themes:** text ≥ 4.5:1, large text and UI boundaries ≥ 3:1, visible focus. If a mockup colour fails (e.g. white on the sage-green button), darken it as little as possible and report the change.
- **Theme choice:** a toggle in the header (Light / Dark), available on every page including login. First visit follows the system setting; the choice is remembered in the browser. No flash of the wrong theme on load (set the theme before first paint). No new dependency.
- The Chart.js chart on the dashboard must use the theme colours and stay readable in both themes.

## Tests
- Update `tests/unit/contrast.test.ts` to check every token pair in **both** themes (replace the "no dark-mode block" check with this). Keep the test names with SPEC §11 / WCAG IDs.
- `npm test`, lint and build must pass.

## Docs
- `docs/ux-review.md`: add a "Visual design" section: palette table (token | light | dark | contrast ratio), any mockup colour that was adjusted for AA and why, and the theme toggle.

## Rules
- Do not run db:seed, sign-ups or deletions on dev. Do not send emails.
- Do not commit.

## Report
- Palette (both themes) with ratios; colours changed from the mockups.
- Files changed.
- Manual check list for me: every page in light and dark; the toggle on login and after login; reload keeps the choice; no flash; keyboard focus visible in both themes; 375 px; dashboard chart in both themes.