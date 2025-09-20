CREATE EXTERNAL TABLE IF NOT EXISTS `{{ gold }}`.fact_retention_daily (
    cohort_date date,
    day_n integer,
    cohort_size bigint,
    retained_users bigint,
    retention_rate double
)
PARTITIONED BY (
    metric_date date
)
STORED AS PARQUET -- noqa: PRS
LOCATION 's3://{{ bucket }}/gold/fact_retention_daily/'
TBLPROPERTIES (
    'parquet.compression' = 'SNAPPY'
)