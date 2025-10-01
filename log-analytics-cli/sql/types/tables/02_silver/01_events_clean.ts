export interface EventsCleanTable {
  event_uuid: string;
  event_name: string;
  event_params: string;
  event_timestamp: Date;
  // Partition Keys
  event_date: Date;
}
