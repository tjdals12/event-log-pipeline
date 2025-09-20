import { Command } from "commander";

import { t, indent } from "./ui";
import { bronze, silver, gold } from "./commands";

const program = new Command();

program
  .name("analytics")
  .description("Analytics CLI")
  .version("0.1.0")
  .helpCommand(false)
  .helpOption("-h, --help", "자세한 도움말 보기");

program.addCommand(bronze);
program.addCommand(silver);
program.addCommand(gold);

program.configureHelp({
  subcommandTerm: (command) => {
    const aliases = command.aliases?.() ?? [];
    const name = command.name();
    return aliases.length > 0 ? `${name}|${aliases.join("|")}` : name;
  },
  formatHelp: (command, helper) => {
    const description =
      indent(8) +
      "데이터 레이크 파이프라인을 관리하는 CLI입니다. 서비스(하위 명령)를 통해 각 레이어의 작업을 실행합니다.";

    const synopsis = [
      `$ ${t.example("analytics")} <COMMAND> ${t.dim("[options]")}`,
      `$ ${t.example("analytics")} <COMMAND> ${t.dim("--help")}`,
    ]
      .map((l) => indent(8) + l)
      .join("\n");

    const visible = helper.visibleCommands(command);
    const availableCommands =
      visible.length > 0
        ? visible
            .map(
              (subCommand) =>
                indent(8) +
                `${helper.subcommandTerm(subCommand).padEnd(12)}${subCommand
                  .description()
                  .trim()}`
            )
            .join("\n")
        : " (none)";

    return [
      t.h1("DESCRIPTION"),
      description,
      "",
      t.h1("SYNOPSIS"),
      synopsis,
      "",
      t.h1("AVAILABLE COMMANDS"),
      availableCommands,
      "",
    ].join("\n");
  },
});

program.parseAsync(process.argv);
