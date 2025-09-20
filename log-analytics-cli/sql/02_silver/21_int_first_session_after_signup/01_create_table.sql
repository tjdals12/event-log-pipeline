CREATE EXTERNAL TABLE IF NOT EXISTS `{{ silver }}`.int_first_session_after_signup (
    user_id string,
    first_session_timestamp timestamp,
    first_session_date date
)
PARTITIONED BY (
    event_date date
)
STORED AS PARQUET -- noqa: PRS
LOCATION 's3://{{ bucket }}/silver/int_first_session_after_signup'
TBLPROPERTIES (
    'parquet.compression' = 'SNAPPY'
)