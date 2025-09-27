INSERT INTO "{{ silver }}".int_signup_first
WITH signup AS (
    SELECT
        json_extract_scalar(json_parse(event_params), '$.user_id') AS user_id,
        event_timestamp,
        event_date
    FROM "{{ silver }}".events_clean
    WHERE
        event_date = DATE '{{ year }}-{{ month }}-{{ day }}'
        AND event_name = 'signup'
        AND json_extract_scalar(json_parse(event_params), '$.user_id') IS NOT NULL
),

firsts AS (
    SELECT
        user_id,
        min(event_timestamp) AS signup_timestamp,
        cast(min(cast(event_date AS DATE)) AS DATE) AS signup_date
    FROM signup
    GROUP BY user_id
)

SELECT
    f.user_id,
    f.signup_timestamp,
    f.signup_date
FROM firsts AS f
LEFT JOIN "{{ silver }}".int_signup_first AS t ON f.user_id = t.user_id
WHERE t.user_id IS NULL
