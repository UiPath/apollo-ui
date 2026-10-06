import { describe, expect, it } from "vitest";
import { TEMPLATE_HOSTS } from "@/app/_components/template-hosts";
import {
  addOccupant,
  occupantsIn,
  placeOccupant,
  type SlotContents,
} from "@/app/preview/occupants/workbench-compose";
import {
  type DropTarget,
  dropOutcome,
} from "@/app/preview/occupants/workbench-drop";
import { panelLocks, picker } from "@/app/preview/occupants/workbench-picker";
import type { LocaleKey, OccupantSpec } from "@/lib/composition";
import { OCCUPANT_SPECS } from "@/lib/occupants.generated";

// What dropping an occupant on the template view does: the composer's own
// rules, so the same as each slot's popover.

const detailPage = TEMPLATE_HOSTS["detail-page"];
if (!detailPage) throw new Error("No Detail page host");

const queueInEnd = placeOccupant(detailPage, {}, "end-panel", "queue");
const twoTabs = addOccupant(detailPage, queueInEnd, "end-panel", "key-facts");
const tabIds = (contents: SlotContents) =>
  contents["end-panel"]?.tabs.map((tab) => tab.id);

const drop = (contents: SlotContents, target: DropTarget, occupant: string) =>
  dropOutcome(detailPage, contents, target, occupant);

describe("dropping between tabs", () => {
  it("makes a new tab at that position, and shows it", () => {
    const first = drop(
      twoTabs,
      { slot: "end-panel", kind: "new-tab", at: 0 },
      "participants",
    );
    if (!first.ok) throw new Error(first.reason);
    expect(tabIds(first.next)).toEqual(["participants", "queue", "key-facts"]);
    expect(first.show).toEqual({ slot: "end-panel", tab: "participants" });
    const middle = drop(
      twoTabs,
      { slot: "end-panel", kind: "new-tab", at: 1 },
      "participants",
    );
    if (!middle.ok) throw new Error(middle.reason);
    expect(tabIds(middle.next)).toEqual(["queue", "participants", "key-facts"]);
  });

  it("is refused at the tab cap", () => {
    const names = ["a", "b", "c", "d", "e", "f"];
    const known: OccupantSpec[] = names.map((name) => ({
      name,
      label: name,
      titleKey: "workbench_tab_label_overview" as LocaleKey,
      requires: { minWidth: 0, scroll: "either" },
    }));
    let contents: SlotContents = {};
    for (const name of names.slice(0, 5))
      contents = addOccupant(
        detailPage,
        contents,
        "end-panel",
        name,
        "new-tab",
        { known },
      );
    expect(
      dropOutcome(
        detailPage,
        contents,
        { slot: "end-panel", kind: "new-tab", at: 2 },
        "f",
        known,
      ),
    ).toEqual({ ok: false, reason: "tab-cap" });
  });
});

describe("dropping on a tab", () => {
  it("stacks into it, which takes the first unused label, and shows it", () => {
    const stacked = drop(
      twoTabs,
      { slot: "end-panel", kind: "tab", index: 1 },
      "participants",
    );
    if (!stacked.ok) throw new Error(stacked.reason);
    expect(stacked.next["end-panel"]?.tabs[1]).toEqual({
      id: "key-facts",
      label: "workbench_tab_label_overview",
      occupants: ["key-facts", "participants"],
    });
    expect(stacked.show).toEqual({ slot: "end-panel", tab: "key-facts" });
  });

  it("refuses a fill occupant, which can still take a new tab", () => {
    const flow = (name: string): OccupantSpec => ({
      name,
      label: name,
      titleKey: "workbench_tab_label_overview" as LocaleKey,
      requires: { minWidth: 0, scroll: "either" },
    });
    const known = [flow("a"), { ...flow("doc"), sizing: "fill" as const }];
    const one = addOccupant(detailPage, {}, "end-panel", "a", "new-tab", {
      known,
    });
    expect(
      dropOutcome(
        detailPage,
        one,
        { slot: "end-panel", kind: "tab", index: 0 },
        "doc",
        known,
      ),
    ).toEqual({ ok: false, reason: "fill-alone" });
    expect(
      dropOutcome(
        detailPage,
        one,
        { slot: "end-panel", kind: "new-tab", at: 1 },
        "doc",
        known,
      ).ok,
    ).toBe(true);
  });
});

describe("dropping on a slot that holds one", () => {
  it("puts the occupant in, or in place of the one there", () => {
    const into = drop(queueInEnd, { slot: "main", kind: "slot" }, "key-facts");
    if (!into.ok) throw new Error(into.reason);
    expect(
      occupantsIn(into.next.main ?? { surface: "side-panel", tabs: [] }),
    ).toEqual(["key-facts"]);
    const replaced = drop(
      into.next,
      { slot: "main", kind: "slot" },
      "participants",
    );
    if (!replaced.ok) throw new Error(replaced.reason);
    expect(
      occupantsIn(replaced.next.main ?? { surface: "side-panel", tabs: [] }),
    ).toEqual(["participants"]);
  });

  it("replaces any occupant, and refuses one that doesn't fit", () => {
    // No occupant is focused: the one in main can be replaced too.
    const keyFactsInMain = placeOccupant(detailPage, {}, "main", "key-facts");
    const replaced = drop(
      keyFactsInMain,
      { slot: "main", kind: "slot" },
      "participants",
    );
    expect(replaced.ok).toBe(true);
    expect(
      drop(queueInEnd, { slot: "header", kind: "slot" }, "participants"),
    ).toEqual({
      ok: false,
      reason: "no-fit",
    });
  });
});

describe("the same rules as the popover", () => {
  it("allows a drop exactly where the slot's popover offers the occupant", () => {
    const contents = addOccupant(detailPage, twoTabs, "main", "participants");
    const names = OCCUPANT_SPECS.map((entry) => entry.spec.name);
    for (const occupant of names) {
      const targets: [DropTarget, Parameters<typeof picker>[3]][] = [
        [{ slot: "end-panel", kind: "new-tab", at: 1 }, "new-tab"],
        [{ slot: "end-panel", kind: "tab", index: 1 }, 1],
        [{ slot: "start-panel", kind: "new-tab", at: 0 }, "new-tab"],
        [{ slot: "header", kind: "slot" }, "replace"],
      ];
      for (const [target, to] of targets) {
        const offered = picker(
          detailPage,
          contents,
          target.slot,
          to,
        ).choices.includes(occupant);
        const locks = panelLocks(contents, target.slot);
        const locked =
          target.kind === "new-tab"
            ? locks.newTab !== null
            : target.kind === "tab"
              ? (locks.tabs[target.index] ?? null) !== null
              : false;
        expect(
          drop(contents, target, occupant).ok,
          `${occupant} on ${JSON.stringify(target)}`,
        ).toBe(offered && !locked);
      }
    }
  });
});
