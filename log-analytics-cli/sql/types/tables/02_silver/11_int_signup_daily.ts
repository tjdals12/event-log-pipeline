export interface IntSignupDailyTable {
  user_id: string;
  // Partition Keys
  signup_date: Date;
}
