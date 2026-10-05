import { describe, expect, it } from "vitest";
import { validateOccupantMap, validatePanel } from "@/lib/panel";
import { placeholderOccupant } from "@/templates/detail-page/placeholder-occupants";
import {
  ARRANGEMENTS,
  arrangementPanel,
  PANEL_TITLES,
  type PanelSlotName,
  parseArrangement,
} from "@/templates/detail-page/preview-panels";

// The Detail page preview's fixed panel arrangements are valid fixtures.
const SLOTS = Object.keys(PANEL_TITLES) as PanelSlotName[];
const base = placeholderOccupant("Panel", "padded");
const translate = (key: string) => key;

describe.each(SLOTS)("the %s arrangements", (slot) => {
  it("single renders as a plain slot", () => {
    expect(arrangementPanel(slot, "single", base, translate)).toBeNull();
  });

  it.each(
    ARRANGEMENTS.filter((a) => a !== "single"),
  )("%s is a valid panel, with an entry for each occupant", (arrangement) => {
    const arranged = arrangementPanel(slot, arrangement, base, translate);
    if (!arranged) throw new Error("No panel");
    const map = Object.fromEntries(
      arranged.specs.map((spec) => [spec.name, { spec }]),
    );
    expect(validatePanel(arranged.panel, arranged.specs)).toEqual([]);
    expect(validateOccupantMap(arranged.panel, map)).toEqual([]);
  });
});

describe("arrangement shapes", () => {
  const shape = (arrangement: (typeof ARRANGEMENTS)[number]) => {
    const arranged = arrangementPanel(
      "end-panel",
      arrangement,
      base,
      translate,
    );
    return arranged?.panel.tabs.map((tab) => tab.occupants.length) ?? [];
  };
  const sizing = (arrangement: (typeof ARRANGEMENTS)[number]) =>
    arrangementPanel("end-panel", arrangement, base, translate)?.specs.map(
      (spec) => spec.sizing ?? "flow",
    );

  it("stack is two flow occupants in one tab", () => {
    expect(shape("stack")).toEqual([2]);
    expect(sizing("stack")).toEqual(["flow", "flow"]);
  });

  it("tabs is three tabs, one of them the fill placeholder", () => {
    expect(shape("tabs")).toEqual([1, 1, 1]);
    expect(sizing("tabs")?.filter((s) => s === "fill")).toHaveLength(1);
  });

  it("overflow is five tabs", () => {
    expect(shape("overflow")).toEqual([1, 1, 1, 1, 1]);
  });

  it("reads an arrangement from the URL, and anything else is single", () => {
    expect(parseArrangement("tabs")).toBe("tabs");
    expect(parseArrangement("nope")).toBe("single");
    expect(parseArrangement(null)).toBe("single");
  });
});
