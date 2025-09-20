ALTER TABLE `{{ gold }}`.fact_retention_daily DROP IF EXISTS -- noqa: PRS
PARTITION (metric_date = DATE '{{ metricDate }}');