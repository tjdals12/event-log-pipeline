CREATE EXTERNAL TABLE IF NOT EXISTS `{{ db }}`.events_raw (
    event_uuid string,
    event_name string,
    event_timestamp string,
    event_params string
)
PARTITIONED BY (
    `year` string,
    `month` string,
    `day` string
)
ROW FORMAT SERDE 'org.openx.data.jsonserde.JsonSerDe'
WITH SERDEPROPERTIES (
    'ignore.malformed.json' = 'true'
)
STORED AS TEXTFILE
LOCATION 's3://{{ bucket }}/bronze/raw/events/'
TBLPROPERTIES (
    'projection.enabled' = 'true',

    'projection.year.type' = 'integer',
    'projection.year.range' = '2023,2030',

    'projection.month.type' = 'enum',
    'projection.month.values' = '01,02,03,04,05,06,07,08,09,10,11,12',

    'projection.day.type' = 'enum',
    'projection.day.values'
    = '01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31',

    'storage.location.template'
    = 's3://{{ bucket }}/bronze/raw/events/year=${year}/month=${month}/day=${day}/'
)
