import { z } from "zod";
import moment from "moment-timezone";

export const BaseSchema = z.object({
  stage: z.enum(["dev", "prod"]),
  layer: z.enum(["bronze", "silver", "gold"]),
  dataset: z.string().regex(/^[A-Za-z0-9_]+$/),
  action: z.string(),
});

export const DefaultSchema = z.any().transform(() => {});

const YMDSchema = z.object({
  year: z.coerce.number().min(2000).max(2100),
  month: z.coerce.number().min(1).max(12),
  day: z.coerce.number().min(1).max(31),
});

export const RequiredYMDSchema = YMDSchema.superRefine((args, ctx) => {
  const { year, month, day } = args;

  const _month = `${month}`.padStart(0);
  const _day = `${day}`.padStart(0);

  const isValid = moment.tz(
    `${year}-${_month}-${_day}`,
    "YYYY-MM-DD",
    "Asia/Seoul"
  );

  if (!isValid) {
    ctx.addIssue({
      code: "custom",
      message: "유효하지 않은 날짜입니다.",
      path: ["day"],
    });
  }
}).transform((args) => {
  const { year, month, day } = args;
  const _year = year.toString();
  const _month = `${month}`.padStart(2, "0");
  const _day = `${day}`.padStart(2, "0");
  return { year: _year, month: _month, day: _day };
});

export const RequiredYMSchema = YMDSchema.pick({
  year: true,
  month: true,
}).transform((args) => {
  const { year, month } = args;
  const _year = year.toString();
  const _month = `${month}`.padStart(2, "0");
  return {
    year: _year,
    month: _month,
  };
});
