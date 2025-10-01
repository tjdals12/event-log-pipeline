export interface FactRetentionDaily {
  cohort_date: Date;
  day_n: number;
  cohort_size: string;
  retained_users: string;
  retention_rate: number;
  metric_date: Date;
}
