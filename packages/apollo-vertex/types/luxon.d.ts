// Luxon's TS branding: when throwOnInvalid is true, DateTime is treated as
// non-nullable (DateTime<true>). Apollo dashboarding ships this ambient
// declaration; we mirror it so chart code can consume Interval.start/.end
// without per-call null checks.
import "luxon";

declare module "luxon" {
  interface TSSettings {
    throwOnInvalid: true;
  }
}
