import { describe, expect, it } from "vitest";

import {
  endPanelMaxWidth,
  type PanelIntent,
  type PanelSide,
  resolveEndWidth,
  resolvePanels,
  withLatest,
} from "./detail-page-rules";

const intent = (
  wanted: Record<PanelSide, boolean>,
  openOrder: PanelSide[],
  lastOpened: PanelSide | null = null,
): PanelIntent => ({ wanted, openOrder, lastOpened });
const both = { start: true, end: true };

// Both sidebars need 480 + 320 + 280 = 1080. Start alone needs 800.
// End alone needs 760.
describe("main-width rule", () => {
  it("keeps both open when they fit, to the pixel", () => {
    expect(resolvePanels(intent(both, ["start", "end"]), 1080).open).toEqual(
      both,
    );
    expect(resolvePanels(intent(both, ["start", "end"]), 1079).open).toEqual({
      start: false,
      end: true,
    });
  });

  it("closes the oldest sidebar first and records that the rule closed it", () => {
    const resolved = resolvePanels(intent(both, ["start", "end"]), 920);
    expect(resolved.open).toEqual({ start: false, end: true });
    expect(resolved.closedBy).toEqual({ start: "rule", end: null });
  });

  it("never closes the sidebar the user opened last", () => {
    const resolved = resolvePanels(
      intent(both, ["end", "start"], "start"),
      920,
    );
    expect(resolved.open).toEqual({ start: true, end: false });
    expect(
      resolvePanels(intent(both, ["end", "start"], "start"), 420).open,
    ).toEqual({ start: true, end: false });
  });

  it("closes every unprotected sidebar when nothing fits", () => {
    const resolved = resolvePanels(intent(both, ["start", "end"]), 420);
    expect(resolved.open).toEqual({ start: false, end: false });
    expect(resolved.closedBy).toEqual({ start: "rule", end: "rule" });
  });

  it("leaves user-closed sidebars closed", () => {
    const resolved = resolvePanels(
      intent({ start: false, end: true }, ["end"]),
      2000,
    );
    expect(resolved.open).toEqual({ start: false, end: true });
    expect(resolved.closedBy.start).toBe("user");
  });

  it("reopens rule-closed sidebars when there is room again", () => {
    const wanted = intent(both, ["start", "end"]);
    expect(resolvePanels(wanted, 920).open.start).toBe(false);
    expect(resolvePanels(wanted, 1160).open.start).toBe(true);
  });

  it("never closes a sidebar kept as the latest", () => {
    const kept = withLatest(intent(both, ["start", "end"], "end"), "start");
    expect(resolvePanels(kept, 920).open).toEqual({ start: true, end: false });
    expect(resolvePanels(kept, 420).open).toEqual({ start: true, end: false });
    const closed = intent({ start: false, end: true }, ["end"], "end");
    expect(withLatest(closed, "start")).toBe(closed);
  });

  it("waits until the page is measured", () => {
    expect(resolvePanels(intent(both, ["start", "end"]), 0).open).toEqual(both);
  });

  it("uses the start sidebar's own threshold when it is alone", () => {
    const alone = intent({ start: true, end: false }, ["start"]);
    expect(resolvePanels(alone, 800).open.start).toBe(true);
    expect(resolvePanels(alone, 799).open.start).toBe(false);
  });
});

describe("end sidebar width", () => {
  it("is never wider than main", () => {
    expect(endPanelMaxWidth(1160, false)).toBe(580);
    expect(endPanelMaxWidth(1160, true)).toBe(360);
    expect(endPanelMaxWidth(1640, false)).toBe(820);
  });

  it("keeps main's floor and never goes below its own minimum", () => {
    expect(endPanelMaxWidth(900, false)).toBe(420);
    expect(endPanelMaxWidth(700, false)).toBe(280);
  });

  it("clamps the chosen width without storing the clamp", () => {
    expect(resolveEndWidth(600, 1160, true)).toBe(360);
    expect(resolveEndWidth(600, 1160, false)).toBe(580);
    expect(resolveEndWidth(200, 1160, false)).toBe(280);
    expect(resolveEndWidth(460, 1160, false)).toBe(460);
  });

  it("resolves max to the current split", () => {
    expect(resolveEndWidth("max", 1160, false)).toBe(580);
    expect(resolveEndWidth("max", 1640, false)).toBe(820);
    expect(resolveEndWidth("max", 820, false)).toBe(340);
  });

  it("reports the default until the page is measured", () => {
    expect(resolveEndWidth("max", 0, false)).toBe(360);
    expect(resolveEndWidth(200, 0, false)).toBe(280);
  });
});
