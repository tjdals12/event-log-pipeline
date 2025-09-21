# log-analytics-cli

Athena에서 테이블·파티션을 생성하고 정제·집계 쿼리(CTAS·INSERT)를 실행하며 스키마 변경을 적용합니다. 레이어(bronze/silver/gold)와 테이블 단위로 쿼리와 작업을 관리합니다.

## How to use

### 요구사항/설치

- AWS CLI 로그인(프로필 OK), Node.js 22+
- `npm install`

### 환경 변수(.env)

```
AWS_REGION=ap-northeast-2
ATHENA_WORKGROUP=<workgroup>
ATHENA_OUTPUT_S3=s3://<bucket>/athena-results/
DB_BRONZE=<project-stage-bronze>
DB_SILVER=<project-stage-silver>
DB_GOLD=<project-stage-gold>
```

### 도움말 명령어

```bash
# 전체 CLI 도움말
$ npm run analytics -- --help

# 레이어별 CLI 도움말
$ npm run analytics bronze -- --help
$ npm run analytics silver -- --help
$ npm run analytics gold -- --help
```

지원하는 데이터셋과 액션을 도움말 명령어를 통해서 확인할 수 있습니다.

```bash
DESCRIPTION
        브론즈 레이어의 원천 데이터셋에 대한 테이블 생성, 적재, 검증 등 작업을 수행합니다.
        필수 옵션으로 환경(--stage), 대상 데이터셋(--dataset), 작업(--action)을 받습니다.

    Options:
        --stage <name>
            환경. 예: dev, prod
        --dataset <dataset>
            대상. 예: events_raw
        --action <op>
            작업. 예: create-table
        -h, --help
            자세한 도움말 보기

    Available Values:
        --stage   : dev,prod
        --dataset : events_raw

    Examples:
        $ analytics bronze --stage dev --dataset events_raw --action create-table
        $ analytics bronze --stage prod --dataset events_raw --action create-table

ACTIONS BY DATASET
        - events_raw  : create-table, drop-table

DATASET DETAILS
        - events_raw
          description : 앱/웹 이벤트의 원천 로그. 스키마 변동이 잦아 테이블 생성/삭제 중심입니다.
          actions     : create-table, drop-table
```

### 사용 예시

```bash
# bronze.events_raw 테이블 생성/드롭
$ npm run analytics bronze -- --stage dev --dataset events_raw --action create-table
$ npm run analytics bronze -- --stage dev --dataset events_raw --action drop-table

# silver.events_clean 테이블 생성, 데일리 파티션 갱신
$ npm run analytics silver -- --stage dev --dataset events_clean --action create-table
$ npm run analytics silver -- --stage dev --dataset events_clean --action overwrite-daily --year 2024 --month 01 --day 01
$ npm run analytics silver -- --stage dev --dataset events_clean --action overwrite-daily --year 2024 --month 01 --day 02
```

### 프로세스/결과 표시

```bash
$ npm run analytics bronze -- --stage dev --dataset events_raw --action create-table

------------------------- START --------------------------
🚀 Create Table · bronze/events_raw
region              : ap-northeast-2
workgroup           : primary
database            : myproject-dev-bronze
bucket              : myproject-dev-data-lake
SQL                 : sql/01_bronze/01_events_raw/01_create_table.sql
----------------------------------------------------------

------------------------ PROGRESS ------------------------
✔ [1/3] Initialize Athena client
✔ [2/3] Render SQL template
✔ [3/3] Run query
----------------------------------------------------------

------------------------- RESULT -------------------------
• QueryExecutionId    : 94c1d510-2b9d-4dbf-88f2-aa6bfb0eab6d
• Data scanned        : 0 B
• Engine time         : 437 ms
• Elapsed             : 2.37 s
• Output location     : s3://myproject-dev-data-lake/athena/results/94c1d510-2b9d-4dbf-88f2-aa6bfb0eab6d.txt
----------------------------------------------------------

-------------------------- END ---------------------------
✅ Create Table · bronze/events_raw
QueryExecutionId    : 94c1d510-2b9d-4dbf-88f2-aa6bfb0eab6d
Elapsed             : 2.26 s
----------------------------------------------------------
```
