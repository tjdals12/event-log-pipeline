CREATE EXTERNAL TABLE IF NOT EXISTS `{{ gold }}`.fact_dau_daily (
    dau bigint
)
PARTITIONED BY (
    metric_date date
)
STORED AS PARQUET -- noqa: PRS
LOCATION 's3://{{ bucket }}/gold/fact_dau_daily'
TBLPROPERTIES (
    'parquet.compression' = 'SNAPPY'
)