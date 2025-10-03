import { EventsCleanTable } from "./01_events_clean";
import { IntSignupFirstTable } from "./10_int_signup_first";
import { IntSignupDailyTable } from "./11_int_signup_daily";
import { IntActiveDailyTable } from "./20_int_active_daily";
import { IntFirstSessionAfterSignup } from "./21_int_first_session_after_signup";

export interface SilverDatabase {
  events_clean: EventsCleanTable;
  int_signup_first: IntSignupFirstTable;
  int_signup_daily: IntSignupDailyTable;
  int_active_daily: IntActiveDailyTable;
  int_first_session_after_signup: IntFirstSessionAfterSignup;
}
