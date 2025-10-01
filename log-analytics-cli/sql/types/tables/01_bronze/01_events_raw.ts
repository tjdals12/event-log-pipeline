export interface EventsRawTable {
  event_uuid: string;
  event_name: string;
  event_timestamp: string;
  event_params: string;
  // Partition Keys
  year: string;
  month: string;
  day: string;
}
