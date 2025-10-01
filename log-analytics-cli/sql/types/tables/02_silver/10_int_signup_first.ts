export interface IntSignupFirstTable {
  user_id: string;
  signup_timestamp: Date;
  // Partition Keys
  signup_date: Date;
}
