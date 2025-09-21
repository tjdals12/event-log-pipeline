<p align="center">
  <img src="./diagram.svg" width="720" alt="diagram">
</p>

# log-ingest

Serverless Framework로 클라이언트/서버 이벤트 로그를 받아 **CloudWatch Logs → (구독 필터) → Firehose → S3**로 보냅니다.

## 흐름

- `API Gateway → Lambda(ingest-events) → CloudWatch Logs ─[Filter: $.message.kind=app_event]→ Firehose → S3`

- `Producer(App/Server) → SQS(EventsQueue) → Lambda(ingest-events-consumer) → CloudWatch Logs ─[동일 Filter]→ Firehose → S3`

## 배포

```bash
# dev 배포
sls deploy --stage dev
```

## 환경 변수(.env)

```
FIREHOSE_STREAM_ARN="arn:aws:firehose:ap-northeast-2:XXXXXXXXXXXX:deliverystream/<dev-stream>"
```

## 엔드포인트

- **POST /events** → Lambda: `ingest-events` (Node.js 22, 타임아웃 5s, 로그 7일, JSON 로그)

### 요청 스키마

```json
{
  "event_uuid": "7b098b38-f15f-46bd-9eac-8999053712e4", // crypto.randomUUID()
  "event_name": "session_start", // session_start, signup ...
  "event_timestamp": "2025-09-21T04:37:00.290Z", // new Date().toISOString()
  "event_params": { "user_id": 1234, ... }
}
```

### curl 예시

```bash
$ curl -X POST https://<api_url>/events \
  -H 'Content-Type: application/json' \
  -d '{"event_uuid":"3b1f0b0a-2f53-4d0c-9f5b-8c9b9c7b3d11", "event_name":"app_open", "event_timestamp":"2025-09-21T12:34:56.000Z", "event_params":{"os":"ios","ver":"1.0.0"}}'
```

## 서버 경로(SQS)

- Queue: `EventsQueue` (DLQ: `EventsDLQ`, 가시성 30s, maxReceiveCount 5)
- Consumer Lambda: `ingest-events-consumer` (배치 10, 윈도우 10s)

### 요청 스키마

```json
{
  "event_uuid": "fe57e0e5-5aa2-4c3f-8d72-1d5d0cb61f51",
  "event_name": "purchase",
  "event_timestamp": "2025-09-21T12:40:00.000Z",
  "event_params": { "sku": "pro_monthly", "price": 9900 }
}
```

### AWS CLI 예시

```bash
$ aws sqs send-message \
--queue-url <queue_url> \
--message-body '{"event_uuid": "3b1f0b0a-2f53-4d0c-9f5b-8c9b9c7b3d11", "event_name": "app_open", "event_timestamp": "2025-09-21T12:34:56.000Z"}, "event_params":{"os":"ios","ver":"1.0.0"}}'
```

### 로그 포맷(ingest-events/consumer 공통)

```json
{
  "kind": "app_event",
  "lambdaRequestId": "...",
  "receivedAt": "ISO",
  "...payload fields"
}
```

- **kind:** 로그 종류를 식별하기 위한 값입니다.
- **lambdaRequestId:** 해당 Lambda 호출의 고유 ID로 요청을 추적하기 위해서 사용합니다.
