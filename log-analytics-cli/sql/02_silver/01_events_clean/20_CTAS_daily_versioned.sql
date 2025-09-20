CREATE TABLE "{{ silver }}".events_clean__temp
WITH (
    format = 'PARQUET', -- noqa
    parquet_compression = 'SNAPPY', -- noqa
    external_location = 's3://{{ bucket }}/silver/events_clean/event_date={{ year }}-{{ month }}-{{ day }}/v={{ version }}/' -- noqa
) AS
SELECT
    event_uuid,
    event_name,
    event_params,
    cast(from_iso8601_timestamp(event_timestamp) AS timestamp) AS event_timestamp,
    date(cast(from_iso8601_timestamp(event_timestamp) AS timestamp)) AS event_date
FROM "{{ bronze }}".events_raw
WHERE year = '{{ year }}' AND month = '{{ month }}' AND day = '{{ day }}';
