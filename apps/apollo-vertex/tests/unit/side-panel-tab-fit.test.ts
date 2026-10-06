import { describe, expect, it } from "vitest";
import {
  fitCount,
  type Measured,
  NOTHING_MEASURED,
  sameMeasured,
} from "@/registry/side-panel/side-panel-tab-fit";

// How many of a panel's tabs fit its tab bar, gaps between tabs included.

const ids = ["a", "b", "c"];
const measured = (gap: number, room: number, more = 20): Measured => ({
  widths: { a: 50, b: 50, c: 50 },
  gap,
  room,
  more,
});

describe("fitting tabs", () => {
  it("fits them all when they and the gaps between them fit", () => {
    // 3 × 50 + 2 × 8 = 166.
    expect(fitCount(ids, measured(8, 166))).toBe(3);
    expect(fitCount(ids, measured(0, 150))).toBe(3);
  });

  it("counts the gaps between tabs, not just the tabs", () => {
    // The tabs alone are 150, but with their gaps they need 166: they
    // don't all fit, so More takes the rest. With the gap treated as fixed
    // room, this was 3, and the room changed with how many showed.
    expect(fitCount(ids, measured(8, 160))).toBe(2);
  });

  it("fits as many as go beside More, gaps included", () => {
    // More (20) + 50 + 8 + 50 = 128 fits 140; a third would need 186.
    expect(fitCount(ids, measured(8, 140))).toBe(2);
    // More (20) + 50 = 70 fits 100; a second needs 128.
    expect(fitCount(ids, measured(8, 100))).toBe(1);
  });

  it("always shows one, and all before they're measured", () => {
    expect(fitCount(ids, measured(8, 10))).toBe(1);
    expect(fitCount(ids, NOTHING_MEASURED)).toBe(3);
    expect(fitCount(ids, { ...measured(8, 166), widths: { a: 50 } })).toBe(3);
  });

  it("gives the same answer however many were showing when measured", () => {
    // What it's given doesn't depend on how many show, so measuring again
    // after the count changes changes nothing.
    const once = measured(8, 160);
    expect(fitCount(ids, once)).toBe(fitCount(ids, { ...once }));
    expect(sameMeasured(once, { ...once, widths: { ...once.widths } })).toBe(
      true,
    );
    expect(sameMeasured(once, { ...once, gap: 4 })).toBe(false);
  });
});
