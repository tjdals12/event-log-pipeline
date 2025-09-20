import * as fs from "fs";

export const renderSql = (
  filePath: string,
  vars: Record<string, string>
): string => {
  let query = fs.readFileSync(filePath, "utf-8");
  for (const [key, value] of Object.entries(vars)) {
    query = query.replaceAll(`{{ ${key} }}`, value);
  }
  return query;
};
