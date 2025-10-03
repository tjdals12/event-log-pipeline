export interface IntFirstSessionAfterSignup {
  user_id: string;
  first_session_timestamp: string;
  first_session_date: string;
  // Partition Keys
  event_date: string;
}
