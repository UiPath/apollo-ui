import { describe, expect, it } from "vitest";
import { TEMPLATE_HOSTS } from "@/app/_components/template-hosts";
import {
  addOccupant,
  normalizeContents,
  type SlotContents,
} from "@/app/preview/occupants/workbench-compose";
import {
  firstUnusedLabel,
  onPage,
  panelLocks,
  picker,
  relabel,
  replaceIn,
} from "@/app/preview/occupants/workbench-picker";
import type { LocaleKey, OccupantSpec } from "@/lib/composition";
import { TWO_UP_HOST } from "./fixtures/two-up-template";

// The composer's choices for one slot: the picker, the panel's real
// limits, a stack's label, and replacing a single slot's occupant.

const detailPage = TEMPLATE_HOSTS["detail-page"];
if (!detailPage) throw new Error("No Detail page host");

const title = "workbench_tab_label_overview" as LocaleKey;

/** A flow occupant of the tests' own, for a side panel. */
const flowSpec = (name: string): OccupantSpec => ({
  name,
  label: name,
  titleKey: title,
  requires: { minWidth: 0, scroll: "either" },
});
const fillSpec = (name: string): OccupantSpec => ({
  ...flowSpec(name),
  sizing: "fill",
});

const queueInEnd = normalizeContents(detailPage, {}, "end-panel", "queue");

describe("the picker", () => {
  it("offers what fits the slot and isn't on the page", () => {
    expect(picker(detailPage, queueInEnd, "end-panel", "new-tab")).toEqual({
      choices: ["activity-timeline", "key-facts", "participants"],
      left: [
        { reason: "on-page", count: 1 },
        { reason: "no-fit", count: 1 },
      ],
    });
  });

  it("never offers an occupant already in another slot", () => {
    const contents = addOccupant(detailPage, queueInEnd, "main", "key-facts");
    expect(onPage(contents)).toEqual(new Set(["queue", "key-facts"]));
    const end = picker(detailPage, contents, "end-panel", "new-tab");
    expect(end.choices).not.toContain("key-facts");
    expect(end.left[0]).toEqual({ reason: "on-page", count: 2 });
    // The focused occupant isn't offered anywhere else either.
    expect(
      picker(detailPage, contents, "start-panel", "new-tab").choices,
    ).not.toContain("queue");
  });

  it("counts what doesn't fit, by the slot's own rules", () => {
    // Key facts and Stage strip work horizontally; the others don't.
    expect(picker(detailPage, queueInEnd, "header", "replace")).toEqual({
      choices: ["key-facts", "stage-strip"],
      left: [
        { reason: "on-page", count: 1 },
        { reason: "no-fit", count: 2 },
      ],
    });
    // A second template: Activity timeline is too wide for its aside.
    const aside = picker(TWO_UP_HOST, {}, "aside", "new-tab");
    expect(aside.choices).not.toContain("activity-timeline");
  });

  it("leaves a fill occupant out of a tab, but offers it a new tab", () => {
    const known = [flowSpec("a"), flowSpec("b"), fillSpec("doc")];
    const contents = addOccupant(detailPage, {}, "end-panel", "a", "new-tab", {
      known,
    });
    expect(picker(detailPage, contents, "end-panel", 0, known)).toEqual({
      choices: ["b"],
      left: [
        { reason: "on-page", count: 1 },
        { reason: "fill", count: 1 },
      ],
    });
    expect(
      picker(detailPage, contents, "end-panel", "new-tab", known).choices,
    ).toEqual(["b", "doc"]);
  });
});

describe("a panel's limits", () => {
  // Only four registered occupants fit a side panel, and none fills its
  // tab, so these use occupants of their own.
  it("locks a new tab at the tab cap", () => {
    const names = ["a", "b", "c", "d", "e"];
    const known = names.map((name) => flowSpec(name));
    let contents: SlotContents = {};
    for (const name of names)
      contents = addOccupant(
        detailPage,
        contents,
        "end-panel",
        name,
        "new-tab",
        {
          known,
        },
      );
    expect(panelLocks(contents, "end-panel", known)).toEqual({
      newTab: "tab-cap",
      tabs: [null, null, null, null, null],
    });
  });

  it("locks stacking into a fill occupant's tab, and nothing else", () => {
    const known = [flowSpec("a"), fillSpec("doc")];
    let contents = addOccupant(detailPage, {}, "end-panel", "a", "new-tab", {
      known,
    });
    contents = addOccupant(
      detailPage,
      contents,
      "end-panel",
      "doc",
      "new-tab",
      {
        known,
      },
    );
    expect(panelLocks(contents, "end-panel", known)).toEqual({
      newTab: null,
      tabs: [null, "fill-alone"],
    });
  });
});

describe("a stack's label", () => {
  it("is the first preset no tab has", () => {
    expect(firstUnusedLabel()).toBe("workbench_tab_label_overview");
    const stacked = addOccupant(
      detailPage,
      queueInEnd,
      "end-panel",
      "key-facts",
      0,
      { label: firstUnusedLabel(queueInEnd["end-panel"]) },
    );
    expect(stacked["end-panel"]?.tabs[0]?.label).toBe(
      "workbench_tab_label_overview",
    );
    expect(firstUnusedLabel(stacked["end-panel"])).toBe(
      "workbench_tab_label_details",
    );
  });

  it("falls back to the first preset when every one is taken", () => {
    const tabs = ["overview", "details", "activity", "people"].map((id) => ({
      id,
      label: `workbench_tab_label_${id}` as LocaleKey,
      occupants: [id, `${id}-2`],
    }));
    expect(firstUnusedLabel({ surface: "side-panel", tabs })).toBe(
      "workbench_tab_label_overview",
    );
  });

  it("can be changed on a stack, not given to one occupant", () => {
    let contents = addOccupant(
      detailPage,
      queueInEnd,
      "end-panel",
      "key-facts",
    );
    expect(relabel(contents, "end-panel", 1, title)).toBe(contents);
    contents = addOccupant(
      detailPage,
      contents,
      "end-panel",
      "participants",
      1,
      {
        label: title,
      },
    );
    const people = "workbench_tab_label_people" as LocaleKey;
    expect(
      relabel(contents, "end-panel", 1, people)["end-panel"]?.tabs[1]?.label,
    ).toBe(people);
  });
});

describe("replacing a single slot's occupant", () => {
  const main = addOccupant(detailPage, queueInEnd, "main", "key-facts");

  it("puts another occupant in its place", () => {
    const next = replaceIn(detailPage, main, "main", "participants", "queue");
    expect(next.main?.tabs).toEqual([
      { id: "participants", occupants: ["participants"] },
    ]);
  });

  it("leaves a panel slot, the focused occupant's slot, and a misfit alone", () => {
    expect(
      replaceIn(detailPage, main, "end-panel", "participants", "queue"),
    ).toBe(main);
    const focused = normalizeContents(detailPage, {}, "main", "key-facts");
    expect(
      replaceIn(detailPage, focused, "main", "participants", "key-facts"),
    ).toBe(focused);
    expect(replaceIn(detailPage, main, "header", "queue", "queue")).toBe(main);
  });
});
