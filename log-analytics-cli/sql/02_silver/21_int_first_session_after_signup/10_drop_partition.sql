ALTER TABLE `{{ silver }}`.int_first_session_after_signup DROP IF EXISTS -- noqa: PRS
PARTITION (event_date = DATE '{{ year }}-{{ month }}-{{ day }}');