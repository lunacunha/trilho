-- Trilho — product metrics M1–M7 + M4b (Phase 6)
-- Definitions: docs/product/mvp-scope.md §6. Documentation: docs/product/metrics.md.
-- Plain PostgreSQL, SELECT only. Run them all with `npm run metrics` (READ ONLY transaction).
-- Only `student` accounts are counted. Career Service accounts never enter a metric.
-- Rates are percentages with 1 decimal place. Statements end with a semicolon at the end of a line.

-- M1: Median time to log an application
-- Formula: median of (application_created time - matching application_form_opened time), matched by
--          form session, successful saves only, in seconds. Events without a form session id are excluded.
WITH opened AS (
  SELECT e.user_id,
         e.properties->>'form_session_id' AS form_session_id,
         MIN(e.created_at) AS opened_at
  FROM product_event e
  JOIN "user" u ON u.id = e.user_id
  WHERE e.name = 'application_form_opened'
    AND u.role = 'student'
    AND e.properties->>'form_session_id' IS NOT NULL
  GROUP BY e.user_id, e.properties->>'form_session_id'
),
created AS (
  SELECT e.user_id,
         e.properties->>'form_session_id' AS form_session_id,
         MIN(e.created_at) AS created_at
  FROM product_event e
  JOIN "user" u ON u.id = e.user_id
  WHERE e.name = 'application_created'
    AND u.role = 'student'
    AND e.properties->>'form_session_id' IS NOT NULL
  GROUP BY e.user_id, e.properties->>'form_session_id'
)
SELECT COUNT(*) AS saved_sessions,
       ROUND(percentile_cont(0.5) WITHIN GROUP (
         ORDER BY EXTRACT(EPOCH FROM c.created_at - o.opened_at)
       )::numeric, 1) AS median_seconds
FROM opened o
JOIN created c USING (user_id, form_session_id);

-- M2: Application form completion rate
-- Formula: form sessions saved / form sessions opened. A session is saved when an application_created
--          event carries the same form session id. Events without a form session id are excluded.
WITH opened AS (
  SELECT DISTINCT e.user_id, e.properties->>'form_session_id' AS form_session_id
  FROM product_event e
  JOIN "user" u ON u.id = e.user_id
  WHERE e.name = 'application_form_opened'
    AND u.role = 'student'
    AND e.properties->>'form_session_id' IS NOT NULL
),
created AS (
  SELECT DISTINCT e.user_id, e.properties->>'form_session_id' AS form_session_id
  FROM product_event e
  WHERE e.name = 'application_created'
    AND e.properties->>'form_session_id' IS NOT NULL
)
SELECT COUNT(c.form_session_id) AS saved,
       COUNT(*) AS opened,
       ROUND(100.0 * COUNT(c.form_session_id) / NULLIF(COUNT(*), 0), 1) AS rate_pct
FROM opened o
LEFT JOIN created c USING (user_id, form_session_id);

-- M3: Consent rate
-- Formula: students whose current choice is "share" / students who answered the consent screen,
--          overall and per registration week (week starting Monday, Europe/Lisbon).
WITH answered AS (
  SELECT date_trunc('week', u.created_at AT TIME ZONE 'Europe/Lisbon')::date AS week_start,
         u.consent
  FROM "user" u
  WHERE u.role = 'student'
    AND u.consent IS NOT NULL
)
SELECT COALESCE(to_char(week_start, 'YYYY-MM-DD'), 'All') AS registration_week,
       COUNT(*) FILTER (WHERE consent) AS shared,
       COUNT(*) AS answered,
       ROUND(100.0 * COUNT(*) FILTER (WHERE consent) / NULLIF(COUNT(*), 0), 1) AS rate_pct
FROM answered
GROUP BY GROUPING SETS ((), (week_start))
ORDER BY week_start NULLS FIRST;

-- M4: Follow-up rate
-- Formula: reminders marked "Follow-up done" / (reminders marked "Follow-up done" + reminders dismissed).
SELECT COUNT(*) FILTER (WHERE e.name = 'reminder_followup_done') AS followup_done,
       COUNT(*) FILTER (WHERE e.name = 'reminder_dismissed') AS dismissed,
       ROUND(100.0 * COUNT(*) FILTER (WHERE e.name = 'reminder_followup_done')
             / NULLIF(COUNT(*), 0), 1) AS rate_pct
FROM product_event e
JOIN "user" u ON u.id = e.user_id
WHERE e.name IN ('reminder_followup_done', 'reminder_dismissed')
  AND u.role = 'student';

-- M4b: Follow-up rate by reminder reason
-- Formula: M4, split by the reason of the reminder (company_median or fallback_14_days). Each outcome
--          event is matched to the latest reminder_triggered event of the same application at or before it
--          (an outcome can only be set on the reminder of the current quiet period, which is the latest one).
--          The application id is read from the event properties, which survive deleting the application.
WITH outcome AS (
  SELECT e.name, e.user_id, e.properties->>'application_id' AS application_id, e.created_at
  FROM product_event e
  JOIN "user" u ON u.id = e.user_id
  WHERE e.name IN ('reminder_followup_done', 'reminder_dismissed')
    AND u.role = 'student'
)
SELECT COALESCE(t.reason, 'unmatched') AS reason,
       COUNT(*) FILTER (WHERE o.name = 'reminder_followup_done') AS followup_done,
       COUNT(*) FILTER (WHERE o.name = 'reminder_dismissed') AS dismissed,
       ROUND(100.0 * COUNT(*) FILTER (WHERE o.name = 'reminder_followup_done')
             / NULLIF(COUNT(*), 0), 1) AS rate_pct
FROM outcome o
LEFT JOIN LATERAL (
  SELECT tr.properties->>'reason' AS reason
  FROM product_event tr
  WHERE tr.name = 'reminder_triggered'
    AND tr.user_id = o.user_id
    AND tr.properties->>'application_id' = o.application_id
    AND tr.created_at <= o.created_at
  ORDER BY tr.created_at DESC
  LIMIT 1
) t ON true
GROUP BY COALESCE(t.reason, 'unmatched')
ORDER BY reason;

-- M5: Reminder action rate
-- Formula: reminders marked "Follow-up done" / reminders triggered. reminder_triggered is recorded once
--          per reminder (first time it is shown in a quiet period), never per page view.
SELECT COUNT(*) FILTER (WHERE e.name = 'reminder_followup_done') AS followup_done,
       COUNT(*) FILTER (WHERE e.name = 'reminder_triggered') AS triggered,
       ROUND(100.0 * COUNT(*) FILTER (WHERE e.name = 'reminder_followup_done')
             / NULLIF(COUNT(*) FILTER (WHERE e.name = 'reminder_triggered'), 0), 1) AS rate_pct
FROM product_event e
JOIN "user" u ON u.id = e.user_id
WHERE e.name IN ('reminder_followup_done', 'reminder_triggered')
  AND u.role = 'student';

-- M6: Activation rate
-- Formula: students with >= 3 applications created within 7 days of registration
--          / verified students who registered at least 7 days ago.
WITH eligible AS (
  SELECT u.id, u.created_at
  FROM "user" u
  WHERE u.role = 'student'
    AND u.email_verified
    AND u.created_at <= now() - interval '7 days'
),
activated AS (
  SELECT el.id
  FROM eligible el
  JOIN application a ON a.user_id = el.id
                    AND a.created_at < el.created_at + interval '7 days'
  GROUP BY el.id
  HAVING COUNT(*) >= 3
)
SELECT (SELECT COUNT(*) FROM activated) AS activated,
       (SELECT COUNT(*) FROM eligible) AS eligible,
       ROUND(100.0 * (SELECT COUNT(*) FROM activated)
             / NULLIF((SELECT COUNT(*) FROM eligible), 0), 1) AS rate_pct;

-- M7: Week-4 retention
-- Formula: activated students (M6) with >= 1 activity in days 22-28 after registration
--          / activated students who registered at least 28 days ago.
--          Activity = an application created or a manual status change (R9), by when it was made.
--          Days 22-28 = from registration + 21 days (included) up to registration + 28 days (excluded).
WITH cohort AS (
  SELECT u.id, u.created_at
  FROM "user" u
  WHERE u.role = 'student'
    AND u.email_verified
    AND u.created_at <= now() - interval '28 days'
),
activated AS (
  SELECT c.id, c.created_at
  FROM cohort c
  JOIN application a ON a.user_id = c.id
                    AND a.created_at < c.created_at + interval '7 days'
  GROUP BY c.id, c.created_at
  HAVING COUNT(*) >= 3
),
activity AS (
  SELECT a.user_id, a.created_at AS done_at
  FROM application a
  UNION ALL
  SELECT a.user_id, sc.created_at AS done_at
  FROM status_change sc
  JOIN application a ON a.id = sc.application_id
  WHERE NOT sc.is_automatic
),
retained AS (
  SELECT DISTINCT ac.id
  FROM activated ac
  JOIN activity x ON x.user_id = ac.id
                 AND x.done_at >= ac.created_at + interval '21 days'
                 AND x.done_at <  ac.created_at + interval '28 days'
)
SELECT (SELECT COUNT(*) FROM retained) AS retained,
       (SELECT COUNT(*) FROM activated) AS eligible,
       ROUND(100.0 * (SELECT COUNT(*) FROM retained)
             / NULLIF((SELECT COUNT(*) FROM activated), 0), 1) AS rate_pct;
