/**
 * EXAMPLE ADAPTER (stress). Not shipped, and not a real domain: the data
 * that breaks layouts, so the occupant checks prove it holds for any data.
 * Long values, long unbroken tokens, many items, and missing or empty
 * optional values. Generated from the view model's fields.
 */
import type { OccupantTone } from "@/components/ui/occupant";
import type { QueueViewModel } from "../queue.view-model";

const UNBROKEN =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const TONES: OccupantTone[] = [
  "neutral",
  "info",
  "success",
  "warning",
  "error",
];
const LONG =
  "A very long value that keeps going well past any width a narrow slot can give it, to test wrapping";

export const STRESS: QueueViewModel = {
  subject: `REF-${UNBROKEN}`,
  // Many filters, with long labels and one no item belongs to.
  filters: Array.from({ length: 8 }, (_, i) => ({
    id: `f${i}`,
    label: i % 2 ? `${LONG.slice(0, 40)} ${i}` : `${UNBROKEN.slice(0, 20)}${i}`,
  })),
  items: Array.from({ length: 30 }, (_, i) => ({
    id: `s${i}`,
    // Long and unbroken group labels.
    group:
      i < 10
        ? `${LONG} ${Math.floor(i / 5)}`
        : `${UNBROKEN}${Math.floor(i / 10)}`,
    filter: `f${i % 7}`,
    title: i % 2 ? `${LONG} ${i}` : `${UNBROKEN}${i}`,
    // Missing every third item, empty every third.
    ...(i % 3 === 0
      ? {}
      : {
          value:
            i % 3 === 1 ? (i % 5 ? `${UNBROKEN.slice(0, 18)}${i}` : LONG) : "",
        }),
    status: {
      label: i % 2 ? `${LONG} ${i}` : `${UNBROKEN}${i}`,
      tone: TONES[i % TONES.length] ?? "neutral",
      ...(i % 4 === 1 ? { more: 12 } : {}),
    },
    // Missing every third item, empty every third.
    ...(i % 3 === 0
      ? {}
      : {
          reference:
            i % 3 === 1
              ? i % 2
                ? `A reference that runs long ${i}`
                : `${UNBROKEN}${i}`
              : "",
        }),
  })),
};
