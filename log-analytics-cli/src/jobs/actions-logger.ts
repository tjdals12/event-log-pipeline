import EventEmitter from "events";

import { Emitter, Events, Subscriber } from "./event-emitter";
import * as ui from "./ui";
import { QueryResult } from "@/core/athena";

export class ActionsLogger implements Emitter, Subscriber {
  private readonly _emitter: EventEmitter = new EventEmitter();

  constructor() {
    this.on("job:start", this.onJobStart.bind(this));
    this.on("job:report:result", this.onJobResultReport.bind(this));
    this.on("job:report:results", this.onJobResultsReport.bind(this));
    this.on("job:end", this.onJobEnd.bind(this));
    this.on("job:error", this.onJobErrorReport.bind(this));
  }

  emit<E extends keyof Events>(event: E, payload: Events[E]): void {
    this._emitter.emit(event, payload);
  }

  on<E extends keyof Events>(
    event: E,
    handler: (payload: Events[E]) => void
  ): void {
    this._emitter.on(event, handler);
  }

  private onJobStart(ctx: {
    region: string;
    bucket: string;
    workgroup: string;
    db: string;
    job: string;
    sqlPath: string | string[];
  }) {
    ui.startJob(ctx, { pad: { before: 1, after: 1 } });
  }

  private onJobResultReport(args: { result: QueryResult }) {
    const { result } = args;
    ui.reportJobResult(result, { pad: { after: 1 } });
  }

  private onJobResultsReport(args: {
    results: ({ name: string } & QueryResult)[];
  }) {
    const { results } = args;
    ui.reportJobResults(results, { pad: { after: 1 } });
  }

  private onJobEnd(ctx: {
    job: string;
    results: QueryResult[];
    startedAt: number;
    finishedAt: number;
  }) {
    const { job, results, startedAt, finishedAt } = ctx;
    ui.endJob({ job, results, startedAt, finishedAt });
  }

  private onJobErrorReport(ctx: { error: unknown; sql: string }) {
    ui.reportJobError(ctx, { pad: { after: 1 } });
  }
}
