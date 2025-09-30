import { QueryResult } from "@/core/athena";

export type Events = {
  "job:start": {
    region: string;
    bucket: string;
    workgroup: string;
    db: string;
    job: string;
    sqlPath: string | string[];
  };
  "step:initialize": { labels: string[] };
  "step:start": { index: number };
  "step:success": { index: number };
  "step:error": { index: number };
  "job:report:result": { result: QueryResult };
  "job:report:results": { results: ({ name: string } & QueryResult)[] };
  "job:end": {
    job: string;
    results: QueryResult[];
    startedAt: number;
    finishedAt: number;
  };
  "job:error": { error: unknown; sql: string };
};

export interface Emitter {
  emit<E extends keyof Events>(event: E, payload: Events[E]): void;
}

export interface Subscriber {
  on<E extends keyof Events>(
    event: E,
    handler: (payload: Events[E]) => void
  ): void;
}
