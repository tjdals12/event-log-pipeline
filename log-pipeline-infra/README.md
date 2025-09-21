<p align="center">
  <img src="./diagram.svg" width="720" alt="diagram">
</p>

# log-pipeline-infra

AWS CDK로 데이터 레이크 인프라를 배포합니다. 핵심: **S3(Data Lake)**, **Kinesis Data Firehose**, **Glue Data Catalog(Athena 메타데이터)**.

> 수집 → Firehose(Decompression + Lambda 변환) → **S3 `bronze`** → 가공 → **S3 `silver/gold`** → Athena 조회

## 아키텍처 요약

- **S3 버킷**: `${project}-${stage}-data-lake`
  - 레이어: `bronze/`, `silver/`, `gold/`

- **Firehose → S3**: `${project}-${stage}-event-log-stream`
  - Prefix: `bronze/raw/events/year=!{yyyy}/month=!{MM}/day=!{dd}/`
  - Error Prefix: `errors/raw/events/.../year=!{yyyy}/month=!{MM}/day=!{dd}/`
  - Processor: **GZIP Decompression** → **CloudWatch DataMessageExtraction** → **Lambda 변환(`transform-log@live`)**

- **Glue Databases**:
  - `${project}-${stage}-bronze` → `s3://…/bronze`
  - `${project}-${stage}-silver` → `s3://…/silver`
  - `${project}-${stage}-gold` → `s3://…/gold`

## 빠른 시작

```bash
# Node.js 22+, AWS CLI 로그인 (aws configure), AWS CDK v2

# 1) 의존성
npm install

# 2) CDK 부트스트랩 (계정/리전 당 1회)
cdk bootstrap

# 3) 배포
cdk deploy --all -c stage=dev --require-approval never

# 4) 삭제
cdk destroy --all --force -c stage=dev
```

## 컨텍스트

```json
{
  "context": {
    "project": "log-pipeline"
  }
}
```

## 리소스 상세

### S3: `${project}-${stage}-data-lake`

데이터 레이크용 버킷이며 `bronze/`, `silver/`, `gold/` 레이어로 나누어서 데이터를 관리합니다.

- 기본 설정
  - **암호화:** SSE-S3
  - **퍼블릭 액세스:** 차단
  - **버전 관리:** 활성화
  - **전송 보안:** HTTPS(SSL) 강제
  - **삭제 정책:** AutoDeleteObjects + `RemovalPolicy.DESTROY` (개발 환경 정리 목적)

- 수명 주기
  - **bronze/**
    - 30일 → Intelligent-Tiering
    - 180일 → Glacier
    - 365일 → Deep Archive
    - 과거 버전: 30일 후 Glacier 전환, 90일 후 영구 삭제

  - **silver/**
    - 과거 버전: 60일 후 영구 삭제

- 경로
  - 정상 적재: `bronze/raw/events/year=YYYY/month=MM/day=DD/`
  - 오류 적재: `errors/raw/events/<type>/year=YYYY/month=MM/day=DD/`

> 과거 버전은 정책에 따라 일정 기간 후 영구 삭제하며, bronze는 원시 데이터가 대량으로 적재되므로 기간별로 스토리지 클래스를 전환해 비용을 최적화합니다.

---

### Firehose

Delivery Stream이 S3로 이벤트 로그를 전달합니다. 입력은 CloudWatch Logs에 기록한 로그를 구독 필터로 Firehose에 전달한 것으로, GZIP 형식입니다. Firehose는 압축을 해제한 뒤 CloudWatch 로그 형식에서 이벤트 로그를 추출하고, Lambda 변환을 거쳐 S3에 저장합니다.

- 버퍼링/압축
  - **버퍼:** 60초 또는 1MiB 도달 시 플러시
  - **저장 압축:** UNCOMPRESSED (입력은 GZIP → **Decompression**에서 자동 해제)

- 프로세서 체인
  1. **Decompression**(GZIP) - 구독 필터에서 전달된 GZIP 페이로드를 해제합니다.
  2. **CloudWatchLogProcessing**(DataMessageExtraction=true) - CloudWatch Logs 형식의 래퍼에서 실제 이벤트 레코드를 추출합니다.
  3. **Lambda** 변환기(`${project}-${stage}-transform-log@live`) - Base64 디코드 후 각 줄의 JSON에서 message만 추출해 NDJSON으로 반환합니다.

- 권한
  - **transformFn.grantInvoke(streamRole):** Firehose Processor로 Lambda를 호출해야 하므로 Invoke 권한을 부여합니다.
  - **dataLakeBucket.grantWrite(streamRole):** Firehose가 최종 결과와 에러 레코드를 S3에 저장하기 위해 대상 버킷에 대한 쓰기 권한을 부여합니다.
  - **streamLogGroup.grantWrite(streamRole):** Firehose 자체의 전달/에러 로그를 CloudWatch Logs에 기록하기 위해 로그 그룹에 대한 쓰기 권한을 부여합니다.

---

### Lambda(Transform)

CloudWatch Logs가 전달한 입력을 Base64 디코드한 뒤 줄 단위로 파싱하고, 각 JSON의 message만 추출해 NDJSON으로 반환합니다.

- 구성
  - 런타임: **Node.js 22.x**
  - 로깅: JSON 형식

---

### Glue Databases

Athena 메타데이터 카탈로그를 레이어별로 분리합니다.

- 데이터베이스
  - `${project}-${stage}-bronze` → `s3://<data-lake-bucket>/bronze`
  - `${project}-${stage}-silver` → `s3://<data-lake-bucket>/silver`
  - `${project}-${stage}-gold` → `s3://<data-lake-bucket>/gold`

## 폴더 구조

```
.
├─ bin/log-pipeline-infra.ts
├─ lib/
│  ├─ data-lake.stack.ts      # S3 + Glue
│  └─ log-pipeline.stack.ts   # Firehose + Lambda + Logs
└─ └─ lambda/transform-log.ts
```
