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
  it("in the template view, ignores a surface and width", () => {
    const query = serializeWorkbenchView(
      parseWorkbenchView("?view=template&surface=content-area&width=500"),
    );
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

  it("never writes a slot: the template view has no focused occupant", () => {
    for (const query of [
      "?occupant=queue&surface=content-area&width=600",
      "?occupant=queue&view=template&slot=main",
    ])
      expect(roundTrip(query), query).not.toContain("slot=");
  });
});

describe("switching views", () => {
  it("seeds an empty page with the occupant, in the first slot it fits", () => {
    const surface = parseWorkbenchView("?occupant=queue&surface=content-area");
    const template = switchView(surface, "template");
    expect(Object.keys(template.contents)).toEqual(["start-panel"]);
    // Back in the surface view, that occupant opens in its surface.
    const back = switchView(template, "surface");
    expect(serializeWorkbenchView(back)).toBe(
      "?occupant=queue&surface=content-area",
    );
  });

  it("doesn't seed a page that has something on it", () => {
    const template = parseWorkbenchView(
      "?view=template&end-panel-contents=key-facts",
    );
    const surface = switchView(template, "surface");
    expect(switchView(surface, "template").contents).toEqual(template.contents);
  });
});

describe("unknown slots and values", () => {
  it("fall back to the defaults", () => {
    const view = parseWorkbenchView(
      "?occupant=queue&view=template&slot=nope&start-panel-placement=sideways&end-panel-state=weird&end-panel-present=maybe&nope-state=closed",
    );
    // An older link: the occupant goes in the first slot it fits.
    expect(Object.keys(view.contents)).toEqual(["start-panel"]);
    expect(view.layout).toEqual({
      "start-panel": { present: true, open: true },
    });
    expect(serializeWorkbenchView(view)).toBe(
      "?view=template&start-panel-contents=queue",
    );
  });

  it("map the Detail page's old params onto per-slot ones", () => {
    expect(
      roundTrip(
        "?occupant=key-facts&view=template&slot=main&panels=start&start=beside-header&start-state=closed",
      ),
    ).toBe(
      "?view=template&start-panel-state=closed&start-panel-placement=beside-header&end-panel-present=false&main-contents=key-facts",
    );
  });
});
