export interface IntActiveDailyTable {
  user_id: string;
  event_timestamp: string;
  // Partition Keys
  event_date: string;
}
