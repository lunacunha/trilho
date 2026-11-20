-- Trilho — product queries (written by hand, Phase 3)
-- Run against the Neon `dev` branch. Only consenting students are counted.

-- Q1: Which channels do consenting students use most? (Career Service, US07)
SELECT ch.name AS channel,
       COUNT(*) AS applications
FROM application a
JOIN channel ch ON ch.id = a.channel_id
JOIN "user" u   ON u.id  = a.user_id
WHERE u.consent = true
GROUP BY ch.name
ORDER BY applications DESC;

-- Q2: Reply rate per company (R7), only companies with >= 5 applications (R8)
SELECT c.name AS company,
       COUNT(*) AS applications,
       ROUND(100.0 * COUNT(*) FILTER (WHERE EXISTS (
           SELECT 1 FROM status_change sc
           WHERE sc.application_id = a.id
             AND sc.status NOT IN ('sent', 'no_response')  -- R1: not a response
       )) / COUNT(*)) AS reply_rate_pct
FROM application a
JOIN company c ON c.id = a.company_id
JOIN "user" u  ON u.id = a.user_id
WHERE u.consent = true
GROUP BY c.name
HAVING COUNT(*) >= 5
ORDER BY applications DESC;

-- Q3: Median response time per company (R1, R2), only with >= 5 replied applications (R3)
WITH first_response AS (
  SELECT application_id,
         MIN(changed_on) AS responded_on
  FROM status_change
  WHERE status NOT IN ('sent', 'no_response')
  GROUP BY application_id
)
SELECT c.name AS company,
       COUNT(*) AS replied_applications,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY fr.responded_on - a.date_sent) AS median_days
FROM application a
JOIN first_response fr ON fr.application_id = a.id
JOIN company c ON c.id = a.company_id
JOIN "user" u  ON u.id = a.user_id
WHERE u.consent = true
GROUP BY c.name
HAVING COUNT(*) >= 5
ORDER BY median_days;