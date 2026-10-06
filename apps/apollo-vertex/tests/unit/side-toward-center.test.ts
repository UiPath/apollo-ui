import { describe, expect, it } from "vitest";
import { sideTowardCenter } from "@/app/preview/occupants/use-slot-boxes";

// Where a slot's popover opens from the stage: beside the slot, toward
// the page's center, never over it.

const page = { x: 0, y: 0, width: 1400, height: 900 };

describe("sideTowardCenter", () => {
  it("opens a panel's popover toward the middle of the page", () => {
    expect(
      sideTowardCenter({ x: 1040, y: 100, width: 360, height: 800 }, page),
    ).toBe("left");
    expect(
      sideTowardCenter({ x: 0, y: 100, width: 320, height: 800 }, page),
    ).toBe("right");
  });

  it("opens a wide slot's popover below it, or above in the lower half", () => {
    expect(
      sideTowardCenter({ x: 0, y: 0, width: 1400, height: 100 }, page),
    ).toBe("bottom");
    expect(
      sideTowardCenter({ x: 0, y: 780, width: 1400, height: 120 }, page),
    ).toBe("top");
  });
});
