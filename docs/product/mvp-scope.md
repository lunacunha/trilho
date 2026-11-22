# Trilho — MVP scope

_Assignment 2 · Information Systems Architecture · MESG, FEUP_
_Source: Assignment 1 product specification (US01–US15)._

## 1. MVP goal

Prove that FEUP master's students will log their applications in Trilho, consent to share them anonymously and act on company-based follow-up reminders. In addition, prove that this data can give the Career Service a live view of the job search, instead of survey data months after graduation.

The MVP keeps the 8 Must stories (US01–US08), adjusted for the MVP context. Everything else is cut on purpose (section 3).

## 2. In scope

| ID | Story | Acceptance criteria (MVP) | Change from Assignment 1 |
|---|---|---|---|
| US01 | As a student, I want to register with my university email and choose whether to share my data anonymously, so that I control my privacy. | • Only emails ending in `@up.pt` or `@fe.up.pt` can register; any other email is rejected with an error message.<br>• An account cannot log in until its email is verified.<br>• On first login, the consent screen is shown before any other page, with no option pre-selected.<br>• Without consent, the student can use the full pipeline, but their applications never enter any statistic. | FEUP SSO replaced by email + password with email verification (D1). |
| US02 | As a student, I want to log an application in under 30 seconds, so that I don't waste time organising. | • Required fields: company, role, sector, channel, job type, date sent (defaults to today).<br>• Sector, channel and job type come from fixed lists.<br>• The company field suggests existing companies as the student types; a company not in the list is created on save.<br>• Company names are matched ignoring case and leading/trailing spaces, so "Lumen Energy" and "lumen energy " are the same company.<br>• If a required field is missing, an error is shown and nothing is saved.<br>• On save, the application appears in the pipeline with status "Sent". | Company autocomplete + name normalisation (D4). The 30-second target is a usability target, measured in the pilot (H1), not an automated test. |
| US03 | As a student, I want to see all my applications grouped by status, so that I know where each one stands. | • Applications are grouped in columns: Sent, In process, Interview, Offer, Closed (Rejected + No response), with a count per column.<br>• Each card shows company, role and days since sent.<br>• A student only ever sees their own applications. | Added explicit ownership rule. |
| US04 | As a student, I want to update, edit or delete an application, so that my pipeline stays current. | • The student can edit any field, or delete the application after confirming.<br>• Every status change is stored with its date; the full history is visible on the application detail page.<br>• An application in "Sent" or "In process" with no update for 60 days automatically becomes "No response", and this change is recorded in the history with its date.<br>• The 60-day rule does not apply to "Interview" or "Offer". | 60-day rule limited to Sent and In process (D3). |
| US05 | As a student, I want to be reminded when an application goes quiet, so that I know when to follow up. | • Reminders only apply to applications in "Sent" or "In process".<br>• If the company has a response-time statistic, a reminder appears on the pipeline card when the application passes the company's typical response time.<br>• If the company has no statistic, the reminder appears after 14 days without an update.<br>• The student can mark the reminder "Follow-up done" or "Dismiss"; either action hides it for that application. | Reminder shown on the pipeline card only - no email or push notification (D5). |
| US06 | As a student, I want to see a company's typical response time, so that I know whether to wait or move on. | • With ≥ 5 replied applications from consenting students, the company page shows a median-based range in weeks and the base ("based on N applications").<br>• With < 5 replied applications, it shows "Not enough data yet" and no statistic.<br>• It never shows reply or rejection rates, or rankings. | Threshold clarified: 5 *replied* applications, not 5 applications (D2). |
| US07 | As a Career Service member, I want applications and replies by company and channel, so that I know where students apply and what works. | • Only accounts with the `career_service` role can open the dashboard; student accounts get "access denied".<br>• The dashboard shows: active students, median time to first reply, reply rate per company, and reply rate per channel (channel comparison).<br>• Only consenting students are counted; no individual student is identifiable.<br>• Career Service accounts are created by the system (seed); there is no public Career Service sign-up. | Roles `student` / `career_service`; minimal dashboard without filters or CSV export (D6). |
| US08 | As a student, I want to withdraw consent and delete my data, so that I can exercise my GDPR rights. | • Withdrawing consent removes the student's data from all statistics from that moment.<br>• Deleting the account (after confirmation) deletes all of the student's applications and their status history.<br>• A deleted account can no longer log in. | Unchanged. |

## 3. Out of scope

| ID | Story | Why it is cut from the MVP |
|---|---|---|
| US09 | Reply rates by sector and channel (for students) | With pilot-sized data, sector and channel rates would rest on very few applications and could give students wrong advice. The risk is data quality, not effort. |
| US10 | Typical hiring stages per company | Requires students to log every hiring stage, adding work to each application and putting the 30-second logging target (H1) at risk. |
| US11 | Time to placement by course | Can only be measured once students are placed, which happens months later, near the end of the degree. No data would exist during the pilot. |
| US12 | Dashboard filters and CSV export | The minimal dashboard already answers the Career Service's core questions; export only becomes useful once there is a regular reporting cycle. |
| US13 | Notes and job link per application | Personal convenience that is not tied to the core value or to any pilot hypothesis; cheap to add later (two optional fields). |
| US14 | Import an existing spreadsheet | The MVP must first prove that students log applications manually. Import is the first candidate for the post-pilot iteration if activation is low: a cut today that becomes a data-driven decision tomorrow. |
| US15 | Career Service manages lists and merges duplicate companies | Adds an admin workflow with significant complexity. In the MVP, fixed lists come from the seed and name normalisation (US02) handles the most common duplicates. |
| US16 | Edit account name | Found during the US01 build. The name is not shown anywhere in the MVP, so a wrong name has no functional impact. |
| — | In-app product metrics page (M1–M7) | Found in Phase 6. Metrics are for the product team, not the Career Service, so a page would need a new access decision. Before the pilot there is no real data to look at; `npm run metrics` and `docs/product/metrics.md` cover the MVP. Candidate for the pilot (Phase 9). |
| — | Won't (v1): company accounts and "replies to all" badge, recruiting calendar, alumni referral programme, email/LinkedIn integration, notifications, AI | Unchanged from Assignment 1: they need formal partnerships, several years of data, or are not needed for the core value. |

## 4. Changes from Assignment 1

- **D1 — Authentication:** FEUP SSO is out of the MVP. Students register with email and password, restricted to `@up.pt` and `@fe.up.pt`, with email verification.
- **D2 — Statistic threshold:** a company statistic requires ≥ 5 *replied* applications (Assignment 1 said "5 applications" on one slide and "5 replied" in US06). Without a reply there is no response time to measure.
- **D3 — 60-day rule:** applies only to "Sent" and "In process". A process at "Interview" or "Offer" that goes quiet is a different situation.
- **D4 — Companies:** typed with autocomplete from existing companies; new companies are created on save; names are normalised (case, leading/trailing spaces). Merging subtler duplicates (e.g. "Lumen" vs "Lumen Energy SA") is US15, cut.
- **D5 — Reminders:** shown on the pipeline card only, no email or push notifications.
- **D6 — Roles:** users have a role, `student` or `career_service`. Registration always creates students; Career Service accounts are created by the seed. The dashboard is minimal: no filters, no export.

## 5. Pilot hypotheses

### H1 — Fast logging keeps the habit
- **Risk:** if logging each application takes effort, students log the first few and then go back to a spreadsheet or stop logging. The pipeline becomes incomplete, and so do the statistics.
- **Hypothesis:** if logging an application takes less than 30 seconds, students log every application they send in Trilho instead of a spreadsheet.
- **Metrics:** M1, M2.
- **Data:** events `application_form_opened` and `application_created` (who, when).
- **Target:** M1 < 30 s; M2 ≥ 80%. *Assumptions:* 30 s is the usability target from Assignment 1; 80% has no benchmark. Both validated in the pilot.
- **Decision:** if M1 > 30 s **or** M2 < 80% → simplify the form (fewer required fields, remember the last channel and sector used).
- **Qualitative check:** "logs every application" cannot be measured directly, because we cannot see applications sent outside Trilho. In pilot conversations, ask: "Do you still keep any application in a spreadsheet?"

### H2 — Students consent to share anonymously
- **Risk:** if few students share their data, no company reaches 5 replied applications and US06 — Trilho's main differentiator — never shows anything.
- **Hypothesis:** FEUP students agree to share their data anonymously, because they also benefit from other students' statistics.
- **Metric:** M3.
- **Data:** the consent choice and when it was made, per student.
- **Target:** ≥ 60%. *Assumption:* no benchmark; validated in the pilot.
- **Decision:** if M3 < 40% → rewrite the consent screen to explain the benefit better, and test again. Pre-ticking consent is not an option: GDPR requires active, explicit consent.

### H3 — Company-based reminders lead to follow-up
- **Risk:** if reminders are ignored, Trilho does little more than a spreadsheet; the data never turns into action and the product's differentiator stops halfway.
- **Hypothesis:** if a reminder appears when an application passes the company's typical response time, the student follows up.
- **Metrics:** M4 (main), M5 (secondary), M4b (extra analysis).
- **Data:** events `reminder_triggered` (with the reason: company statistic or 14-day rule), `reminder_followup_done`, `reminder_dismissed` (who, when, which application). "Ignored" is derived: a triggered reminder with no reaction.
- **Target:** M4 ≥ 60%; M5 ≥ 40%. *Assumptions:* no benchmark; validated in the pilot.
- **Decision:**
  - Many dismissals → reminders come too early → raise the threshold (e.g. use the upper end of the company's typical range).
  - Many ignored reminders → reminders are not visible or not convincing → change the card's emphasis or the message.
  - In both cases, confirm with 2–3 pilot conversations before changing.
- **Extra analysis (M4b):** M4 split by reminder reason — company-based reminders vs 14-day reminders. This tests whether company data beats a fixed deadline: if company-based reminders get a higher follow-up rate, the shared statistics are worth their privacy cost; if not, a simple 14-day rule would do.
- **Limitation:** "Follow-up done" is self-reported; Trilho cannot verify that the email was sent.

## 6. Metrics

All targets are **assumptions** (no benchmark exists yet) and will be validated in the pilot. Week-4 retention can only be measured after the pilot has run for 4 weeks (Phase 9), but its data is recorded from the first user.

| # | Metric | Formula | Data source | Hypothesis | Target (assumption) | Decision if missed |
|---|---|---|---|---|---|---|
| M1 | Median time to log an application | Median of (time of `application_created` − time of the matching `application_form_opened`, matched by form session), successful saves only | Events `application_form_opened`, `application_created` | H1 | < 30 s | Simplify the form |
| M2 | Application form completion rate | Form sessions saved ÷ form sessions opened | Events `application_form_opened`, `application_created` | H1 | ≥ 80% | Simplify the form |
| M3 | Consent rate | Students whose current choice is "share" ÷ students who answered the consent screen; overall and per registration week | Users table (consent choice + date) | H2 | ≥ 60% | Below 40%: rewrite the consent screen |
| M4 | Follow-up rate | Reminders marked "Follow-up done" ÷ (reminders marked "Follow-up done" + reminders dismissed) | Events `reminder_followup_done`, `reminder_dismissed` | H3 | ≥ 60% | Adjust threshold or message (see H3) |
| M4b | Follow-up rate by reminder reason | M4, split into company-based reminders and 14-day reminders | Events `reminder_triggered` (reason), `reminder_followup_done`, `reminder_dismissed` | H3 | Company-based > 14-day | If not higher: company statistics add no value to reminders; consider the simple 14-day rule |
| M5 | Reminder action rate | Reminders marked "Follow-up done" ÷ reminders triggered (each reminder counted once, not per page view) | Events `reminder_triggered`, `reminder_followup_done` | H3 | ≥ 40% | Adjust card emphasis or message |
| M6 | Activation rate | Students with ≥ 3 applications created within 7 days of registration ÷ verified students who registered at least 7 days ago | Users table (registration and verification dates), applications table (creation date) | — | ≥ 50% | Interview non-activated students; if the barrier is logging past applications, prioritise US14 (import) |
| M7 | Week-4 retention | Activated students with ≥ 1 activity in days 22–28 after registration ÷ activated students who registered at least 28 days ago | Applications table (creation date), status history (change dates) | — | ≥ 40% | Investigate whether reminders and company statistics give students a reason to come back |

**Definitions**
- **Who is counted:** only `student` accounts. Career Service accounts are never counted.
- **Form session:** each opening of the new-application form has its own id; M1 and M2 match events by this id. Events without a form session id are excluded.
- **Why 3 applications for activation:** one application may be a test; three show the student is using Trilho for real. *(Assumption.)*
- **Why "verified email" in M6:** a student without a verified email cannot log in, so they never had the chance to activate.
- **Cohort maturity (M6, M7):** a student only enters the denominator once they have had the full window. Someone who registered 2 days ago has not had 7 days to activate, and counting them would make the rate look artificially low.
- **Activity (M7):** creating an application or making a manual status change, the same as "active student" in the dashboard (R9). The automatic "No response" change does not count; field edits have no timestamp and do not count.
- **Days 22–28:** from registration + 21 days up to registration + 28 days.
- **Why "activated" in M7:** separates "did not start" (M6) from "did not continue" (M7).

**Limitations**
- **M3:** the users table keeps only the current consent choice. A student who changed their choice after onboarding is counted with the new choice. In the pilot, changes are expected to be rare; if needed, a `consent_changed` event would keep the full history.
- **M7:** a student who receives an offer and stops using Trilho counts as not retained, although this is the product working. These cases will be reported separately.
- **Deleted accounts (all metrics):** when a student deletes their account (US08), all their data, including product events, is deleted. Metrics only cover existing accounts. This is required by GDPR and accepted.

**Data to record (input for Phase 3)**
- Events: `application_form_opened`, `application_created`, `reminder_triggered` (with reason), `reminder_followup_done`, `reminder_dismissed`.
- Columns: consent choice + date and email verification date (users); creation date (applications); date of every status change (status history).

## 7. Open questions

- `@up.pt` also admits students from other University of Porto faculties. Does the Career Service dashboard need to filter by faculty?
- ~~How is an "active student" defined in the Career Service dashboard?~~ Answered in SPEC.md R9: at least one application created or manual status change in the last 30 days (today and the 29 previous days).
- ~~What exactly is a "first response"?~~ Answered in SPEC.md R1.
- ~~Which point of the company's typical range triggers a reminder?~~ Answered in SPEC.md R4: the company median, rounded up; 14 days without a statistic.
- Will verification emails sent through Gmail SMTP reach `@up.pt` inboxes, or land in spam? (Technical risk, to test in the authentication slice.) : Tested on 21 Nov: delivered to the inbox.