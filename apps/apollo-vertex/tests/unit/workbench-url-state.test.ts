import { describe, expect, it } from "vitest";
import {
  parseWorkbenchView,
  serializeWorkbenchView,
  switchView,
} from "@/app/preview/occupants/workbench-url-state";

// The workbench's link params: each view owns its own.

const roundTrip = (query: string) =>
  serializeWorkbenchView(parseWorkbenchView(query));

describe("each view's own params", () => {
  it("in the template view, ignores a surface and width, and takes the slot's surface", () => {
    const view = parseWorkbenchView(
      "?occupant=queue&view=template&slot=end-panel&surface=content-area&width=500",
    );
    expect(view.surface).toBe("side-panel");
    const query = serializeWorkbenchView(view);
    expect(query).toContain("slot=end-panel");
    expect(query).not.toContain("surface=");
    expect(query).not.toContain("width=");
  });

  it("in the surface view, ignores the template view's params", () => {
    expect(
      roundTrip(
        "?occupant=queue&slot=main&shell=minimal&page=1000&zoom=100&start-panel-state=closed&panels=none",
      ),
    ).toBe("?occupant=queue");
  });

  it("never writes a surface and a slot together", () => {
    for (const query of [
      "?occupant=queue&surface=content-area&width=600",
      "?occupant=queue&view=template&slot=main",
    ]) {
      const written = roundTrip(query);
      expect(
        written.includes("surface=") && written.includes("slot="),
        written,
      ).toBe(false);
    }
  });
});

describe("switching views", () => {
  it("carries the occupant into the slot that takes its surface, and back", () => {
    const surface = parseWorkbenchView("?occupant=queue&surface=content-area");
    const template = switchView(surface, "template");
    expect(template.slot).toBe("main");
    expect(template.surface).toBe("content-area");
    const back = switchView(template, "surface");
    expect(back.surface).toBe("content-area");
    expect(serializeWorkbenchView(back)).toBe(
      "?occupant=queue&surface=content-area",
    );
  });
});

describe("unknown slots and values", () => {
  it("fall back to the defaults", () => {
    const view = parseWorkbenchView(
      "?occupant=queue&view=template&slot=nope&start-panel-placement=sideways&end-panel-state=weird&end-panel-present=maybe&nope-state=closed",
    );
    expect(view.slot).toBe("start-panel");
    expect(view.layout).toEqual({
      "start-panel": { present: true, open: true },
    });
    expect(serializeWorkbenchView(view)).toBe("?occupant=queue&view=template");
  });

  it("map the Detail page's old params onto per-slot ones", () => {
    expect(
      roundTrip(
        "?occupant=key-facts&view=template&slot=main&panels=start&start=beside-header&start-state=closed",
      ),
    ).toBe(
      "?occupant=key-facts&view=template&slot=main&start-panel-state=closed&start-panel-placement=beside-header&end-panel-present=false",
    );
  });
});
