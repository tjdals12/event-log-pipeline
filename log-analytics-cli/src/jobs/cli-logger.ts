import EventEmitter from "events";
import chalk from "chalk";
import cliSpinners from "cli-spinners";
import logUpdate from "log-update";

import { QueryResult } from "@/core/athena";

import { Emitter, Events, Subscriber } from "./event-emitter";
import * as ui from "./ui";
import { BAR, WIDTH } from "./ui";

type StepStatus = "pending" | "running" | "done" | "failed";

type Step = {
  label: string;
  status: StepStatus;
};

export class CliLogger implements Emitter, Subscriber {
  private readonly _emitter: EventEmitter = new EventEmitter();

  private _steps: Step[] = [];
  private _timer: NodeJS.Timeout | null = null;

  private _frame = 0;
  private readonly _spinner = cliSpinners.dots;

  constructor() {
    this.on("job:start", this.onJobStart.bind(this));
    this.on("step:initialize", this.onStepInitialize.bind(this));
    this.on("step:start", this.onStepStart.bind(this));
    this.on("step:success", this.onStepSuccess.bind(this));
    this.on("step:error", this.onStepError.bind(this));
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
    ui.startJob(ctx, { pad: { after: 1 } });
  }

  private onStepInitialize(args: { labels: string[] }) {
    const { labels } = args;
    this._steps = labels.map<Step>((label) => ({
      label,
      status: "pending",
    }));
    this._render({
      title: "PROGRESS",
      afterLines: 1,
    });
    this._timer = setInterval(() => {
      this._frame = (this._frame + 1) % this._spinner.frames.length;
      this._render({ title: "PROGRESS", afterLines: 1 });
    }, this._spinner.interval);
  }

  private onStepStart(args: { index: number }) {
    const { index } = args;
    const step = this._steps[index];
    if (!step) return;
    step.status = "running";
    this._render({ title: "PROGRESS", afterLines: 1 });
  }

  private onStepSuccess(args: { index: number }) {
    const { index } = args;
    const step = this._steps[index];
    if (!step) return;
    step.status = "done";
    this._render({ title: "PROGRESS", afterLines: 1 });
  }

  private onStepError(args: { index: number }) {
    const { index } = args;
    const step = this._steps[index];
    if (!step) return;
    step.status = "failed";
    this._render({ title: "PROGRESS", afterLines: 1 });
  }

  private onJobResultReport(args: { result: QueryResult }) {
    const { result } = args;
    logUpdate.done();
    ui.reportJobResult(result, { pad: { after: 1 } });
  }

  private onJobResultsReport(args: {
    results: ({ name: string } & QueryResult)[];
  }) {
    const { results } = args;
    logUpdate.done();
    ui.reportJobResults(results, { pad: { after: 1 } });
  }

  private onJobEnd(ctx: {
    job: string;
    results: QueryResult[];
    startedAt: number;
    finishedAt: number;
  }) {
    const { job, results, startedAt, finishedAt } = ctx;
    if (this._timer) {
      clearInterval(this._timer);
    }
    this._timer = null;
    ui.endJob({ job, results, startedAt, finishedAt });
  }

  private onJobErrorReport(ctx: { error: unknown; sql: string }) {
    logUpdate.done();
    ui.reportJobError(ctx, { pad: { after: 1 } });
  }

  private divider(label?: string) {
    if (!label) {
      return chalk.dim(BAR.repeat(WIDTH));
    }
    const clean = ` ${label.trim()} `;
    const side = Math.max(0, Math.floor((WIDTH - clean.length) / 2));
    const left = BAR.repeat(side);
    const right = BAR.repeat(WIDTH - clean.length - side);
    return chalk.dim(left + clean + right);
  }

  private icon(status: StepStatus) {
    switch (status) {
      case "running":
        return chalk.yellow(this._spinner.frames[this._frame]);
      case "done":
        return chalk.green("✔");
      case "failed":
        return chalk.red("✖");
      default:
        return chalk.gray("•");
    }
  }

  private _render(args: {
    title: string;
    beforeLines?: number;
    afterLines?: number;
  }) {
    const { title, beforeLines = 0, afterLines = 0 } = args;

    const top = "\n".repeat(beforeLines) + this.divider(` ${title} `);
    const bottom = this.divider() + "\n".repeat(afterLines);

    const total = this._steps.length;
    const lines = this._steps.map((step, index) => {
      const { status, label } = step;
      const icon = this.icon(status);
      const n = chalk.dim(`[${index + 1}/${total}]`);
      const text = status === "done" ? chalk.dim(label) : label;
      return `${icon} ${n} ${text}`;
    });

    logUpdate([top, ...lines, bottom].join("\n"));
  }
}
