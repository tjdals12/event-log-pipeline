INSERT INTO "{{ silver }}".int_signup_daily
SELECT DISTINCT
    json_extract_scalar(json_parse(event_params), '$.user_id') AS user_id,
    cast(event_date AS DATE) AS signup_date
FROM "{{ silver }}".events_clean
WHERE
    event_name = 'signup'
    AND json_extract_scalar(json_parse(event_params), '$.user_id') IS NOT NULL
    AND event_date = DATE '{{ year }}-{{ month }}-{{ day }}';
