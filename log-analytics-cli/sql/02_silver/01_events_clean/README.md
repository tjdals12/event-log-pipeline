# 01_events_clean

**Layer:** silver  
**Grain:** event (정제된 이벤트 1건)  
**Partition:** p_dt (KST 'YYYY-MM-DD')  
**Storage:** s3://<bucket>/silver/events_clean/  
**Table:** silver.events_clean

## Purpose

- bronze.events_raw를 정제:
  - `event_timestamp` UTC → `event_ts_utc`/`event_ts_kst` 분리
  - `event_params`에서 `user_id`(string) 추출
  - KST 기준 `p_dt` 파티션 부여
- 다운스트림 지표 집계를 위한 표준화된 이벤트 테이블

## Schema (핵심)

- `event_uuid` (string) — 중복 제거 기준
- `event_name` (string)
- `event_ts_utc` (timestamp), `event_ts_kst` (timestamp)
- `user_id` (string)
- `p_dt` (string, KST 'YYYY-MM-DD', 파티션)

## Upstream / Downstream

- **Upstream:** bronze.events_raw
- **Downstream:** gold.dau, gold.daily_signup

## Parameters

- `p_dt_from`, `p_dt_to` (KST, 최근 3일이 기본)

## Run Order

1. `01_create_table.sql`
2. `10_upsert_select.sql` (검증용 선택)
3. `11_upsert.sql` (대상 파티션 교체)

## Validation

- **무결성:** `event_uuid` 중복 0%, `user_id` NULL 비율 수용 가능 수준(≈0%)
- **일관성:** KST 파생일(`date(event_ts_kst)`)과 `p_dt`가 동일
- **범위:** `p_dt in [p_dt_from, p_dt_to]`만 생성/갱신됨

## Operational Notes

- 정기 실행 시 **최근 3일 윈도우**만 드롭→재생성
- 비용: 파티션 프루닝 필수(`WHERE p_dt BETWEEN …`)

## Definition of Done

- 대상 파티션(p_dt) 재생성 완료
- 품질 체크(중복/NULL/범위) 통과
