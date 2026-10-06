import { describe, expect, it } from "vitest";
import { TEMPLATE_HOSTS } from "@/app/_components/template-hosts";
import {
  describeChange,
  resetComposition,
} from "@/app/preview/occupants/workbench-change";
import { addOccupant } from "@/app/preview/occupants/workbench-compose";
import { relabel } from "@/app/preview/occupants/workbench-picker";
import {
  normalizeView,
  parseWorkbenchView,
  type WorkbenchView,
} from "@/app/preview/occupants/workbench-url-state";
import type { LocaleKey } from "@/lib/composition";

// What a change to the template view did, in words, for its toast.

const host = TEMPLATE_HOSTS["detail-page"];
if (!host) throw new Error("No Detail page host");
const t = (key: LocaleKey) => key;
const start = parseWorkbenchView(
  "?occupant=queue&view=template&slot=end-panel",
);
const after = (patch: Partial<WorkbenchView>) =>
  normalizeView({ ...start, ...patch });
const say = (next: WorkbenchView, before = start) =>
  describeChange(host, before, next, t);

describe("describing a change", () => {
  it("says what was added, removed, or replaced, and where", () => {
    const added = after({
      contents: addOccupant(host, start.contents, "end-panel", "key-facts"),
    });
    expect(say(added)).toEqual({
      key: "workbench_change_added",
      values: { occupant: "Key facts", slot: "End panel" },
    });
    expect(say(start, added)).toEqual({
      key: "workbench_change_removed",
      values: { occupant: "Key facts", slot: "End panel" },
    });
    const main = after({
      contents: addOccupant(host, start.contents, "main", "key-facts"),
    });
    const replaced = after({
      contents: {
        ...main.contents,
        main: {
          surface: "side-panel",
          tabs: [{ id: "participants", occupants: ["participants"] }],
        },
      },
    });
    expect(say(replaced, main)).toEqual({
      key: "workbench_change_replaced",
      values: { occupant: "Participants", old: "Key facts", slot: "Main" },
    });
  });

  it("says a stack's tab was renamed", () => {
    let contents = addOccupant(host, start.contents, "end-panel", "key-facts");
    contents = addOccupant(host, contents, "end-panel", "participants", 1, {
      label: "workbench_tab_label_overview",
    });
    const stacked = after({ contents });
    const renamed = after({
      contents: relabel(contents, "end-panel", 1, "workbench_tab_label_people"),
    });
    expect(say(renamed, stacked)).toEqual({
      key: "workbench_change_relabeled",
      values: { label: "workbench_tab_label_people", slot: "End panel" },
    });
  });

  it("says each layout change", () => {
    expect(
      say(after({ layout: { "start-panel": { present: false } } })),
    ).toEqual({
      key: "workbench_change_left_out",
      values: { slot: "Start panel" },
    });
    const left = after({ layout: { "start-panel": { present: false } } });
    expect(say(start, left)?.key).toBe("workbench_change_included");
    expect(
      say(after({ layout: { "start-panel": { open: false } } }))?.key,
    ).toBe("workbench_change_closed");
    expect(
      say(after({ layout: { "end-panel": { placement: "beside-header" } } })),
    ).toEqual({
      key: "workbench_change_placed",
      values: {
        slot: "End panel",
        placement: "detail_page_placement_beside_header",
      },
    });
  });

  it("says a hidden slot keeps what it holds, and how many", () => {
    const two = after({
      contents: addOccupant(host, start.contents, "end-panel", "key-facts"),
    });
    const left = normalizeView({
      ...two,
      layout: { "end-panel": { present: false } },
    });
    // Its contents stay, left out or not.
    expect(left.contents).toEqual(two.contents);
    expect(say(left, two)).toEqual({
      key: "workbench_change_left_out_kept",
      values: { slot: "End panel", count: 2 },
    });
    const closed = after({ layout: { "end-panel": { open: false } } });
    expect(closed.contents).toEqual(start.contents);
    expect(say(closed)).toEqual({
      key: "workbench_change_closed_kept",
      values: { slot: "End panel", count: 1 },
    });
  });

  it("says nothing when nothing it covers changed", () => {
    expect(say(after({ pageWidth: 1200 }))).toBeNull();
  });
});

describe("resetting", () => {
  it("empties every slot and goes back to the template's layout", () => {
    const busy = after({
      contents: addOccupant(host, start.contents, "end-panel", "key-facts"),
      layout: { "start-panel": { present: false } },
      tabs: { "end-panel": "key-facts" },
    });
    const reset = normalizeView({ ...busy, ...resetComposition() });
    // No occupant is focused, so nothing stays: Queue goes too.
    expect(reset.contents).toEqual({});
    expect(reset.layout).toEqual({});
    expect(reset.tabs).toEqual({});
  });
});
