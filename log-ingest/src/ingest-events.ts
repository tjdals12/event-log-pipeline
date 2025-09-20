import {
  APIGatewayProxyEventV2,
  Context,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import * as v from "valibot";

import { EventLogSchema } from "./event-log.schema";

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyResultV2> => {
  const { body } = event;

  const commonPayload = {
    gwRequestId: event.requestContext.requestId,
    lambdaRequestId: context.awsRequestId,
    receivedAt: new Date().toISOString(),
  };

  try {
    const payload = v.parse(EventLogSchema, body);
    const eventDate = payload.event_timestamp.slice(0, 10);

    console.log({
      kind: "app_event",
      event_date: eventDate,
      ...commonPayload,
      ...payload,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "ok",
      }),
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown";
    const stack = e instanceof Error ? e.stack : "unknown";

    console.error({
      kind: "app_event_error",
      stack,
      ...commonPayload,
    });

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    };
  }
};
