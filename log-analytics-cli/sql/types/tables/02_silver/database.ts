import { EventsCleanTable } from "./01_events_clean";
import { IntSignupFirstTable } from "./10_int_signup_first";

export interface SilverDatabase {
  events_clean: EventsCleanTable;
  int_signup_first: IntSignupFirstTable;
}
