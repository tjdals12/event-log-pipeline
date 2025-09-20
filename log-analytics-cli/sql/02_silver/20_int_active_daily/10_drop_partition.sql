ALTER TABLE `{{ silver }}`.int_active_daily DROP IF EXISTS -- noqa: PRS
PARTITION (event_date = DATE '{{ year }}-{{ month }}-{{ day }}');