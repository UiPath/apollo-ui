import { describe, expect, it } from "vitest";
import {
  endPanelMaxWidth,
  type PanelIntent,
  type PanelSide,
  resolveEndWidth,
  resolvePanels,
} from "@/templates/detail-page/detail-page.template";

const intent = (
  wanted: Record<PanelSide, boolean>,
  openOrder: PanelSide[],
  lastOpened: PanelSide | null = null,
): PanelIntent => ({ wanted, openOrder, lastOpened });
const both = { start: true, end: true };

// Template widths: both panels at their widths need 480 + 320 + 280 = 1080,
// the start panel alone 800, the end panel alone 760.
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

  it("closes the oldest panel first, and records that the rule closed it", () => {
    const r = resolvePanels(intent(both, ["start", "end"]), 920);
    expect(r.open).toEqual({ start: false, end: true });
    expect(r.closedBy).toEqual({ start: "rule", end: null });
  });

  it("never closes the panel the user opened last", () => {
    const r = resolvePanels(intent(both, ["end", "start"], "start"), 920);
    expect(r.open).toEqual({ start: true, end: false });
    // Even with no room for any panel, the latest one stays.
    expect(
      resolvePanels(intent(both, ["end", "start"], "start"), 420).open,
    ).toEqual({ start: true, end: false });
  });

  it("closes everything unprotected when nothing fits", () => {
    const r = resolvePanels(intent(both, ["start", "end"]), 420);
    expect(r.open).toEqual({ start: false, end: false });
    expect(r.closedBy).toEqual({ start: "rule", end: "rule" });
  });

  it("leaves user-closed panels closed, as the user's choice", () => {
    const r = resolvePanels(intent({ start: false, end: true }, ["end"]), 2000);
    expect(r.open).toEqual({ start: false, end: true });
    expect(r.closedBy.start).toBe("user");
  });

  it("reopens rule-closed panels when there's room, since it recomputes from intent", () => {
    const wanted = intent(both, ["start", "end"]);
    expect(resolvePanels(wanted, 920).open.start).toBe(false);
    expect(resolvePanels(wanted, 1160).open.start).toBe(true);
  });

  it("waits for the template to be measured", () => {
    expect(resolvePanels(intent(both, ["start", "end"]), 0).open).toEqual(both);
  });

  it("uses the start panel's own threshold when alone", () => {
    const alone = intent({ start: true, end: false }, ["start"]);
    expect(resolvePanels(alone, 800).open.start).toBe(true);
    expect(resolvePanels(alone, 799).open.start).toBe(false);
  });
});

describe("end panel width", () => {
  it("is never wider than main: 50/50 of the space after the start panel", () => {
    // With the start panel open at 1160, main's floor (840 - 480) is the tighter limit.
    expect(endPanelMaxWidth(1160, false)).toBe(580);
    expect(endPanelMaxWidth(1160, true)).toBe(360);
    expect(endPanelMaxWidth(1640, false)).toBe(820);
  });

  it("keeps main's 480px floor, and never goes below its own minimum", () => {
    expect(endPanelMaxWidth(900, false)).toBe(420);
    expect(endPanelMaxWidth(700, false)).toBe(280);
  });

  it("clamps the chosen width on every render without changing it", () => {
    expect(resolveEndWidth(600, 1160, true)).toBe(360);
    expect(resolveEndWidth(600, 1160, false)).toBe(580);
    expect(resolveEndWidth(200, 1160, false)).toBe(280);
    expect(resolveEndWidth(460, 1160, false)).toBe(460);
  });

  it('resolves "max" to the current split', () => {
    expect(resolveEndWidth("max", 1160, false)).toBe(580);
    expect(resolveEndWidth("max", 1640, false)).toBe(820);
    expect(resolveEndWidth("max", 820, false)).toBe(340);
  });

  it("reports the default until the template is measured", () => {
    expect(resolveEndWidth("max", 0, false)).toBe(360);
    expect(resolveEndWidth(200, 0, false)).toBe(280);
  });
});
