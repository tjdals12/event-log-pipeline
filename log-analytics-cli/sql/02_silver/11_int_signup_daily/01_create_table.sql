CREATE EXTERNAL TABLE IF NOT EXISTS `{{ silver }}`.int_signup_daily (
    user_id string
)
PARTITIONED BY (
    signup_date date
)
STORED AS PARQUET -- noqa: PRS
LOCATION 's3://{{ bucket }}/silver/int_signup_daily/'
TBLPROPERTIES (
    'parquet.compression' = 'SNAPPY'
);
