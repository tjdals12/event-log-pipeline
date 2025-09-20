ALTER TABLE `{{ silver }}`.int_signup_daily DROP IF EXISTS -- noqa: PRS
PARTITION (signup_date = DATE '{{ year }}-{{ month }}-{{ day }}');