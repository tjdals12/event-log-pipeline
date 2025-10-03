import { FactRetentionDailyTable } from "./01_fact_retention_daily";
import { FactDauDailyTable } from "./02_fact_dau_daily";

export interface GoldDatabase {
  fact_retention_daily: FactRetentionDailyTable;
  fact_dau_daily: FactDauDailyTable;
}
