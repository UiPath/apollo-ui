/**
 * EXAMPLE ADAPTER (stress). Not shipped, and not a real domain: the data
 * that breaks layouts, so the occupant checks prove key facts hold for any
 * data. Long labels and values, long unbroken tokens, many facts, and
 * missing or empty values.
 */
import type { KeyFactsViewModel } from "../key-facts.view-model";

const UNBROKEN =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LONG =
  "A very long value that keeps going well past any width a narrow slot can give it, to test wrapping";

export const STRESS: KeyFactsViewModel = {
  subject: `REF-${UNBROKEN}`,
  facts: Array.from({ length: 16 }, (_, i) => ({
    id: `f${i}`,
    label: i % 2 ? `A fact label that runs long ${i}` : `${UNBROKEN}${i}`,
    // Missing and empty values too.
    ...(i % 4 === 3
      ? {}
      : { value: i % 4 === 2 ? "" : i % 2 ? UNBROKEN : LONG }),
  })),
};
