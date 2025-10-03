import { Command } from "commander";
import { ZodError } from "zod";

import { loadConfig } from "@/config/env";

import { parseOptions } from "../options";
import { resolveJob } from "@/registry";
import { indent, t } from "../ui";
import { STAGES, GOLD } from "../constants";
import { CliLogger } from "@/jobs/cli-logger";

const command = new Command("gold");

command
  .description("골드 레이어(지표 전용) 테이블을 생성·적재·관리합니다.")
  .helpOption("-h, --help", "자세한 도움말 보기")
  .showHelpAfterError(
    "예: analytics gold --stage dev --dataset fact_dau_daily --action create-table"
  )
  .requiredOption("--stage <name>", "환경. 예: dev, prod")
  .requiredOption("--dataset <dataset>", "대상. 예: fact_dau_daily")
  .requiredOption("--action <op>", "작업. 예: create-table")
  .option("--year <n>", "연도(예: 2025)")
  .option("--month <n>", "월 (예: 01~12)")
  .option("--day <n>", "일 (예: 01~31)")
  .action(async (options, command: Command) => {
    try {
      const parsed = parseOptions({
        layer: "gold",
        ...options,
      });

      const { stage, ...args } = parsed;

      const config = loadConfig(stage);

      const handler = resolveJob(args);

      const cliLogger = new CliLogger();

      await handler(config, { ...args, emitter: cliLogger });
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
      "골드 레이어(지표 전용) 테이블에 대한 생성·적재·관리 작업을 수행합니다.",
      "필수 옵션으로 환경(--stage), 대상 데이터셋(--dataset), 작업(--action)을 받습니다. 일자 파티션 작업은 --year --month --day 를 지정하세요.",
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
      `${indent(8)}${"--dataset".padEnd(10)}: ${Object.keys(GOLD.DATASETS)}`,
    ]
      .map((l) => t.dim(l))
      .join("\n");

    const datasets = Object.keys(
      GOLD.DATASETS
    ) as (keyof typeof GOLD.DATASETS)[];
    const actionsByDataset = datasets
      .map((dataset) => {
        const { actions } = GOLD.DATASETS[dataset];
        return `${indent(8)}- ${dataset.padEnd(12)}: ${actions.join(", ")}`;
      })
      .join("\n");

    const datasetDetails = datasets
      .map((dataset) => {
        const { description, actions } = GOLD.DATASETS[dataset];
        return [
          `${indent(8)}- ${dataset}`,
          `${indent(10)}${"description".padEnd(12)}: ${description}`,
          `${indent(10)}${"actions".padEnd(12)}: ${actions.join(", ")}`,
        ].join("\n");
      })
      .join("\n");

    const examples = [
      `${t.example("analytics")} gold ${t.dim(
        "--stage dev --dataset fact_dau_daily --action create-table"
      )}`,
      `${t.example("analytics")} gold ${t.dim(
        "--stage prod --dataset fact_dau_daily --action create-table"
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
