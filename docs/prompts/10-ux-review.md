# Prompt 10 — UX/UI review and contrast fix

## Goal
Fix the low-contrast problem across the app, run a heuristic review and a cognitive walkthrough of the app, fix the high-severity issues that are quick, prepare a real usability test, and document everything in `docs/ux-review.md`.

## Read first
- `SPEC.md` §11 (accessibility: WCAG AA) and the user stories US01–US08
- `docs/product/mvp-scope.md` §5 (hypotheses H1–H3)
- `app/globals.css`, `app/layout.tsx`, all pages in `app/` and components in `components/`
- "Before" screenshots: `~/trilho-screenshots/before/` (look at them; they were taken on a Mac in dark mode)

## Known problem (already diagnosed)
`app/globals.css` sets `body` to `var(--background)` / `var(--foreground)`, and the create-next-app `@media (prefers-color-scheme: dark)` block switches them to dark background + light text. Cards and columns keep a fixed white/light background, so they inherit light text and become nearly invisible. Affected: column headings, company names on cards, form placeholders, the Follow-up done / Dismiss buttons, grey subtitles, blue links on black.

## Decisions already made
- Trilho uses a **light theme only** in the MVP. Remove the dark-mode block and set `color-scheme: light` so native inputs and date pickers render light too. Proper dark mode is out of scope.
- All text must meet WCAG AA: 4.5:1 for normal text, 3:1 for large text and for UI component boundaries (inputs, buttons). Placeholders count as text. Visible focus on every interactive element.
- No logo: the "Trilho" wordmark in the header is enough.
- No new dependencies. No changes to business rules, services or data.

## Steps
1. **Contrast fix** (global first, then per component). Use a small, consistent set of Tailwind colours for text (primary, secondary, muted) that all pass AA on their backgrounds. Report the colour pairs used and their contrast ratios.
2. **Heuristic review** of every page (register, login, verify-email, consent, pipeline, new application, application detail, company page, dashboard, privacy, account-deleted, access-denied) against Nielsen's 10 heuristics and WCAG AA. For each finding: page, issue, heuristic or WCAG criterion, severity 0–4 (Nielsen scale), effort (S/M/L), proposed fix.
3. **Cognitive walkthrough** (expert method, not a user test). Walk through these three tasks as a first-time FEUP student, step by step, asking at each step: will the user know what to do, see the control, and understand the feedback? Record problems as findings in the same table.
   - T1: Log a new application to Lumen Energy, sent today via LinkedIn Easy Apply.
   - T2: A reminder appears on a card. Decide what to do and act on it.
   - T3: Find out how long Northwind Consulting usually takes to reply.
4. **Fix** only findings with severity 3–4 and effort S. List everything else as backlog with a one-line reason.
5. **Favicon:** replace the default Next.js favicon with a simple SVG "T" in the app's primary colour (`app/icon.svg`), and remove the default `favicon.ico` if present.
6. **`docs/ux-review.md`:**
   - Method: heuristic review against Nielsen + WCAG AA and a cognitive walkthrough, both done by an LLM and then checked manually by the developer; Lighthouse accessibility score.
   - Summary: number of findings by severity; what was fixed.
   - Findings table: # | Page | Issue | Heuristic / WCAG | Severity | Effort | Status (Fixed / Backlog) | Note.
   - Contrast table: element | before | after | ratio.
   - Cognitive walkthrough section, clearly labelled "Cognitive walkthrough (expert method, not a user test)", with the steps of T1–T3 and the problems found.
   - "Lighthouse (Accessibility)": a placeholder score; I will run it and fill it in.
   - Before / after: placeholders for screenshots (`screenshots/before-*.png`, `screenshots/after-*.png`); I will add the images.
   - Backlog with reasons.
7. **`docs/usability-test-plan.md`** for a real test I will run later with 2–3 FEUP students:
   - goal and participants;
   - the same three tasks (T1–T3) with success criteria; T1 also timed against the 30 s target of H1;
   - a short script: intro, think-aloud, no help from the facilitator;
   - post-task questions, including "Do you still keep any application in a spreadsheet?" (H1);
   - a notes grid per participant;
   - how the results map to H1–H3.
   Do not invent results.



## Rules
- Tests must stay green (`npm test`), plus lint and build. Do not change test expectations to make tests pass.
- Do not run db:seed, sign-ups or deletions on dev. Do not send emails.
- Keep all user-facing copy in English; only change wording when it is a finding.
- Do not commit.

## Report
- Contrast pairs and ratios.
- Findings by severity; what you fixed and in which files.
- A manual check list for me: each page in light theme (also with my Mac in dark mode), keyboard-only through the new-application form and the reminder buttons, 375 px on pipeline and dashboard.