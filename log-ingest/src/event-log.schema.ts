import * as v from "valibot";

export const EventLogSchema = v.pipe(
  v.string(),
  v.transform((s) => {
    try {
      return JSON.parse(s);
    } catch {
      throw new Error("Invalid JSON format");
    }
  }),
  v.object({
    event_uuid: v.pipe(v.string(), v.uuid()),
    event_name: v.pipe(v.string(), v.nonEmpty()),
    event_timestamp: v.pipe(v.string(), v.isoTimestamp()),
    event_params: v.optional(v.record(v.string(), v.any())),
  }),
);
