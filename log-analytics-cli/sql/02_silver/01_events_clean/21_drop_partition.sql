ALTER TABLE `{{ silver }}`.events_clean DROP IF EXISTS -- noqa: PRS
PARTITION (event_date = DATE '{{ year }}-{{ month }}-{{ day }}')