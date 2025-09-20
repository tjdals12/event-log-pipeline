import {
  SQSEvent,
  Context,
  SQSBatchResponse,
  SQSBatchItemFailure,
} from "aws-lambda";
import * as v from "valibot";

import { EventLogSchema } from "./event-log.schema";

export const handler = async (
  event: SQSEvent,
  context: Context,
): Promise<SQSBatchResponse> => {
  const failures: SQSBatchItemFailure[] = [];

  const { Records: records } = event;

  const commonPayload = {
    lambdaRequestId: context.awsRequestId,
    receivedAt: new Date().toISOString(),
  };

  for (const record of records) {
    const { messageId, body } = record;

    try {
      const payload = v.parse(EventLogSchema, body);
      const eventDate = payload.event_timestamp.slice(0, 10);

      console.log({
        kind: "app_event",
        event_date: eventDate,
        ...commonPayload,
        ...payload,
      });
    } catch (e) {
      const stack = e instanceof Error ? e.stack : "unknown";

      console.error({
        kind: "app_event_error",
        stack,
        ...commonPayload,
      });

      failures.push({ itemIdentifier: messageId });
    }
  }

  return {
    batchItemFailures: failures,
  };
};
