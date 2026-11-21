# Trilho — Specification

_Version 1.0 · 15 Nov 2026 · Source of truth for the MVP._

Related documents: [`docs/product/mvp-scope.md`](docs/product/mvp-scope.md) (scope, hypotheses, metrics) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/decisions.md`](docs/decisions.md)

## 1. Product in one paragraph

Trilho is a web app where FEUP master's students log their job applications, see them in a pipeline grouped by status, get a reminder when an application goes quiet, and see each company's typical response time based on the anonymous experience of other students. The FEUP Career Service sees aggregated, anonymous employability data during the search, instead of survey data months after graduation.

## 2. Glossary

| Term | Meaning |
|---|---|
| Application | A job application logged by a student: company, role, sector, channel, job type, date sent, current status. |
| Status change | A dated record of an application moving to a status. Every application has at least one (the initial "Sent"). |
| Consenting student | A student whose consent to share anonymised data is **currently** `true`. |
| First response | See R1. |
| Response time | Days between the date sent and the first response (R1). |
| Company statistic | The typical response time of a company (R2), only shown when R3 is met. |
| Quiet period | The time since an application's last status change. Reminders belong to a quiet period (R12). |
| Today | The current date in the `Europe/Lisbon` time zone. Business rules receive "today" as a parameter. |

## 3. Roles and permissions

There are two roles: `student` and `career_service`. Registration always creates a `student`. `career_service` accounts are created by the seed; there is no sign-up for them.

| Action | Not logged in | `student` | `career_service` |
|---|---|---|---|
| Register, log in | ✅ | — | — |
| Answer / change consent | ❌ | ✅ own | ❌ |
| Create, view, edit, delete applications | ❌ | ✅ own only | ❌ |
| View company page | ❌ | ✅ | ❌ |
| View Career Service dashboard | ❌ | ❌ (access denied) | ✅ |
| Delete account | ❌ | ✅ own | ❌ |

A student can never see, edit or infer another student's individual data. Authorization is enforced in the service layer, not only in the UI.

## 4. Application statuses

| Status | Set by | Pipeline column |
|---|---|---|
| Sent | Student (on creation, or manually) | Sent |
| In process | Student | In process |
| Interview | Student | Interview |
| Offer | Student | Offer |
| Rejected | Student | Closed |
| No response | **System only** (R5) | Closed |

Transitions follow R6.

## 5. Fixed lists

- **Sector:** Consulting · Energy & Utilities · Finance & Banking · Industry & Manufacturing · Logistics & Supply Chain · Retail & Consumer Goods · Technology & Software · Telecom · Health · Public Sector · Other
- **Channel:** Company portal · LinkedIn Easy Apply · LinkedIn (external) · Referral · Career Fair · Job board · Spontaneous application · Other
- **Job type:** Summer internship · Professional internship · Trainee programme · Full-time · Dissertation in a company

The lists are loaded by the seed and cannot be edited in the MVP (US15 is out of scope).

## 6. Business rules

Each rule has an ID referenced by stories and tests.

**R1 — First response.** The first status change from "Sent" to any status **except** "No response". "No response" is the absence of a response, not a response.
_Example:_ sent on 1 Oct, moved to "In process" on 18 Oct → first response on 18 Oct, response time 17 days.
_Example:_ sent on 1 Oct, auto "No response" on 30 Nov, then "Interview" on 5 Dec → first response on 5 Dec, response time 65 days.

**R2 — Typical response range.** Take the median of the response times (in days) of the eligible applications (R3). Convert to weeks (median ÷ 7). The range goes from the week rounded down to the week rounded up.
- _Example:_ median 17 days → 2.43 weeks → **"2–3 weeks"**.
- _Example:_ median 14 days → exactly 2 weeks → **"about 2 weeks"**.
- _Example:_ median 5 days (< 7) → **"less than 1 week"**.
- With an even number of values, the median is the average of the two middle values (e.g. 10, 12, 20, 30 → 16 days → "2–3 weeks").

**R3 — Statistic threshold.** A company statistic is shown only with **≥ 5 applications that have a first response (R1)**, counting only applications of **consenting students** at the moment of the calculation.
_Example:_ 6 applications with a response, 2 of them from students who withdrew consent → 4 → "Not enough data yet".

**R4 — Reminder trigger.** Applies only to applications in "Sent" or "In process". Count the days since the **last status change** (for a new application, the date sent).
- If the company has a statistic (R3 met): threshold = the company's **median** response time in days.
- Otherwise: threshold = **14 days**.
- A reminder is shown when days since last change **≥ threshold**.
- If the median is not a whole number, the threshold is rounded up (e.g. median 16.5 → threshold 17 days), because days are whole numbers.

_Example:_ company median 17 days; application in "Sent", last change 17 days ago → reminder. 16 days ago → no reminder.
_Example:_ company without statistic; 14 days → reminder; 13 days → no reminder.

**R5 — 60-day "No response" rule.** An application in "Sent" or "In process" whose last status change was **≥ 60 days** ago automatically becomes "No response". The rule is evaluated when the student's pipeline is loaded. The status change is recorded with date **= last change + 60 days** (not the day the student opened the app).
_Example:_ last change on 1 Sep; the student opens the pipeline on 15 Nov → "No response", recorded on 31 Oct.
_Example:_ application in "Interview" since 1 Sep → unchanged.

**R6 — Status transitions.** A student can move an application freely between the manual statuses (Sent, In process, Interview, Offer, Rejected), in any direction, to correct mistakes. "No response" is never selectable manually. An application in "No response" can move to any manual status (late reply). Every change creates a status change record. The date of the change is pre-filled with today; the student only changes it if the reply came on another day. It cannot be in the future or before the date sent. It also cannot be before the application's previous status change, so the history stays in chronological order. Changing to the status the application already has (e.g. Sent → Sent) is rejected: it is not a real change and would reset the reminder's quiet period (R12). The service enforces this rule itself, not only the form.

**R7 — Reply rate (dashboard).** Applications with a first response (R1) ÷ all applications, counting only consenting students.
_Example:_ 20 applications to Northwind, 7 with a first response → 35%.

**R8 — Dashboard privacy threshold.** A company or a channel only appears in the dashboard with **≥ 5 applications** from consenting students. Below that, a single row could identify a student.
_Example:_ only Luna applied to company X → company X does not appear.

**R9 — Active student (dashboard).** A consenting student who created an application or made a status change in the **last 30 days** (today included).
_Example:_ today 15 Nov; last activity 20 Oct → active; last activity 10 Oct → not active.
_Boundary:_ the window is today plus the 29 previous days. Today 15 Nov → 17 Oct is active; 16 Oct is not.

**R10 — Days since sent (pipeline card).** Today − date sent, in calendar days.
_Example:_ sent on 1 Nov, today 15 Nov → "14 days".

**R11 — Company name normalisation.** Two company names are the same company if they are equal after: trimming leading/trailing spaces, collapsing repeated inner spaces, and converting to lowercase. The display name is the first version typed (trimmed).
_Example:_ "Lumen Energy" exists; a student types " lumen  ENERGY " → linked to "Lumen Energy", no new company.
_Example:_ "Lumen" and "Lumen Energy SA" are **different** companies (merging is US15, out of scope).

**R12 — Reminder lifecycle.** A reminder belongs to one quiet period of one application. "Follow-up done" or "Dismiss" hides the reminder for that quiet period and does not change the status. A new status change starts a new quiet period, in which a new reminder can appear (R4).

## 7. User stories and acceptance scenarios

Each scenario has an ID (e.g. `US02-3`) used in test names.

### US01 — Register, verify and consent
_As a student, I want to register with my university email and choose whether to share my data anonymously, so that I control my privacy._

- **US01-1 Register with an allowed email.** Given no account exists for `ana@up.pt`, when she registers with name, email `ana@up.pt` and a password of at least 8 characters, then an account with role `student` is created, a verification email is sent, and she sees "Check your inbox to verify your email".
- **US01-2 Reject other domains.** Given the registration form, when someone registers with `ana@gmail.com`, then the error "Use your University of Porto email (@up.pt or @fe.up.pt)" is shown and no account is created. The domain check ignores case (`ANA@UP.PT` is accepted). Only the exact domains are accepted: subdomains such as ana@edu.fe.up.pt are rejected.
- **US01-3 Unverified accounts cannot log in.** Given a registered but unverified account, when the student logs in with the correct password, then she is not logged in and sees "Verify your email first", with an option to resend the email.
- **US01-4 Consent comes first.** Given a verified student who has not answered the consent question, when she logs in or opens any page, then she is redirected to the consent screen, and neither option is pre-selected.
- **US01-5 Decline consent.** Given the consent screen, when she chooses "Don't share", then her consent is `false` (with the date), she is taken to the pipeline, she can use every student feature, and her applications never enter any statistic (R3, R7, R8, R9).
- **US01-6 Give consent.** Given the consent screen, when she chooses "Share anonymously", then her consent is `true` (with the date) and her applications count in statistics.
- **US01-7 Consent is asked once.** Given a student who already answered, when she logs in, then she goes straight to the pipeline.

### US02 — Log an application
_As a student, I want to log an application in under 30 seconds, so that I don't waste time organising._

- **US02-1 Save a complete application.** Given a logged-in student on the new application form, when she fills company "Lumen Energy", role "Operations Trainee", a sector, a channel, a job type, keeps the date (today) and saves, then the application is created with status "Sent", an initial status change ("Sent", date sent) is recorded, and she returns to the pipeline where it appears under "Sent".
- **US02-2 Missing field.** Given the form, when she saves with any required field empty, then an error is shown next to that field, nothing is saved, and the values already typed are kept.
- **US02-3 Date sent.** The date defaults to today. A date in the future is rejected with "Date sent cannot be in the future".
- **US02-4 Company suggestions.** Given companies "Lumen Energy" and "Lusíadas Saúde" exist, when she types "lu", then both are suggested (case-insensitive "contains" match, maximum 5 suggestions).
- **US02-5 New company.** Given no company "Douro Software" exists, when she saves an application with it, then the company is created and the application is linked to it.
- **US02-6 Same company, different spelling.** Given "Lumen Energy" exists, when she saves with " lumen  ENERGY ", then no new company is created and the application is linked to "Lumen Energy" (R11).
- **US02-7 Fixed lists are enforced.** When a sector, channel or job type outside the fixed lists is submitted, then the server rejects it.

### US03 — See my pipeline
_As a student, I want to see all my applications grouped by status, so that I know where each one stands._

- **US03-1 Columns and counts.** Given a student with 3 Sent, 2 In process, 1 Interview, 1 Offer, 1 Rejected and 1 No response, when she opens the pipeline, then she sees the columns Sent (3), In process (2), Interview (1), Offer (1), Closed (2).
- **US03-2 Card content.** Each card shows company, role and days since sent (R10). Cards in "Closed" also show whether they are "Rejected" or "No response".
- **US03-3 Only my applications.** Given another student has applications, then they never appear in this student's pipeline. Opening another student's application by URL shows "Not found" (the app does not reveal that it exists).
- **US03-4 Empty pipeline.** Given a student with no applications, then the pipeline shows a short message and a "Log your first application" button.
- **US03-5 60-day rule on load.** R5 is applied before the pipeline is shown.

### US04 — Update, edit or delete
_As a student, I want to update, edit or delete an application, so that my pipeline stays current._

- **US04-1 Change status.** Given an application in "Sent", sent on 1 Oct, when the student changes it to "In process" with date 18 Oct, then the status is updated and a status change ("In process", 18 Oct) is recorded. The detail page shows the full history in chronological order, each entry with "after N days" since the date sent.
- **US04-2 Manual statuses only.** The status selector offers Sent, In process, Interview, Offer and Rejected — never "No response" (R6).
- **US04-3 Status change date.** The date field is pre-filled with today; the student only changes it if the reply came on another day. A future date or a date before the date sent is rejected (R6). A date before the previous status change, or a change to the current status, is also rejected (R6).
- **US04-4 Edit fields.** The student can edit any of the six fields, with the same validation as US02. Editing fields does not create a status change.
- **US04-5 Delete.** When she chooses "Delete", a confirmation is required. On confirm, the application and its status history are deleted and she returns to the pipeline. On cancel, nothing changes.
- **US04-6 60-day rule.** Given an application in "Sent" whose last change was on 1 Sep, when the pipeline loads on 15 Nov, then it is "No response" with a status change dated 31 Oct (R5).
- **US04-7 60-day rule ignores Interview and Offer.** Given an application in "Interview" since 1 Sep, when the pipeline loads on 15 Nov, then it stays in "Interview".
- **US04-8 Late reply.** Given an application in "No response", when the student moves it to "Interview", then the change is allowed and recorded.

### US05 — Follow-up reminder
_As a student, I want to be reminded when an application goes quiet, so that I know when to follow up._

- **US05-1 Reminder from company data.** Given a company with a median response time of 17 days and an application in "Sent" whose last change was 17 days ago, when the pipeline loads, then the card shows "17 days · Follow up?" with the buttons "Follow-up done" and "Dismiss".
- **US05-2 Not yet.** Same company, last change 16 days ago → no reminder.
- **US05-3 14-day fallback.** Given a company without a statistic: last change 14 days ago → reminder; 13 days ago → no reminder.
- **US05-4 Only Sent and In process.** Given an application in "Interview" with no change for 30 days → no reminder.
- **US05-5 Follow-up done.** When the student clicks "Follow-up done", then the reminder disappears for this quiet period, the status does not change, and the event is recorded.
- **US05-6 Dismiss.** When the student clicks "Dismiss", then the reminder disappears for this quiet period and the event is recorded. If no reminder is showing for the application, "Follow-up done" and "Dismiss" return "Not found".
- **US05-7 New quiet period.** Given a dismissed reminder, when the status changes to "In process" and the new threshold passes without another change, then a new reminder appears (R12).

### US06 — Company response time
_As a student, I want to see a company's typical response time, so that I know whether to wait or move on._

- **US06-1 Statistic shown.** Given "Lumen Energy" has 23 applications with a first response from consenting students and a median of 17 days, when a student opens its page, then she sees "Typical response time: 2–3 weeks" and "Median-based range · based on 23 student applications".
- **US06-2 Exact weeks.** With a median of 14 days → "about 2 weeks".
- **US06-3 Not enough data.** With 4 applications with a first response → "Not enough data yet" and no numbers.
- **US06-4 Consent filter.** Given 6 applications with a first response, 2 of them from non-consenting students → 4 count → "Not enough data yet".
- **US06-5 What is never shown.** The page never shows reply or rejection rates, rankings, comparisons between companies, or any individual student's data.
- **US06-6 Navigation.** The company name on the application detail page links to the company page.

### US07 — Career Service dashboard
_As a Career Service member, I want applications and replies by company and channel, so that I know where students apply and what works._

- **US07-1 Access.** A `career_service` user sees the dashboard. A `student` who opens its URL sees "Access denied". A visitor who is not logged in is sent to the login page. A `career_service` user who opens a student page is sent to the dashboard.
- **US07-2 Content.** The dashboard shows:
  - **Active students** (R9);
  - **Median time to first reply**, in days, across all consenting applications with a first response;
  - **Companies table:** company, number of applications, reply rate (R7) — only companies with ≥ 5 applications (R8), sorted by number of applications, descending;
  - **Channel comparison:** a bar chart of reply rate per channel — only channels with ≥ 5 applications (R8).
- **US07-3 Consent filter.** Applications of non-consenting students are excluded from every number.
- **US07-4 No individual data.** The dashboard never shows names, emails or any per-student row.

### US08 — Withdraw consent, delete data
_As a student, I want to withdraw consent and delete my data, so that I can exercise my GDPR rights._

- **US08-1 Withdraw consent.** Given a consenting student, when she withdraws consent on the privacy page, then her consent becomes `false` (with the date) and her applications are excluded from all statistics immediately (statistics are calculated when requested, never cached).
- **US08-2 Give consent later.** A student who declined can give consent on the same page.
- **US08-3 Delete account.** When she chooses "Delete my account" and confirms, then her account, applications, status history, reminder reactions and product events are deleted, she is logged out, and she sees "Your account and data were deleted".
- **US08-4 After deletion.** Logging in with the deleted account fails. The same email can register again as a new, empty account.

## 8. Screens and routes

| Screen | Route | Stories |
|---|---|---|
| Register / Log in / Verify email | `/register`, `/login`, `/verify-email` | US01 |
| Consent | `/onboarding/consent` | US01 |
| S1 Pipeline | `/pipeline` | US03, US05 |
| S2 New application | `/applications/new` | US02 |
| S3 Application detail | `/applications/[id]` | US04 |
| S4 Company page | `/companies/[id]` | US06 |
| Privacy settings | `/settings/privacy` | US08 |
| S5 Career Service dashboard | `/admin/overview` | US07 |
| Health check | `/api/health` | — |

## 9. Product events

Recorded for the metrics in `docs/product/mvp-scope.md`. Each event stores: name, user, timestamp and the properties below.

| Event | When | Properties |
|---|---|---|
| `application_form_opened` | The new application form is shown | `form_session_id` |
| `application_created` | An application is saved | `application_id`, `form_session_id` |
| `reminder_triggered` | A reminder is shown for the first time in a quiet period | `application_id`, `reason` (`company_median` or `fallback_14_days`), `threshold_days` |
| `reminder_followup_done` | "Follow-up done" is clicked | `application_id` |
| `reminder_dismissed` | "Dismiss" is clicked | `application_id` |

`form_session_id` is generated when the form opens and sent with the form, so M1 can pair "opened" with "created". Consent choice + date and email verification date are stored on the user, not as events.

## 10. Validation and errors

- Company and role: required, 1–120 characters after trimming.
- Sector, channel, job type: required, from the fixed lists.
- Date sent: required, not in the future.
- Validation runs on the server for every request; the form shows the same messages next to each field.
- Errors shown to users are short and actionable; technical details are only logged on the server.
- A resource that does not exist or does not belong to the user → "Not found".

## 11. Non-functional requirements

- **Language:** UI in English. Dates shown as "12 Oct 2026". "Today" uses `Europe/Lisbon`.
- **Layout:** responsive, desktop-first; every screen usable at 375 px width.
- **Accessibility:** every input has a label; everything works with the keyboard; text contrast meets WCAG AA.
- **Privacy:** data stored in the EU (Frankfurt); no third-party analytics; statistics only from consenting students; demo and seed data are fictional and labelled as such.
- **Security:** passwords handled by the auth library (never stored in plain text); secrets only in environment variables.

## 12. Open questions

- `@up.pt` also admits students from other University of Porto faculties. Does the dashboard need a faculty filter? (Not in the MVP.)
- Do verification emails sent through Gmail SMTP reach `@up.pt` inboxes, or land in spam? (To test in the authentication slice.)