export interface IntFirstSessionAfterSignup {
  user_id: string;
  signup_timestamp: string;
  signup_date: string;
  first_session_timestamp: string;
  first_session_date: string;
  days_to_first_session: number;
  // Partition Keys
  event_date: string;
}
