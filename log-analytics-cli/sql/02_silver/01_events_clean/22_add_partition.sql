ALTER TABLE `{{ silver }}`.events_clean ADD IF NOT EXISTS -- noqa: PRS
PARTITION (event_date = DATE '{{ year }}-{{ month }}-{{ day }}')
LOCATION 's3://{{ bucket }}/silver/events_clean/event_date={{ year }}-{{ month }}-{{ day }}/v={{ version }}/';
