import { EventsCleanTable } from "./01_events_clean";
import { IntSignupFirstTable } from "./10_int_signup_first";
import { IntSignupDailyTable } from "./11_int_signup_daily";

export interface SilverDatabase {
  events_clean: EventsCleanTable;
  int_signup_first: IntSignupFirstTable;
  int_signup_daily: IntSignupDailyTable;
}
