CREATE EXTERNAL TABLE IF NOT EXISTS `{{ db }}`.events_clean (
    event_uuid string,
    event_name string,
    event_params string,
    event_timestamp timestamp
)
PARTITIONED BY (
    event_date date
)
STORED AS PARQUET -- noqa: PRS
LOCATION 's3://{{ bucket }}/silver/events_clean/'
TBLPROPERTIES (
    'parquet.compression' = 'SNAPPY'
)
