import chalk from "chalk";

import { formatBytes, formatMs } from "@/core/utils/format";
import { QueryResult } from "@/core/athena";

type Pad = number | { before?: number; after?: number };

export const WIDTH = 58;
export const BAR = "-";

export const divider = (label?: string) => {
  if (!label) {
    console.log(chalk.dim(BAR.repeat(WIDTH)));
    return;
  }
  const clean = ` ${label.trim()} `;
  const side = Math.max(0, Math.floor((WIDTH - clean.length) / 2));
  const left = BAR.repeat(side);
  const right = BAR.repeat(WIDTH - clean.length - side);
  console.log(chalk.dim(left + clean + right));
};

export const newline = (n: number = 1) => {
  if (0 >= n) return;
  process.stdout.write("\n".repeat(n));
};

export const resolvePad = (pad?: Pad) => {
  const beforeLines = typeof pad === "number" ? pad : pad?.before ?? 0;
  const afterLines = typeof pad === "number" ? pad : pad?.after ?? 0;
  return { beforeLines, afterLines };
};

export const startJob = (
  args: {
    job: string;
    region: string;
    workgroup: string;
    db: string;
    bucket: string;
    sqlPath: string | string[];
  },
  options?: { pad: Pad }
) => {
  const { job, region, workgroup, db, bucket, sqlPath } = args;
  const { pad } = options ?? {};
  const { beforeLines, afterLines } = resolvePad(pad);

  newline(beforeLines);

  divider(" START ");
  console.log(
    [
      chalk.bold.white(`🚀 ${job}`),
      `${chalk.dim("region".padEnd(20) + ":")} ${chalk.cyan(region)}`,
      `${chalk.dim("workgroup".padEnd(20) + ":")} ${chalk.cyan(workgroup)}`,
      `${chalk.dim("database".padEnd(20) + ":")} ${chalk.cyan(db)}`,
      `${chalk.dim("bucket".padEnd(20) + ":")} ${chalk.cyan(bucket)}`,
      Array.isArray(sqlPath)
        ? sqlPath
            .map((l, i) => {
              return i === 0
                ? `${chalk.dim("SQL".padEnd(20) + ":")} ${chalk.cyan(l)}`
                : `${chalk.dim(" ".repeat(20) + ":")} ${chalk.cyan(l)}`;
            })
            .join("\n")
        : `${chalk.dim("SQL".padEnd(20) + ":")} ${chalk.cyan(sqlPath)}`,
    ].join("\n")
  );
  divider();

  newline(afterLines);
};

export const reportJobResult = (
  result: QueryResult,
  options?: { pad?: Pad }
) => {
  const {
    queryExecutionId,
    dataScannedInBytes,
    engineExecutionTimeInMillis,
    elapsedMs,
    outputLocation,
  } = result;

  const { pad } = options ?? {};
  const { beforeLines, afterLines } = resolvePad(pad);

  const _queryExecutionId = queryExecutionId ?? "n/a";
  const _dataScannedInBytes = formatBytes(dataScannedInBytes);
  const _engineExecutionTimeInMillis = formatMs(engineExecutionTimeInMillis);
  const _elapsedMs = formatMs(elapsedMs);

  newline(beforeLines);

  divider(" RESULT ");
  console.log(
    [
      `• ${chalk.dim("QueryExecutionId".padEnd(20) + ":")} ${chalk.cyan(
        _queryExecutionId
      )}`,
      `• ${chalk.dim("Data scanned".padEnd(20) + ":")} ${chalk.cyan(
        _dataScannedInBytes
      )}`,
      `• ${chalk.dim("Engine time".padEnd(20) + ":")} ${chalk.cyan(
        _engineExecutionTimeInMillis
      )}`,
      `• ${chalk.dim("Elapsed".padEnd(20) + ":")} ${chalk.cyan(_elapsedMs)}`,
    ].join("\n")
  );
  if (outputLocation) {
    console.log(
      `• ${chalk.dim("Output location".padEnd(20) + ":")} ${chalk.cyan(
        outputLocation
      )}`
    );
  }

  divider();

  newline(afterLines);
};

export const reportJobResults = (
  results: ({ name: string } & QueryResult)[],
  options?: { pad?: Pad }
) => {
  const { pad } = options ?? {};
  const { beforeLines, afterLines } = resolvePad(pad);

  const queries = results.length;
  const { dataScanned, engineTime, elapsedTime, outputLocations } =
    results.reduce(
      (acc, cur) => {
        const {
          dataScannedInBytes,
          engineExecutionTimeInMillis,
          elapsedMs,
          outputLocation,
        } = cur;

        acc.dataScanned += dataScannedInBytes;
        acc.engineTime += engineExecutionTimeInMillis;
        acc.elapsedTime += elapsedMs;
        if (outputLocation) {
          acc.outputLocations.push(outputLocation);
        }

        return acc;
      },
      {
        dataScanned: 0,
        engineTime: 0,
        elapsedTime: 0,
        outputLocations: [] as string[],
      }
    );

  newline(beforeLines);

  divider(" RESULT ");

  console.log(
    [
      `${chalk.dim("• Queries".padEnd(20) + ":")} ${chalk.cyan(queries)}`,
      `${chalk.dim("• Data scanned".padEnd(20) + ":")} ${chalk.cyan(
        formatBytes(dataScanned)
      )}`,
      `${chalk.dim("• Engine time".padEnd(20) + ":")} ${chalk.cyan(
        formatMs(engineTime)
      )}`,
      `${chalk.dim("• Elapsed".padEnd(20) + ":")} ${chalk.cyan(
        formatMs(elapsedTime)
      )}`,
      outputLocations
        .map((l, i) => {
          return (
            (i === 0
              ? `${chalk.dim("• Output location".padEnd(20) + ":")} `
              : `${chalk.dim(" ".repeat(20) + ":")} `) + chalk.cyan(l)
          );
        })
        .join("\n"),
    ].join("\n")
  );

  newline();

  console.log(
    results
      .map((result, index) => {
        const {
          name,
          queryExecutionId = "n/a",
          dataScannedInBytes,
          engineExecutionTimeInMillis,
          elapsedMs,
        } = result;

        return chalk.dim(
          `${chalk.green("✔")} [${index + 1}/${queries}] ${name.padEnd(
            30
          )} | scanned: ${formatBytes(dataScannedInBytes)
            .padStart(10)
            .padEnd(10)} | engine: ${formatMs(engineExecutionTimeInMillis)
            .padStart(10)
            .padEnd(10)} | elapsed: ${formatMs(elapsedMs)
            .padStart(10)
            .padEnd(10)} | id: ${queryExecutionId} `
        );
      })
      .join("\n")
  );

  divider();

  newline(afterLines);
};

export const endJob = (
  args: {
    job: string;
    results: QueryResult[];
    startedAt: number;
    finishedAt: number;
  },
  options?: { pad?: Pad }
) => {
  const { job, results, startedAt, finishedAt } = args;

  const { pad } = options ?? {};
  const { beforeLines, afterLines } = resolvePad(pad);

  const duration = formatMs(finishedAt - startedAt);

  newline(beforeLines);

  divider(" END ");
  console.log(
    [
      chalk.bold.white(`✅ ${job}`),
      results
        .map((l, i) => {
          return (
            (i === 0
              ? `${chalk.dim("QueryExecutionId".padEnd(20) + ":")} `
              : `${chalk.dim(" ".padEnd(20) + ":")} `) +
            chalk.cyan(l.queryExecutionId ?? "n/a")
          );
        })
        .join("\n"),
      `${chalk.dim("Elapsed".padEnd(20) + ":")} ${chalk.cyan(duration)}`,
    ].join("\n")
  );
  divider();

  newline(afterLines);
};

export const reportJobError = (
  args: { error: unknown; sql: string },
  options?: { pad?: Pad }
) => {
  const { error, sql } = args;

  const { pad } = options ?? {};
  const { beforeLines, afterLines } = resolvePad(pad);

  newline(beforeLines);

  divider(" FAILED ");
  const message = error instanceof Error ? error.message : "unknown";
  console.error(chalk.red("✖ Failed"));
  console.error(chalk.red(message));
  if (sql) {
    console.log(chalk.dim("\nSQL (head):"));
    const head = sql.slice(0, 600);
    console.log(
      chalk.gray(head + (sql.length > 600 ? "\n...(truncated)" : ""))
    );
  }
  divider();

  newline(afterLines);
};
