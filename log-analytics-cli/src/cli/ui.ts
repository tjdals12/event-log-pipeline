import chalk from "chalk";

export const t = {
  h1: chalk.bold,
  dim: chalk.dim,
  example: chalk.green,
};

export const indent = (n: number) => " ".repeat(n);
