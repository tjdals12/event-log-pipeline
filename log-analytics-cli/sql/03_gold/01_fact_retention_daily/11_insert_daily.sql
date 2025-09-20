insert into "{{ gold }}".fact_retention_daily

with active as (
    select user_id
    from "{{ silver }}".int_active_daily
    where event_date = date '{{ metricDate }}'
),

retained as (
    select
        s.signup_date as cohort_date,
        date_diff('day', s.signup_date, date '{{ metricDate }}') as day_n,
        a.user_id
    from "{{ silver }}".int_signup_first as s
    inner join active as a on s.user_id = a.user_id
    where s.signup_date <= date '{{ metricDate }}'
),

retained_agg as (
    select
        cohort_date,
        day_n,
        count(distinct user_id) as retained_users
    from retained
    group by
        cohort_date,
        day_n
),

cohort_size as (
    select
        signup_date as cohort_date,
        count(*) as cohort_size
    from "{{ silver }}".int_signup_first
    where signup_date <= date '{{ metricDate }}'
    group by
        signup_date
)

select
    r.cohort_date,
    r.day_n,
    cs.cohort_size,
    r.retained_users,
    cast(r.retained_users * 1.0 / nullif(cs.cohort_size, 0) as double) as retention_date,
    date '{{ metricDate }}' as metric_date
from retained_agg as r
inner join cohort_size as cs on r.cohort_date = cs.cohort_date;
