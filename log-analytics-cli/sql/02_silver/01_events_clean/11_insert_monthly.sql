INSERT INTO "{{ silver }}".events_clean
SELECT
    event_uuid,
    event_name,
    event_params,
    cast(from_iso8601_timestamp(event_timestamp) AS timestamp) AS event_timestamp,
    date(cast(from_iso8601_timestamp(event_timestamp) AS timestamp)) AS event_date
FROM "{{ bronze }}".events_raw
WHERE
    year = '{{ year }}'
    AND month = '{{ month }}'
