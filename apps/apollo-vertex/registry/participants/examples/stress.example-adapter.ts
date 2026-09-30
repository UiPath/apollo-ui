/**
 * EXAMPLE ADAPTER (stress). Not shipped, and not a real domain: the data
 * that breaks layouts, so the occupant checks prove it holds for any data.
 * Long values, long unbroken tokens, many items, and missing or empty
 * optional values. Generated from the view model's fields.
 */
import type { ParticipantsViewModel } from "../participants.view-model";

const UNBROKEN =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LONG =
  "A very long value that keeps going well past any width a narrow slot can give it, to test wrapping";

export const STRESS: ParticipantsViewModel = {
  subject: `REF-${UNBROKEN}`,
  participants: Array.from({ length: 30 }, (_, i) => ({
    id: `s${i}`,
    name: i % 2 ? `${LONG} ${i}` : `${UNBROKEN}${i}`,
    // Missing every third item, empty every third.
    ...(i % 3 === 0
      ? {}
      : {
          role: i % 3 === 1 ? (i % 2 ? `${LONG} ${i}` : `${UNBROKEN}${i}`) : "",
        }),
    // Missing every third item, empty every third.
    ...(i % 3 === 0
      ? {}
      : {
          lastActive:
            i % 3 === 1 ? (i % 3 ? `${UNBROKEN.slice(0, 24)} ${i}` : LONG) : "",
        }),
  })),
};
