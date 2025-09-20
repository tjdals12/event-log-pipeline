import {
  AthenaClient,
  GetQueryExecutionCommand,
  StartQueryExecutionCommand,
} from "@aws-sdk/client-athena";
import { sleep } from "../utils/sleep";

const startedAt = Date.now();
const timeoutMs = 30 * 60 * 1000;
const pollIntervalMs = 2000;

export type QueryResult = {
  queryExecutionId: string | undefined;
  dataScannedInBytes: number;
  engineExecutionTimeInMillis: number;
  elapsedMs: number;
  outputLocation: string | undefined;
};

export const runQuery = async (
  athenaClient: AthenaClient,
  sql: string,
  args: { db: string; workgroup: string; bucket: string }
): Promise<QueryResult> => {
  const { db, workgroup, bucket } = args;

  const startQueryResponse = await athenaClient.send(
    new StartQueryExecutionCommand({
      QueryString: sql,
      QueryExecutionContext: { Database: db },
      WorkGroup: workgroup,
      ResultConfiguration: {
        OutputLocation: `s3://${bucket}/athena/results/`,
      },
    })
  );

  const queryExecutionId = startQueryResponse.QueryExecutionId;
  if (!queryExecutionId)
    throw new Error("Athena did not return a QueryExecutionId.");

  while (true) {
    const getQueryResponse = await athenaClient.send(
      new GetQueryExecutionCommand({
        QueryExecutionId: queryExecutionId,
      })
    );

    const queryExecution = getQueryResponse.QueryExecution;
    const queryState = queryExecution?.Status?.State;
    if (!queryExecution || !queryState)
      throw new Error(
        `QueryExecution status unavailable (QueryExecutionId=${queryExecutionId})`
      );

    const finishedAt = Date.now();
    const elapsedMs = finishedAt - startedAt;

    if (queryState === "SUCCEEDED") {
      const stats = queryExecution.Statistics;
      const outputLocation = queryExecution.ResultConfiguration?.OutputLocation;

      return {
        queryExecutionId,
        dataScannedInBytes: stats?.DataScannedInBytes ?? 0,
        engineExecutionTimeInMillis: stats?.EngineExecutionTimeInMillis ?? 0,
        elapsedMs,
        outputLocation,
      };
    }
    if (queryState === "FAILED" || queryState === "CANCELLED") {
      const reason =
        getQueryResponse.QueryExecution?.Status?.StateChangeReason ?? "unknown";
      throw new Error(
        `${queryState}: ${reason} (QueryExecutionId=${queryExecutionId})`
      );
    }
    if (elapsedMs > timeoutMs) {
      throw new Error(
        `TIMEOUT after ${timeoutMs}ms (QueryExecutionId=${queryExecutionId})`
      );
    }

    await sleep(pollIntervalMs);
  }
};
