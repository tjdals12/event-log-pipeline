ALTER TABLE `{{ gold }}`.fact_dau_daily DROP IF EXISTS -- noqa: PRS
PARTITION (metric_date = DATE '{{ year }}-{{ month }}-{{ day }}')