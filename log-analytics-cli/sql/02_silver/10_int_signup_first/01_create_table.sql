CREATE EXTERNAL TABLE IF NOT EXISTS `{{ silver }}`.int_signup_first (
    user_id string,
    signup_timestamp timestamp
)
PARTITIONED BY (
    signup_date date
)
STORED AS PARQUET -- noqa: PRS
LOCATION 's3://{{ bucket }}/silver/int_signup_first/'
TBLPROPERTIES (
    'parquet.compression' = 'SNAPPY'
);