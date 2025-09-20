INSERT INTO "{{ silver }}".int_active_daily
SELECT
    json_extract_scalar(json_parse(event_params), '$.user_id') AS user_id,
    min(event_timestamp) AS event_timestamp,
    cast(event_date AS DATE) AS event_date
FROM
    "{{ silver }}".events_clean
WHERE
    event_name = 'session_start'
    AND json_extract_scalar(json_parse(event_params), '$.user_id') IS NOT NULL
    AND event_date = DATE '{{ year }}-{{ month }}-{{ day }}'
GROUP BY
    json_extract_scalar(json_parse(event_params), '$.user_id'),
    cast(event_date AS DATE)
