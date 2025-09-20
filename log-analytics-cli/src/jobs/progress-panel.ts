import chalk from "chalk";
import cliSpinners from "cli-spinners";
import logUpdate from "log-update";

import { BAR, WIDTH } from "./ui";

type StepStatus = "pending" | "running" | "done" | "failed";

type Step = {
  label: string;
  status: StepStatus;
};

type Options = {
  title: string;
  width?: number;
  pad?: number | { before?: number; after?: number };
};

export class ProgressPanel {
  private steps: Step[];
  private title: string;
  private width: number;
  private beforeLines: number;
  private afterLines: number;

  private frame = 0;
  private spinner = cliSpinners.dots;
  private timer: NodeJS.Timeout | null = null;

  constructor(labels: string[], options: Options) {
    const { title, width = WIDTH, pad = 0 } = options;

    this.steps = labels.map<Step>((label) => ({
      label,
      status: "pending",
    }));
    this.title = title;
    this.width = width;
    this.beforeLines = typeof pad === "number" ? pad : pad?.before ?? 0;
    this.afterLines = typeof pad === "number" ? pad : pad?.after ?? 0;
  }

  start() {
    this.render();
    this.timer = setInterval(() => {
      this.frame = (this.frame + 1) % this.spinner.frames.length;
      this.render();
    }, this.spinner.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = null;
    logUpdate.done();
  }

  private succeed(index: number) {
    const step = this.steps[index];
    if (!step) return;
    step.status = "done";
    this.render();
  }

  private fail(index: number) {
    const step = this.steps[index];
    if (!step) return;
    step.status = "failed";
    this.render();
  }

  async run<T>(index: number, fn: () => Promise<T>) {
    this.startStep(index);
    try {
      const result = await fn();
      this.succeed(index);
      return result;
    } catch (e) {
      this.fail(index);
      throw e;
    }
  }

  private startStep(index: number) {
    const step = this.steps[index];
    if (!step) return;
    step.status = "running";
    this.render();
  }

  private divider(label?: string) {
    if (!label) {
      return chalk.dim(BAR.repeat(this.width));
    }
    const clean = ` ${label.trim()} `;
    const side = Math.max(0, Math.floor((this.width - clean.length) / 2));
    const left = BAR.repeat(side);
    const right = BAR.repeat(this.width - clean.length - side);
    return chalk.dim(left + clean + right);
  }

  private icon(status: StepStatus) {
    switch (status) {
      case "running":
        return chalk.yellow(this.spinner.frames[this.frame]);
      case "done":
        return chalk.green("✔");
      case "failed":
        return chalk.red("✖");
      default:
        return chalk.gray("•");
    }
  }

  private render() {
    const top = "\n".repeat(this.beforeLines) + this.divider(` ${this.title} `);
    const bottom = this.divider() + "\n".repeat(this.afterLines);

    const total = this.steps.length;
    const lines = this.steps.map((step, index) => {
      const { status, label } = step;
      const icon = this.icon(status);
      const n = chalk.dim(`[${index + 1}/${total}]`);
      const text = status === "done" ? chalk.dim(label) : label;
      return `${icon} ${n} ${text}`;
    });

    logUpdate([top, ...lines, bottom].join("\n"));
  }
}

export const createProgress = (labels: string[], options: Options) =>
  new ProgressPanel(labels, options);
