# Usability test plan — Trilho MVP

Status: **planned, not run yet.** No results are recorded here until the sessions take place.

Related: `docs/ux-review.md` (expert review and cognitive walkthrough), `docs/product/mvp-scope.md` §5 (hypotheses H1–H3).

## 1. Goal

Check with real FEUP students what the expert review could only predict:
- **T1 / H1:** can a student log an application in under 30 seconds, without help?
- **T2 / H3:** do students understand a follow-up reminder, and do they use "Follow-up done" and "Dismiss" the way the metrics assume?
- **T3:** can students find a company's typical response time? Do they understand what they see?
- Which backlog items from `ux-review.md` are real problems: #6, #9, #10, #11, #15 and #18 in particular.

## 2. Participants

- **2–3 FEUP master's students** who are applying for, or have recently applied for, internships or jobs.
- They have not used Trilho before and are not on the project team.
- Mix if possible: at least one student who keeps a spreadsheet of applications and one who does not.
- No payment. Participation is voluntary and can stop at any moment.
- **Consent:** each participant agrees orally to note-taking. If the screen is recorded, they agree to the recording too. Their name is not written in the notes; they are called P1, P2, P3.

## 3. Setup

- **Device:** the facilitator's laptop, Chrome, light theme, signed in to a **test account with fictional seed data** (fictional companies, including Lumen Energy and Northwind Consulting). Never the participant's own account or real email.
- The pipeline has at least one card with a reminder (for T2), and an application to Northwind Consulting whose company has a statistic (for T3).
- The account is reset between participants. T1 adds a card, and T2 hides a reminder.
- **Roles:** one facilitator (reads the script, does not help); one note-taker if available. Otherwise the facilitator takes notes after each task.
- **Timing:** a phone stopwatch for T1. The clock starts when the participant clicks "+ New application" and stops when the new card is visible in the pipeline.
- **Session length:** about 20 minutes.

## 4. Script

### Introduction (read aloud, about 2 minutes)

> Thank you for helping. We are testing Trilho, a tool for tracking job applications, not testing you. There are no wrong answers. If something is confusing, that is exactly what we need to find.
>
> Please **think aloud**: say what you are looking at, what you expect to happen, and what you are trying to do. I will not be able to help or answer questions during the tasks, because I want to see how the app works without me. If you get stuck, say so, and you can give up on a task at any time. That is useful information too.
>
> I will take notes but not write your name. Is that OK?

### During tasks

- Read each task card aloud, then hand it to the participant.
- **Do not help.** Don't point, hint or explain. If asked, answer: *"What would you do if I weren't here?"*
- If the participant is silent, prompt neutrally: *"What are you thinking?"*
- A task ends when the participant says they are done, gives up, or reaches 3 minutes (5 minutes for T3).

### Close (about 3 minutes)

The post-task questions (section 6). Then: *"Thank you — that's all."*

## 5. Tasks and success criteria

### T1 — Log a new application

> **Task card:** You just applied today to **Lumen Energy** for the role **Operations Intern**, through **LinkedIn Easy Apply**. It is a **summer internship** in the **energy** sector. Add it to Trilho.

(The card gives the role, job type and sector so the time measures the interface, not the participant deciding what to type: walkthrough steps 3 and 6.)

| Criterion | Success |
|---|---|
| Completion | A card "Lumen Energy · Operations Intern" appears in "Sent", without help |
| Correct data | Channel = LinkedIn Easy Apply, sector = Energy & Utilities, job type = Summer internship, date = today |
| Existing company reused | The participant picks the suggested "Lumen Energy" (or types the same name), so no duplicate company is created |
| **Time (H1)** | **< 30 s** from clicking "+ New application" to the card being visible |
| Errors | Count validation errors shown and fields corrected |

Observe: does the participant notice the company suggestion? Hesitation on Sector or Channel? Do they look for a confirmation after saving (#15)?

### T2 — Act on a reminder

> **Task card:** Look at your pipeline. Trilho is suggesting something about one of your applications. Decide what you would do and do it in Trilho.

| Criterion | Success |
|---|---|
| Notices the reminder | Finds the card with "N days · Follow up?" without help |
| Understands it | Can explain in their own words what the reminder suggests (contact the company) and why now |
| Correct action | Clicks "Follow-up done" only if they say they *would have* contacted the company; otherwise "Dismiss". Note which one, and why |
| Understands the result | Can say what happened after the click, and whether the reminder will come back |

Observe: is "16 days" next to "16 days · Follow up?" confusing (#9)? Does the participant think "Follow-up done" sends something (#10)? Do they want a confirmation (#11)?

### T3 — Find a company's response time

> **Task card:** You applied to **Northwind Consulting** a while ago. You want to know how long Northwind usually takes to reply to students. Find out in Trilho.

| Criterion | Success |
|---|---|
| Completion | Reaches the Northwind Consulting company page without help |
| Path | Note the path taken: card → application page → "How long does … take to reply?" link or the company name; any dead ends (nav, Privacy) |
| Understands it | Can say the answer in their own words (e.g. "usually 2–3 weeks") and what "based on N student applications" means |
| Time | Recorded; no target |

Observe: where does the participant look first (#6)? Do they understand "Median-based range" (#18)?

## 6. Post-task questions

Ask after all three tasks. Write down the answers word for word where possible.

1. On a scale from 1 (very hard) to 5 (very easy), how easy was it to add an application? Why?
2. **Do you still keep any application in a spreadsheet?** If yes: what does the spreadsheet have that Trilho does not? (H1)
3. Would you log *every* application you send in Trilho? What would make you stop? (H1)
4. When you saw "Follow up?", what did you think Trilho wanted you to do? What does "Follow-up done" mean to you? (H3)
5. Would a reminder like that make you email a company you had not heard from? (H3)
6. How useful is it to see how long a company usually takes to reply? Would you trust it? (US06, H2)
7. Trilho asks whether you want to share your applications anonymously to build these statistics. Would you agree? Why or why not? (H2)
8. Was anything confusing or hard to read?

## 7. Notes grid (one per participant)

Copy this grid for P1, P2 and P3. Write observations, not interpretations: what the participant did and said.

**Participant:** P_ · **Date:** ____ · **Spreadsheet user?** yes / no · **Facilitator / note-taker:** ____

| Task | Completed? (yes / with difficulty / no) | Time | Errors / dead ends | Quotes (think-aloud) | Observations | Related finding |
|---|---|---|---|---|---|---|
| T1 — Log application | | ___ s (target < 30 s) | | | | |
| T2 — Reminder | | ___ s | Button chosen: Follow-up done / Dismiss · Reason: | | | |
| T3 — Response time | | ___ s | Path: | | | |

| Question | Answer |
|---|---|
| Q1 Ease (1–5) | |
| Q2 Spreadsheet? | |
| Q3 Log every application? | |
| Q4 Meaning of "Follow up?" / "Follow-up done" | |
| Q5 Would follow up? | |
| Q6 Response time useful / trusted? | |
| Q7 Would share anonymously? | |
| Q8 Confusing / hard to read | |

**New problems seen** (page · issue · severity 0–4):

## 8. How the results map to H1–H3

The test has 2–3 participants. It finds usability problems and explains the *why* behind the metrics; it does not validate the hypotheses statistically. That is the job of the pilot metrics M1–M5.

| Hypothesis | Evidence from this test | Points to a problem if… | Action if so |
|---|---|---|---|
| **H1 — Fast logging keeps the habit** (M1 < 30 s, M2 ≥ 80%) | T1 time and completion; Q1–Q3 (spreadsheet question) | T1 takes > 30 s for most participants, or they fail or need corrections, or they say they would keep a spreadsheet | Simplify the form as in mvp-scope H1 (remember the last channel and sector, fewer required fields); review #15/#16 |
| **H2 — Students consent to share** (M3 ≥ 60%) | Q6–Q7 | Participants would not share, or do not trust the statistics | Rewrite the consent screen to explain the benefit (mvp-scope H2) |
| **H3 — Company-based reminders lead to follow-up** (M4 ≥ 60%, M5 ≥ 40%) | T2 success criteria; Q4–Q5 | Participants misread the reminder or "Follow-up done", or would not follow up | Move backlog #9–#11 into the next round (clearer reminder text, confirmation). M4 is only meaningful if "Follow-up done" is understood |
| **US06 / differentiator** (supports H2 and H3) | T3 path and understanding | Participants cannot find the response time or misread it | Promote backlog #6 (company lookup) and #18 (plain wording) |

After the sessions, add a short "Results" section to `docs/ux-review.md`: the completion and time table per task, quotes, and new or re-rated findings.
