INSERT INTO "{{ silver }}".int_first_session_after_signup
WITH cohort AS (
    SELECT
        user_id,
        signup_timestamp,
        signup_date
    FROM int_signup_first
),

sessions AS (
    SELECT
        event_timestamp AS session_timestamp,
        event_date AS session_date,
        json_extract_scalar(json_parse(event_params), '$.user_id') AS user_id
    FROM "{{ silver }}".events_clean
    WHERE
        event_name = 'session_start'
        AND json_extract_scalar(json_parse(event_params), '$.user_id') IS NOT NULL
        AND event_date <= DATE '{{ year }}-{{ month }}-{{ day }}'
),

first_after AS (
    SELECT
        c.user_id,
        min(s.session_timestamp) AS first_session_timestamp,
        min_by(s.session_date, s.session_timestamp) AS first_session_date
    FROM cohort AS c
    INNER JOIN sessions AS s
        ON
            c.user_id = s.user_id
            AND c.signup_timestamp <= s.session_timestamp
    GROUP BY c.user_id
)

SELECT
    user_id,
    first_session_timestamp,
    cast(first_session_date AS DATE) AS first_session_date,
    cast(first_session_date AS DATE) AS event_date
FROM first_after
WHERE cast(first_session_date AS DATE) = DATE '{{ year }}-{{ month }}-{{ day }}';
