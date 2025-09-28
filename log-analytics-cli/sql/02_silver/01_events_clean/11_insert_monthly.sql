INSERT INTO "{{ silver }}".events_clean
SELECT
    event_uuid,
    event_name,
    event_params,
    cast(at_timezone(from_iso8601_timestamp(event_timestamp), 'utc') AS timestamp) AS event_timestamp,
    date(cast(at_timezone(from_iso8601_timestamp(event_timestamp), 'UTC') AS timestamp)) AS event_date
FROM "{{ bronze }}".events_raw
WHERE
    year = '{{ year }}'
    AND month = '{{ month }}'
