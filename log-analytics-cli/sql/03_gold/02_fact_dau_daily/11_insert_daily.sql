INSERT INTO "{{ gold }}".fact_dau_daily
SELECT
    count(*) AS dau,
    DATE '{{ year }}-{{ month }}-{{ day }}' AS metric_date
FROM "{{ silver }}".int_active_daily
WHERE event_date = DATE '{{ year }}-{{ month }}-{{ day }}'
