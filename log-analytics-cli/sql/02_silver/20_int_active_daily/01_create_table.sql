CREATE EXTERNAL TABLE IF NOT EXISTS `{{ silver }}`.int_active_daily (
    user_id string,
    event_timestamp timestamp
)
PARTITIONED BY (
    event_date date
)
STORED AS PARQUET -- noqa: PRS
LOCATION 's3://{{ bucket }}/silver/int_active_daily/'
TBLPROPERTIES (
    'parquet.compression' = 'SNAPPY'
)