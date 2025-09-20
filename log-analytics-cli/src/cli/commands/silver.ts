import { Command } from "commander";
import { ZodError } from "zod";

import { loadConfig } from "@/config/env";

import { parseOptions } from "../options";
import { resolveJob } from "../registry";
import { STAGES, SILVER } from "../constants";
import { t, indent } from "../ui";

const command = new Command("silver");

command
  .description("실버 레이어(정제 데이터) 관련 작업을 수행합니다.")
  .helpOption("-h, --help", "자세한 도움말 보기")
  .showHelpAfterError(
    "예: analytics silver --stage dev --dataset events_clean --action create-table"
  )
  .requiredOption("--stage <name>", "환경. 예: dev, prod")
  .requiredOption("--dataset <dataset>", "대상. 예: events_clean")
  .requiredOption("--action <op>", "작업. 예: create-table")
  .option("--year <n>", "연도(예: 2025)")
  .option("--month <n>", "월 (예: 01~12)")
  .option("--day <n>", "일 (예: 01~31)")
  .action(async (options, command: Command) => {
    try {
      const parsed = parseOptions({
        layer: "silver",
        ...options,
      });

      const { stage, ...args } = parsed;

      const config = loadConfig(stage);

      const handler = resolveJob(args);

      await handler(config, args);
    } catch (e) {
      if (e instanceof ZodError) {
        const message = e.issues
          .map((i) => {
            const path = i.path.join(".") || "(root)";
            return `  - ${path}: ${i.message}`;
          })
          .join("\n");

        command.error(["❌ Invalid options:", message].join("\n"));
      } else {
        const message = e instanceof Error ? e.message : String(e);
        command.error(`❌ ${message}`);
      }
    }
  });

command.configureHelp({
  formatHelp: (command, helper) => {
    const description = [
      "브론즈 레이어의 원천 데이터셋에 대한 테이블 생성, 적재, 검증 등 작업을 수행합니다.",
      "필수 옵션으로 환경(--stage), 대상 데이터셋(--dataset), 작업(--action)을 받습니다.",
    ]
      .map((l) => indent(8) + l)
      .join("\n");

    const options =
      helper
        .visibleOptions(command)
        .map((option) =>
          [
            indent(8) + helper.optionTerm(option),
            indent(12) + t.dim(option.description || ""),
          ].join("\n")
        )
        .join("\n") || indent(8) + "(no options)";

    const availableValues = [
      `${indent(8)}${"--stage".padEnd(10)}: ${Object.values(STAGES)}`,
      `${indent(8)}${"--dataset".padEnd(10)}: ${Object.keys(SILVER.DATASETS)}`,
    ]
      .map((l) => t.dim(l))
      .join("\n");

    const datasets = Object.keys(
      SILVER.DATASETS
    ) as (keyof typeof SILVER.DATASETS)[];
    const actionsByDataset = datasets
      .map((dataset) => {
        const { actions } = SILVER.DATASETS[dataset];
        return `${indent(8)}- ${dataset.padEnd(12)}: ${actions.join(", ")}`;
      })
      .join("\n");

    const datasetDetails = datasets
      .map((dataset) => {
        const { description, actions } = SILVER.DATASETS[dataset];
        return [
          `${indent(8)}- ${dataset}`,
          `${indent(10)}${"description".padEnd(12)}: ${description}`,
          `${indent(10)}${"actions".padEnd(12)}: ${actions.join(", ")}`,
        ].join("\n");
      })
      .join("\n");

    const examples = [
      `${t.example("analytics")} silver ${t.dim(
        "--stage dev --dataset events_clean --action create-table"
      )}`,
      `${t.example("analytics")} silver ${t.dim(
        "--stage prod --dataset events_clean --action create-table"
      )}`,
    ]
      .map((l) => indent(8) + "$ " + l)
      .join("\n");

    return [
      t.h1("DESCRIPTION"),
      description,
      "",
      indent(4) + t.h1("Options:"),
      options,
      "",
      indent(4) + t.h1("Available Values:"),
      availableValues,
      "",
      indent(4) + t.h1("Examples:"),
      examples,
      "",
      t.h1("ACTIONS BY DATASET"),
      actionsByDataset,
      "",
      t.h1("DATASET DETAILS"),
      datasetDetails,
      "",
    ].join("\n");
  },
});

export default command;
