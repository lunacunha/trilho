# UX/UI review — Trilho MVP

Prompt 10 · 22 Nov 2026 · Scope: every page of the MVP (register, login, verify-email, consent, pipeline, new application, application detail, company page, dashboard, privacy, account-deleted, access-denied).

## 1. Method

- **Heuristic review** of every page against Nielsen's 10 usability heuristics (H1–H10 below) and WCAG 2.2 AA (SPEC §11).
- **Cognitive walkthrough** of three key tasks (T1–T3), done as an expert method: at each step, *will the user know what to do, see the control, and understand the feedback?*
- Both were **done by an LLM** (Claude Code) from the source code and the 22 "before" screenshots taken on a Mac in dark mode, and then **checked manually by the developer** in the browser.
- **Contrast ratios** were calculated with the WCAG 2.x relative-luminance formula from Tailwind v4's own colour values (oklch). The same calculation runs as an automated test (`tests/unit/contrast.test.ts`), so a future change that breaks a pair fails the build.
- **Lighthouse** accessibility audit (section 6).
- Severity uses Nielsen's scale: **0** not a problem · **1** cosmetic · **2** minor · **3** major · **4** catastrophe. Effort: **S** < 1 h · **M** < 1 day · **L** more, or needs a product decision.
- **Rule for this round:** fix only findings with severity 3–4 **and** effort S. Everything else goes to the backlog (section 7). The one exception is #8 (privacy), which the developer asked to fix.

Nielsen heuristics: H1 visibility of system status · H2 match with the real world · H3 user control and freedom · H4 consistency and standards · H5 error prevention · H6 recognition rather than recall · H7 flexibility and efficiency · H8 aesthetic and minimalist design · H9 help users recover from errors · H10 help and documentation.

## 2. Summary

> **Update (prompt 11):** decision 046 (light theme only) was later replaced by decision 047: light and dark themes built on design tokens, both checked for WCAG AA (see §9). Prompt 11 also resolved findings #13, #20 and #22. The table below records the state after prompt 10.

| Severity | Findings | Fixed | Backlog |
|---|---|---|---|
| 4 — catastrophe | 2 | 2 | 0 |
| 3 — major | 5 | 4 | 1 |
| 2 — minor | 7 | 1 | 6 |
| 1 — cosmetic | 7 | 0 | 7 |
| 0 — not a problem | 1 | 0 | 1 |
| **Total** | **22** | **7** | **15** |

After prompt 11: **10 fixed, 12 in the backlog** (#13, #20 and #22 resolved).

**What was fixed:**
- **Unreadable text in dark mode (#1, #2).** The create-next-app CSS switched the page to light text on a dark background whenever the OS was in dark mode. The cards, columns and inputs kept their white backgrounds, so their text was nearly invisible (1.06–1.17:1). Grey text, links and success messages on the black page also fell below AA (1.89–2.90:1). Fix: Trilho is light-only in the MVP (decision 046). The dark-mode block is removed and `color-scheme: light` is set. Files: `app/globals.css`.
- **Native controls (#3).** Selects, date pickers and radios now render light. Files: `app/globals.css`.
- **Control borders (#4).** Borders went from zinc-400 (2.63:1) to zinc-500 (4.83:1). Files: `components/form-field.tsx`, `app/pipeline/reminder-actions.tsx`, `app/applications/[id]/delete-application.tsx`.
- **Chart axis labels (#5).** These were fixed by the global change: Chart.js draws them in #666, which was 3.45:1 on black and is now 5.74:1 on white.
- **Finding the company response time (#7).** The application page now has a link: "How long does {company} usually take to reply?". Files: `app/applications/[id]/page.tsx`.
- **Email example (#8).** The email fields now show the fake example `up20XXXXXXX@up.pt`. Files: `components/form-field.tsx` (new `placeholder` prop), `app/login/login-form.tsx`, `app/register/register-form.tsx`, `app/verify-email/resend-form.tsx`.
- **Favicon.** The default Next.js `favicon.ico` was replaced by `app/icon.svg`, a white "T" on blue-700. This is not a finding.

## 3. Findings

| # | Page | Issue | Heuristic / WCAG | Severity | Effort | Status | Note |
|---|---|---|---|---|---|---|---|
| 1 | All (pipeline, forms, cards, history, company) | With the OS in dark mode, text on white cards, columns and inputs inherits #ededed: company names, column headings, Follow-up done / Dismiss, select and date values, typed email (1.06–1.17:1) | WCAG 1.4.3 | 4 | S | Fixed | `globals.css`: dark-mode block removed (decision 046) |
| 2 | All | On the black page, secondary text (zinc-700: 1.89), muted text (zinc-600: 2.56), links (blue-700: 2.90) and success messages (green-800: 2.79) fail AA | WCAG 1.4.3 | 4 | S | Fixed | Same fix: page background is white again |
| 3 | All forms | Native controls follow the OS theme: date picker and select popup render dark, radios inconsistent with the light cards | WCAG 1.4.3 · H4 | 3 | S | Fixed | `color-scheme: light` on `:root` |
| 4 | All forms · pipeline · application detail | Input, select and secondary-button borders are zinc-400 on white (2.63:1), below the 3:1 needed to see where a control is | WCAG 1.4.11 | 3 | S | Fixed | zinc-500 (4.83:1) |
| 5 | Dashboard | Chart axis labels (Chart.js default #666) on the black page: 3.45:1 | WCAG 1.4.3 | 3 | S | Fixed | Fixed by #1/#2; now 5.74:1 on white. The chart is `aria-hidden` and the table has the same data |
| 6 | Pipeline (T3) | Nothing on the pipeline says that company response times exist or where to find them; the nav only has Pipeline and Privacy, and there is no company search, so a company you have not applied to cannot be looked up | H6 · H7 | 3 | L | Backlog | A company list or search is not in SPEC: needs a product decision |
| 7 | Application detail (T3) | The company name in the heading is the only way to the response time, and nothing says that is what it opens | H6 · H10 | 3 | S | Fixed | Added "How long does {company} usually take to reply?" under the role. The heading link stays (US06-6) |
| 8 | Login · register · verify-email | No example of the expected email format on login. The "before" login screenshots show a real-looking student number typed in the field (the typed value, not a placeholder), which must not be published as-is | Privacy · H5 | 2 | S | Fixed | `placeholder="up20XXXXXXX@up.pt"` in zinc-600 (7.73:1). Blur or crop the number in `before-login.png` (section 8). Fixed at the developer's request although severity is 2 |
| 9 | Pipeline (T2) | A card with a reminder shows the day count twice ("16 days" and "16 days · Follow up?"); for an application in "In process" the two numbers differ (days since sent vs days without news), with no label saying which is which | H2 · H8 | 2 | S | Backlog | Rewording the card (e.g. "Sent 16 days ago") is a copy decision; check it in the usability test first |
| 10 | Pipeline (T2) | The reminder does not say why it appeared (company's typical time vs the 14-day rule), or that both buttons only hide it until the next status change | H10 · H2 | 2 | S | Backlog | Reminder copy and buttons are fixed by US05-1; observe T2 in the usability test (H3) before changing |
| 11 | Pipeline (T2) | After "Follow-up done" or "Dismiss" the reminder just disappears, with no confirmation that the choice was saved | H1 | 2 | S | Backlog | US05-5 only requires that it disappears; a short status message would need a decision on wording |
| 12 | All forms | After a failed submit, focus stays on the button, and only the general message is announced (`role="alert"`), not the field errors | WCAG 3.3.1 · 4.1.3 · H9 | 2 | M | Backlog | Needs focus management in every form; test with a screen reader first |
| 13 | Header | The nav does not show the current page (no `aria-current`, no visual state) | H1 · WCAG 2.4.8 (AAA) | 2 | S | Fixed (prompt 11) | Active item is green and has `aria-current="page"` (§9.5) |
| 14 | Login | No "Forgot password?" | H9 | 2 | L | Backlog | Password reset is not in the MVP scope (needs email flow and SPEC) |
| 15 | New application (T1) | After saving, the only feedback is the new card appearing in "Sent"; no "Application saved" message | H1 | 1 | S | Backlog | The card is visible right away at the top of "Sent" |
| 16 | All forms | Nothing says that every field is required | H5 · WCAG 3.3.2 | 1 | S | Backlog | All fields are required, and errors are clear when one is missing |
| 17 | New application | No explicit "Cancel" next to "Save application"; only "← Pipeline" above the heading | H3 | 1 | S | Backlog | The back link and browser back both work |
| 18 | Company page (T3) | "Median-based range" is statistics jargon for most students | H2 | 1 | S | Backlog | The text is fixed by US06-1; check in the usability test |
| 19 | Pipeline | Empty columns show only the heading with "(0)" | H1 | 1 | S | Backlog | The count already says it is empty |
| 20 | Privacy settings | In the delete-account confirmation, "Cancel" is a filled blue primary button next to the red "Yes, delete my account", so both look like main actions | H4 · H5 | 1 | S | Fixed (prompt 11) | Cancel now uses the neutral secondary button (§9.5) |
| 21 | All | No "skip to content" link | WCAG 2.4.1 | 1 | S | Backlog | Landmarks (`header`, `nav`, `main`) satisfy 2.4.1; the nav has only 2–3 links |
| 22 | All | `globals.css` sets `font-family: Arial`, so the Geist font that the layout loads is never used | H8 | 0 | S | Fixed (prompt 11) | Source Sans 3 / Source Serif 4 are loaded and used (§9.3) |

## 4. Contrast

> **Prompt 11:** the colours below were replaced by design tokens with a light and a dark theme. See [§9 Visual design](#9-visual-design) for the current palette. This section records the prompt 10 state.

### 4.1 Colour set (after)

All text uses a small set of colours on white (#ffffff), on the column background (zinc-100) and on the danger panel (red-50).

| Role | Tailwind | On white | On zinc-100 | On red-50 | Required |
|---|---|---|---|---|---|
| Primary text (body) | #171717 / zinc-900 | 17.93 | 16.29 | — | 4.5 |
| Secondary text | zinc-700 | 10.46 | ≥ 4.5 ✓ | ≥ 4.5 ✓ | 4.5 |
| Muted text (hints, labels, meta, placeholder) | zinc-600 | 7.73 | ≥ 4.5 ✓ | ≥ 4.5 ✓ | 4.5 |
| Links | blue-700 | 6.82 | ≥ 4.5 ✓ | — | 4.5 |
| Errors | red-700 | 6.42 | ≥ 4.5 ✓ | ≥ 4.5 ✓ | 4.5 |
| Success | green-800 | 7.09 | — | — | 4.5 |
| Reminder | amber-900 | 9.09 | — | — | 4.5 |
| Button text | white on blue-700 / red-700 | 6.82 / 6.42 | — | — | 4.5 |
| Control borders | zinc-500 | 4.83 | — | — | 3 |
| Focus outline | blue-600 | 5.26 | — | — | 3 |
| Chart bars / axis labels | #2563eb / #666 | 5.17 / 5.74 | — | — | 3 / 4.5 |

Every pair on zinc-100 and red-50 marked ✓ is checked by `tests/unit/contrast.test.ts`.

### 4.2 Before → after

"Before" is the screen on a Mac in dark mode (page #0a0a0a, inherited text #ededed). In light mode the old CSS already gave the "after" colours, except for the borders (#4) and the missing placeholder (#8).

| Element | Before | After | Ratio before → after |
|---|---|---|---|
| Company name on card, column heading on zinc-100 | #ededed on white / zinc-100 | #171717 | 1.17 / 1.06 → 17.93 / 16.29 |
| Follow-up done / Dismiss text | #ededed on white | #171717 | 1.17 → 17.93 |
| Select text ("Choose a sector"), date value, typed email | #ededed on white | #171717 | 1.17 → 17.93 |
| Email placeholder (login, register, verify-email) | none | zinc-600 `up20XXXXXXX@up.pt` | — → 7.73 |
| Subtitles, consent descriptions, dashboard labels (zinc-700) | zinc-700 on #0a0a0a | zinc-700 on white | 1.89 → 10.46 |
| Hints, `dt` labels, history dates (zinc-600) | zinc-600 on #0a0a0a | zinc-600 on white | 2.56 → 7.73 |
| Links ("← Pipeline", company name, "Log in") | blue-700 on #0a0a0a | blue-700 on white | 2.90 → 6.82 |
| Success message ("Status updated.") | green-800 on #0a0a0a | green-800 on white | 2.79 → 7.09 |
| Error message | red-700 on #0a0a0a | red-700 on white | 3.08 → 6.42 |
| Chart axis labels | #666 on #0a0a0a | #666 on white | 3.45 → 5.74 |
| Input, select, secondary button border | zinc-400 on white | zinc-500 on white | 2.63 → 4.83 |

## 5. Cognitive walkthrough (expert method, not a user test)

A first-time FEUP master's student, already registered and past the consent screen, on a laptop. At each step: **Know?** will they know what to do · **See?** will they see the control · **Feedback?** will they understand the result. ✗ marks a problem (finding number in brackets). This walkthrough describes the app after the fixes, and notes where the "before" version failed.

### T1 — Log a new application to Lumen Energy, sent today via LinkedIn Easy Apply

| Step | Action | Know? | See? | Feedback? |
|---|---|---|---|---|
| 1 | On the pipeline, click "+ New application" (or "Log your first application" if empty) | ✓ the main button, top right | ✓ blue button, 6.82:1 | ✓ the "New application" form opens |
| 2 | Type "Lumen" in Company | ✓ | ✓ (before: typed text invisible, #1) | ✓ the browser suggests "Lumen Energy" if it exists; a new name is also accepted |
| 3 | Type a role | ~ the task does not give one; the student invents it | ✓ | ✓ |
| 4 | Sector → "Energy & Utilities" | ✓ | ✓ (before: "Choose a sector" invisible, #1/#3) | ✓ |
| 5 | Channel → "LinkedIn Easy Apply" | ✓ the exact label is in the list | ✓ | ✓ |
| 6 | Job type | ~ the task does not say; the student must choose | ✓ | ✓ |
| 7 | Date sent | ✓ already today, nothing to do | ✓ (before: date invisible, #1) | ✓ |
| 8 | Click "Save application" | ✓ | ✓ | ~ back on the pipeline with the card in "Sent", no "Saved" message (#15) |

Problems: #1, #3 (fixed); #15 (backlog). Seven controls, and two of them need nothing. The 30-second target (H1) looks reachable, but it needs to be measured (usability test).

### T2 — A reminder appears on a card. Decide what to do and act on it

| Step | Action | Know? | See? | Feedback? |
|---|---|---|---|---|
| 1 | Notice the reminder on a card in "Sent" or "In process" | ✓ "16 days · Follow up?" in amber, separated by a line | ✓ (before: the buttons were invisible, #1) | — |
| 2 | Understand what it means | ✗ the card already says "16 days"; why now? which number counts? (#9, #10) | ✓ | — |
| 3 | Decide: email the company outside Trilho, then "Follow-up done"; or "Dismiss" | ~ "Follow-up done" could be read as "Trilho will follow up for me"; what "Dismiss" does later is unclear (#10) | ✓ borders 4.83:1 (#4) | — |
| 4 | Click a button | ✓ | ✓ | ~ the reminder disappears with no message (#11) |

Problems: #1, #4 (fixed); #9, #10, #11 (backlog). These matter for H3: if students misread "Follow-up done", M4 measures the wrong thing. They are the first things to observe in the usability test.

### T3 — Find out how long Northwind Consulting usually takes to reply

| Step | Action | Know? | See? | Feedback? |
|---|---|---|---|---|
| 1 | On the pipeline, look for response times | ✗ nothing mentions them; the nav has only Pipeline and Privacy (#6) | — | — |
| 2 | Open a Northwind Consulting card | ~ only if the student guesses that the detail page has it | ✓ (before: the company name was invisible, #1) | ✓ the application page opens |
| 3 | Find the way to the company | ✓ now: "How long does Northwind Consulting usually take to reply?" (#7); before: only the underlined name | ✓ | — |
| 4 | Read the company page | ✓ "Typical response time: 2–3 weeks" | ✓ | ~ "Median-based range" is jargon (#18); "Not enough data yet" is clear |

Problems: #1 (fixed); #7 (fixed); #6, #18 (backlog). Assumption: the student has an application to Northwind. Without one, the task cannot be done (#6).

## 6. Lighthouse (Accessibility)

Run on 22 Nov 2026 in Chrome DevTools (Navigation mode, Desktop, "Clear storage" off to keep the session), on the local dev server after the visual redesign (prompt 11).

| Page | Account | Light | Dark |
|---|---|---|---|
| `/login` | — | 100 | 100 |
| `/pipeline` (with reminders) | student (demo) | 100 | 100 |
| `/applications/new` | student (demo) | 100 | — |
| `/applications/[id]` | student (demo) | 100 | — |
| `/companies/[id]` (with statistic) | student (demo) | 100 | — |
| `/settings/privacy` | student (demo) | 100 | — |
| `/admin/overview` (with chart) | Career Service | 100 | 100 |

Lighthouse also lists 10 "items to check manually" on every page (keyboard focus, tab order, focus traps, focus on new content, landmarks, offscreen content). These were covered by the keyboard-only manual check. Automated tools only detect part of accessibility issues, which is why this review also includes the heuristic review, the cognitive walkthrough and the manual checks.

## 7. Backlog

| # | Finding | Why not now |
|---|---|---|
| 6 | No way to look up a company you have not applied to | Effort L, and a company list or search is not in SPEC: needs a product decision |
| 9 | Duplicate or ambiguous day counts on a card with a reminder | Severity 2; copy change to decide after the usability test |
| 10 | Reminder does not explain why it appeared or what the buttons do | Severity 2; the labels are fixed by US05-1; test T2 first |
| 11 | No confirmation after Follow-up done / Dismiss | Severity 2; wording to decide |
| 12 | Field errors are not announced and focus does not move to them | Severity 2, effort M; every form |
| 14 | No "Forgot password?" | Out of MVP scope |
| 15 | No "Application saved" message | Severity 1; the new card is the feedback |
| 16 | Required fields not marked | Severity 1; all fields are required, and errors are clear |
| 17 | No Cancel on the new-application form | Severity 1; back link exists |
| 18 | "Median-based range" jargon | Severity 1; text fixed by US06-1 |
| 19 | Empty columns show only a heading | Severity 1 |
| 21 | No skip link | Severity 1; landmarks satisfy 2.4.1 |

## 8. Before / after

Screenshots go in `docs/screenshots/`. "Before": Mac in dark mode, before the fix. "After": the same page and data after the fix, with the Mac in dark mode too (to show the light theme is forced).

> **Privacy:** the "before" login screenshots show a real-looking student number in the email field (#8). Blur or crop it before adding `before-login.png`.

| Page | Before | After |
|---|---|---|
| Register | ![](screenshots/before-register.png) | ![](screenshots/after-register.png) |
| Login | ![](screenshots/before-login.png) | ![](screenshots/after-login.png) |
| Consent | ![](screenshots/before-consent.png) | ![](screenshots/after-consent.png) |
| Pipeline | ![](screenshots/before-pipeline.png) | ![](screenshots/after-pipeline.png) |
| Pipeline with reminders | ![](screenshots/before-pipeline-reminders.png) | ![](screenshots/after-pipeline-reminders.png) |
| New application | ![](screenshots/before-new-application.png) | ![](screenshots/after-new-application.png) |
| Application detail | ![](screenshots/before-application.png) | ![](screenshots/after-application.png) |
| Company page | ![](screenshots/before-company.png) | ![](screenshots/after-company.png) |
| Dashboard | ![](screenshots/before-dashboard.png) | ![](screenshots/after-dashboard.png) |
| Privacy settings | ![](screenshots/before-privacy.png) | ![](screenshots/after-privacy.png) |
| Account deleted | ![](screenshots/before-account-deleted.png) | ![](screenshots/after-account-deleted.png) |
| Access denied | ![](screenshots/before-access-denied.png) | ![](screenshots/after-access-denied.png) |

## 9. Visual design

Prompt 11 and decision 047 (which replaces 046) changed the look of the app. The style now follows the Assignment 1 mockups (S1–S5): a serif burgundy wordmark and page titles, sage-green primary buttons, pipeline columns in light sage with white cards and a soft shadow, a rose reminder card with burgundy text, and a warm off-white header. Users can pick a **light or dark theme**. This change is visual only, with no new pages, features or copy. The mockup elements that are not in the MVP (Companies/Insights menus, sidebar, filters, hiring process, user name) were left out.

### 9.1 Design tokens

The palette is defined once, as semantic CSS variables in `app/globals.css`:
- light: `:root` / `[data-theme="light"]`;
- dark: `[data-theme="dark"]`;
- a no-JavaScript fallback: `prefers-color-scheme`.

They are exposed to Tailwind through `@theme inline` (`bg-surface`, `text-fg`, `outline-focus`, …). Components never use raw palette colours, and a test enforces this. Light values were sampled from the mockup pixels. Dark values were chosen to keep the same roles: burgundy becomes a light rose and sage becomes a light sage on warm near-black.

`tests/unit/contrast.test.ts` checks every pair the UI uses, in **both** themes: 130+ assertions. The table shows each token's **lowest** ratio over the surfaces it appears on.

| Token | Use | Light | Dark | Lowest ratio light / dark (on) | Required |
|---|---|---|---|---|---|
| `brand` | Wordmark, page titles | `#7f2835` | `#e8a5ae` | 7.59 / 7.35 (surface-muted) | 4.5 |
| `primary` | Primary button, links, active nav | `#4a7062` | `#8cc4af` | 4.53 / 7.50 (surface-muted) | 4.5 |
| `primary-hover` | Hover of primary | `#3b5e52` | `#a3d3c1` | 5.89 / 8.92 (surface-muted) | 4.5 |
| `on-primary` | Text on the primary button | `#ffffff` | `#10201a` | 5.55 / 8.55 (primary) | 4.5 |
| `accent` | Column titles, labels, big numbers | `#3b5e52` | `#a6d4c3` | 5.89 / 9.05 (surface-muted) | 4.5 |
| `fg` | Body text | `#2a2326` | `#f1ece8` | 10.80 (reminder-bg) / 11.12 (secondary) | 4.5 |
| `fg-muted` | Secondary text, hints, chart labels | `#6d6668` | `#b8afb1` | 4.57 / 6.92 (surface-muted) | 4.5 |
| `reminder-fg` | Reminder text | `#7f2835` | `#f6c9cf` | 6.54 / 9.14 (reminder-bg) | 4.5 |
| `danger` | Errors, destructive button | `#a3262c` | `#f29b9b` | 5.14 / 6.41 (reminder-bg) | 4.5 |
| `on-danger` | Text on the danger button | `#ffffff` | `#2a0d10` | 7.31 / 8.54 (danger) | 4.5 |
| `success` | Success messages | `#2f6b4f` | `#8fd3ad` | 5.14 / 8.53 (surface-muted) | 4.5 |
| `border` | Control boundaries (inputs, secondary buttons, toggle) | `#7e7975` | `#80787a` | 3.02 (reminder-bg) / 3.03 (secondary) | 3 |
| `focus` | Focus outline | `#3b5e52` | `#8cc4af` | 5.07 (reminder-bg) / 6.60 (secondary) | 3 |
| `chart-bar` | Dashboard bars | `#4a7062` | `#6fb39b` | 5.55 / 7.11 (surface) | 3 |

These backgrounds and decorative tokens carry no text requirement of their own. Their pairs are covered above.

| Token | Light | Dark |
|---|---|---|
| `surface` (page) | `#ffffff` | `#1b1a1a` |
| `surface-raised` (cards, inputs) | `#ffffff` | `#262324` |
| `surface-muted` (columns, tiles, response-time panel) | `#dfebe4` | `#1f2a26` |
| `surface-header` | `#faf8f5` | `#221f20` |
| `secondary` / `secondary-hover` (neutral button) | `#f4f0ec` / `#e9e3dd` | `#34302f` / `#403b3a` |
| `border-subtle` (decorative card edges, dividers) | `#e1dad2` | `#3a3536` |
| `reminder-bg` | `#e7d4d3` | `#43262b` |
| `danger-bg` / `danger-hover` | `#fbeaea` / `#86191f` | `#3a2022` / `#f6b4b4` |
| `chart-grid` / `chart-text` | `#e1dad2` / `#6d6668` | `#3a3536` / `#b8afb1` |

### 9.2 Mockup colours adjusted for AA

| Mockup colour | Problem | Change |
|---|---|---|
| Sage button `#598776` with white text | 4.08:1 < 4.5. It is also 3.85 for the green active nav text on the off-white header. | `primary` darkened to `#4a7062`. This is the smallest darkening that passes 4.5 on every surface it sits on (white 5.55, header, sage column 4.53). The mockup dark green `#3b5e52` is used for hover. |
| Input border `#e1dad2` | 1.39:1 on white < 3 (WCAG 1.4.11) | Kept only for decorative edges (`border-subtle`). Control boundaries use `#7e7975`, the lightest grey that reaches 3:1 on every light surface, including the rose card. |
| Muted grey `#6d6668` on the rose card `#e7d4d3` | 3.93:1 < 4.5 | Reminder cards show role and days in `fg` (`#2a2326`, 10.8:1), as in the mockup. |

Each of these "why" cases is also a test that asserts the mockup value fails.

### 9.3 Typography

- **Source Serif 4** for the wordmark and `h1` page titles, in burgundy.
- **Source Sans 3** for everything else.
- Both are loaded with `next/font/google`, so there is no new npm dependency.

This also resolves finding #22: Geist was loaded but Arial was used.

### 9.4 Theme toggle

- A "Light / Dark" button group sits in the header on every page, including login and register. The selected option has `aria-pressed`.
- On first visit the app follows the system setting (`prefers-color-scheme`). A choice is saved in `localStorage` under the key `theme`.
- **No flash:** an inline script in `<head>` (`app/layout.tsx`) sets `data-theme` on `<html>` before first paint. This is the pattern from the Next.js guide *Preventing flash before hydration*. `<html>` has `suppressHydrationWarning`.
- The toggle reads the attribute with `useSyncExternalStore`. Neither option is pressed during server rendering, so there is no hydration mismatch.
- Without JavaScript, CSS falls back to the system setting.
- `color-scheme` follows the theme, so native inputs, selects and date pickers match it.
- The dashboard chart reads `--chart-bar`, `--chart-grid` and `--chart-text` from the page and redraws when the theme changes.

### 9.5 Other visual changes

- The active nav item is green and has `aria-current="page"` (resolves finding #13). "Pipeline" stays active on application and company pages, as in mockups S2–S3.
- Buttons are rounded (pill) as in the mockups. A new `secondaryButtonClass` is used for Cancel actions. This resolves finding #20: Cancel in delete account is no longer a filled primary button.
- The favicon is now burgundy.