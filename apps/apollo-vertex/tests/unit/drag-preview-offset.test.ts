import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  offsetFromPointer,
  PREVIEW_OFFSET_X,
  PREVIEW_OFFSET_Y,
} from "@/app/preview/occupants/drag-preview-offset";

// The drag preview sits down and right of the pointer, so the place under
// it stays in sight.

const rect = (left: number, top: number, width: number, height: number) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});
const base = {
  active: null,
  draggingNodeRect: null,
  containerNodeRect: null,
  overlayNodeRect: null,
  scrollableAncestors: [],
  scrollableAncestorRects: [],
  windowRect: null,
};
const transform = { x: 300, y: 120, scaleX: 1, scaleY: 1 };

describe("offsetFromPointer", () => {
  // dnd-kit asks the window whether an event is a touch; this node test has none.
  beforeAll(() => vi.stubGlobal("window", {}));
  afterAll(() => vi.unstubAllGlobals());

  it("puts the preview's corner down and right of the pointer", () => {
    // Picked up 40px into the row and 12px down.
    const event = Object.assign(new Event("pointerdown"), {
      clientX: 140,
      clientY: 212,
    });
    const moved = offsetFromPointer({
      ...base,
      activatorEvent: event,
      activeNodeRect: rect(100, 200, 240, 48),
      over: null,
      transform,
    });
    expect(moved).toEqual({
      ...transform,
      x: 300 + 40 + PREVIEW_OFFSET_X,
      y: 120 + 12 + PREVIEW_OFFSET_Y,
    });
  });

  it("by keyboard, puts it below a tab bar's place", () => {
    const over = {
      id: "end-panel:insert:1",
      rect: rect(0, 0, 16, 36),
      disabled: false,
      data: { current: {} },
    };
    const moved = offsetFromPointer({
      ...base,
      activatorEvent: new Event("keydown"),
      activeNodeRect: rect(100, 200, 240, 48),
      over,
      transform,
    });
    expect(moved.x).toBe(300 + PREVIEW_OFFSET_X);
    expect(moved.y).toBeGreaterThanOrEqual(120 + 36);
  });
});
