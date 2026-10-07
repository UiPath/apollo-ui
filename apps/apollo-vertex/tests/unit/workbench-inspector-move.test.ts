import { describe, expect, it } from "vitest";
import {
  applyMove,
  changes,
  followRenames,
  followTab,
  placesInOrder,
  stepPlace,
  whereIs,
} from "@/app/preview/occupants/inspector-move";
import { REGISTERED } from "@/app/preview/occupants/workbench-compose";
import { stackTarget } from "@/app/preview/occupants/workbench-renames";
import type { LocaleKey } from "@/lib/composition";
import type { PanelSpec } from "@/lib/panel";

// The inspector's view of moves: what lands where, the tab that keeps
// showing, a stack's preview-only name, and Move up and Move down.

const OVERVIEW: LocaleKey = "workbench_tab_label_overview";
const DETAILS: LocaleKey = "workbench_tab_label_details";
const panel: PanelSpec = {
  surface: "side-panel",
  tabs: [
    { id: "queue", occupants: ["queue"] },
    {
      id: "activity-timeline",
      label: OVERVIEW,
      occupants: ["activity-timeline", "participants"],
    },
  ],
};
const ok = (result: ReturnType<typeof applyMove>) => {
  if (!result.ok) throw new Error(result.refused);
  return result.panel;
};

describe("inspector moves", () => {
  it("finds an occupant's tab and place", () => {
    expect(whereIs(panel, "participants")).toEqual({ tab: 1, at: 1 });
    expect(whereIs(panel, "nobody")).toEqual({ tab: -1, at: -1 });
  });

  it("moves a tab to an insertion point, either way", () => {
    const after = ok(
      applyMove(
        panel,
        { kind: "tab", index: 0 },
        { kind: "new-tab", at: 2 },
        REGISTERED,
        DETAILS,
      ),
    );
    expect(after.tabs.map((t) => t.id)).toEqual(["activity-timeline", "queue"]);
    // Back where it is: nothing changes.
    const same = applyMove(
      panel,
      { kind: "tab", index: 0 },
      { kind: "new-tab", at: 1 },
      REGISTERED,
      DETAILS,
    );
    expect(changes(panel, same)).toBe(false);
  });

  it("follows the tab showing, even when its id changes", () => {
    const after = ok(
      applyMove(
        panel,
        { kind: "occupant", name: "participants" },
        { kind: "into", tab: 1, at: 0 },
        REGISTERED,
        DETAILS,
      ),
    );
    expect(after.tabs[1]?.id).toBe("participants");
    expect(followTab(panel, after, "activity-timeline")).toBe("participants");
    // An occupant alone in the tab showing is followed to where it went.
    const stacked = ok(
      applyMove(
        panel,
        { kind: "occupant", name: "queue" },
        { kind: "into", tab: 1, at: 2 },
        REGISTERED,
        DETAILS,
      ),
    );
    expect(followTab(panel, stacked, "queue")).toBe("activity-timeline");
    expect(followTab(panel, stacked, "nobody")).toBeNull();
  });

  it("carries a stack's preview-only name to its new id, and drops it with the stack", () => {
    const named = { [stackTarget("end-panel", "activity-timeline")]: DETAILS };
    const swapped = ok(
      applyMove(
        panel,
        { kind: "occupant", name: "participants" },
        { kind: "into", tab: 1, at: 0 },
        REGISTERED,
        DETAILS,
      ),
    );
    expect(followRenames("end-panel", panel, swapped, named)).toEqual({
      [stackTarget("end-panel", "participants")]: DETAILS,
    });
    // Back to one, it's no stack, and no name.
    const split = ok(
      applyMove(
        panel,
        { kind: "occupant", name: "participants" },
        { kind: "new-tab", at: 2 },
        REGISTERED,
        DETAILS,
      ),
    );
    expect(followRenames("end-panel", panel, split, named)).toEqual({});
    // Another slot's names stay as they are.
    const other = { [stackTarget("start-panel", "x")]: DETAILS };
    expect(followRenames("end-panel", panel, split, other)).toEqual(other);
  });

  it("Move up and Move down: one place along, null at either end", () => {
    expect(stepPlace(panel, { kind: "tab", index: 0 }, -1)).toBeNull();
    expect(stepPlace(panel, { kind: "tab", index: 0 }, 1)).toEqual({
      kind: "new-tab",
      at: 2,
    });
    expect(stepPlace(panel, { kind: "tab", index: 1 }, -1)).toEqual({
      kind: "new-tab",
      at: 0,
    });
    expect(
      stepPlace(panel, { kind: "occupant", name: "participants" }, -1),
    ).toEqual({ kind: "into", tab: 1, at: 0 });
    expect(
      stepPlace(panel, { kind: "occupant", name: "participants" }, 1),
    ).toBeNull();
    // Alone in its tab, an occupant moves with its tab instead.
    expect(stepPlace(panel, { kind: "occupant", name: "queue" }, 1)).toBeNull();
  });

  it("lists every place in order for the keyboard; a tab takes only insertion points", () => {
    expect(placesInOrder(panel, { kind: "tab", index: 0 })).toEqual([
      { kind: "new-tab", at: 0 },
      { kind: "new-tab", at: 1 },
      { kind: "new-tab", at: 2 },
    ]);
    expect(placesInOrder(panel, { kind: "occupant", name: "queue" })).toEqual([
      { kind: "new-tab", at: 0 },
      { kind: "into", tab: 0, at: 0 },
      { kind: "into", tab: 0, at: 1 },
      { kind: "new-tab", at: 1 },
      { kind: "into", tab: 1, at: 0 },
      { kind: "into", tab: 1, at: 1 },
      { kind: "into", tab: 1, at: 2 },
      { kind: "new-tab", at: 2 },
    ]);
  });
});
