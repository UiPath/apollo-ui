import { describe, expect, it } from "vitest";
import { TEMPLATE_HOSTS } from "@/app/_components/template-hosts";
import { parseContents } from "@/app/preview/occupants/workbench-contents-url";
import {
  hiddenAs,
  locationCopy,
  locationsOf,
} from "@/app/preview/occupants/workbench-locations";

// Where each occupant on the page is, for the list: its slot, and whether
// that slot is left out or closed.

const host = TEMPLATE_HOSTS["detail-page"];
if (!host) throw new Error("No Detail page host");
const contents = parseContents(
  host,
  new URLSearchParams(
    "start-panel-contents=participants&end-panel-contents=queue~overview:key-facts.activity-timeline",
  ),
);

describe("where occupants are", () => {
  it("names each one's slot by its declared name", () => {
    expect(locationsOf(host, contents, {}, null)).toEqual({
      participants: { slot: "start-panel", label: "Start panel", hidden: null },
      queue: { slot: "end-panel", label: "End panel", hidden: null },
      "key-facts": { slot: "end-panel", label: "End panel", hidden: null },
      "activity-timeline": {
        slot: "end-panel",
        label: "End panel",
        hidden: null,
      },
    });
  });

  it("says when a slot is left out or closed, and keeps its occupants", () => {
    const where = locationsOf(
      host,
      contents,
      { "start-panel": { present: false }, "end-panel": { open: false } },
      null,
    );
    expect(where.participants?.hidden).toBe("left-out");
    expect(where.queue?.hidden).toBe("closed");
    expect(Object.keys(where)).toHaveLength(4);
  });

  it("counts a panel the template's rule closed as closed", () => {
    const status = {
      "start-panel": { open: false, closedBy: "rule" as const },
      "end-panel": { open: true, closedBy: null },
    };
    expect(hiddenAs({}, status, "start-panel")).toBe("closed");
    expect(hiddenAs({}, status, "end-panel")).toBeNull();
    // Left out wins over any open state.
    expect(
      hiddenAs({ "end-panel": { present: false } }, status, "end-panel"),
    ).toBe("left-out");
  });

  it("puts each in words", () => {
    const at = { slot: "end-panel", label: "End panel" };
    expect(locationCopy({ ...at, hidden: null })).toBe("workbench_in_slot");
    expect(locationCopy({ ...at, hidden: "left-out" })).toBe(
      "workbench_in_slot_left_out",
    );
    expect(locationCopy({ ...at, hidden: "closed" })).toBe(
      "workbench_in_slot_closed",
    );
  });
});
