export interface FactDauDailyTable {
  dau: bigint;
  // Partition Keys
  metric_date: string;
}
