import { describe, expect, it } from "vitest";
import { TEMPLATE_HOSTS } from "@/app/_components/template-hosts";
import {
  activeTab,
  addChoices,
  addOccupant,
  destinations,
  normalizeContents,
  occupantsIn,
  removeFromSlot,
  removeLock,
  type SlotContents,
} from "@/app/preview/occupants/workbench-compose";
import type { LocaleKey, OccupantSpec } from "@/lib/composition";
import { TWO_UP_HOST } from "./fixtures/two-up-template";

// What each template slot holds in the workbench, from what the template
// declares: its capacity, its surfaces, and composition's checks.

const detailPage = TEMPLATE_HOSTS["detail-page"];
if (!detailPage) throw new Error("No Detail page host");

const label = "workbench_tab_label_overview" as LocaleKey;

/** A flow occupant of the tests' own, for a side panel. */
const flowSpec = (name: string): OccupantSpec => ({
  name,
  label: name,
  titleKey: label,
  requires: { minWidth: 0, scroll: "either" },
});

describe("the focused occupant", () => {
  it("is placed in its slot, alone, when nothing else is there", () => {
    const contents = normalizeContents(detailPage, {}, "end-panel", "queue");
    expect(contents).toEqual({
      "end-panel": {
        surface: "side-panel",
        tabs: [{ id: "queue", occupants: ["queue"] }],
      },
    });
  });

  it("goes first in a panel slot that holds others", () => {
    const added = addOccupant(detailPage, {}, "end-panel", "key-facts");
    const contents = normalizeContents(detailPage, added, "end-panel", "queue");
    expect(
      occupantsIn(contents["end-panel"] ?? { surface: "side-panel", tabs: [] }),
    ).toEqual(["queue", "key-facts"]);
  });

  it("is in no other slot", () => {
    const elsewhere = addOccupant(detailPage, {}, "start-panel", "queue");
    const contents = normalizeContents(
      detailPage,
      elsewhere,
      "end-panel",
      "queue",
    );
    expect(contents).not.toHaveProperty("start-panel");
  });

  it("can't be added to another slot, with the focus reason", () => {
    const contents = normalizeContents(detailPage, {}, "end-panel", "queue");
    const choice = addChoices(
      detailPage,
      contents,
      "start-panel",
      "queue",
    ).find((c) => c.value === "queue");
    expect(choice?.lock).toBe("focus");
  });

  it("can't be removed, with the focus reason", () => {
    expect(removeLock("queue", "queue")).toBe("focus");
    const contents = normalizeContents(detailPage, {}, "end-panel", "queue");
    expect(removeFromSlot(contents, "end-panel", "queue", "queue")).toBe(
      contents,
    );
  });

  it("opens on its own tab", () => {
    let contents = addOccupant(detailPage, {}, "end-panel", "key-facts");
    contents = normalizeContents(detailPage, contents, "end-panel", "queue");
    const panel = contents["end-panel"];
    if (!panel) throw new Error("No end panel");
    expect(activeTab(panel, "queue")).toBe("queue");
    expect(activeTab(panel, "nobody")).toBe(panel.tabs[0]?.id);
  });
});

describe("capacity", () => {
  it("lets a slot that holds one take only one occupant", () => {
    const main = addOccupant(detailPage, {}, "main", "key-facts");
    expect(
      occupantsIn(main.main ?? { surface: "side-panel", tabs: [] }),
    ).toEqual(["key-facts"]);
    expect(addOccupant(detailPage, main, "main", "participants")).toBe(main);
    const full = addChoices(detailPage, main, "main", "queue").find(
      (c) => c.value === "participants",
    );
    expect(full?.lock).toBe("full");
    // There's nowhere to put it but in place of the one there.
    expect(destinations(detailPage, main, "main", "participants")).toEqual([]);
  });

  it("drops a single-occupant slot given more than one", () => {
    const two = {
      main: {
        surface: "side-panel" as const,
        tabs: [
          { id: "key-facts", occupants: ["key-facts"] },
          { id: "participants", occupants: ["participants"] },
        ],
      },
    };
    expect(
      normalizeContents(detailPage, two, "end-panel", "queue"),
    ).not.toHaveProperty("main");
  });

  it("reads a second template's declarations the same way", () => {
    let contents = addOccupant(TWO_UP_HOST, {}, "aside", "key-facts");
    contents = addOccupant(TWO_UP_HOST, contents, "aside", "participants");
    expect(
      occupantsIn(contents.aside ?? { surface: "side-panel", tabs: [] }),
    ).toEqual(["key-facts", "participants"]);
    const body = addOccupant(TWO_UP_HOST, {}, "body", "key-facts");
    expect(addOccupant(TWO_UP_HOST, body, "body", "participants")).toBe(body);
  });
});

describe("adding to a panel", () => {
  it("adds as a new tab, or stacks into a tab with a label", () => {
    let contents = addOccupant(detailPage, {}, "end-panel", "key-facts");
    contents = addOccupant(
      detailPage,
      contents,
      "end-panel",
      "participants",
      0,
      { label },
    );
    expect(contents["end-panel"]?.tabs).toEqual([
      { id: "key-facts", label, occupants: ["key-facts", "participants"] },
    ]);
  });

  it("needs a label to stack into a tab that has none", () => {
    const one = addOccupant(detailPage, {}, "end-panel", "key-facts");
    expect(addOccupant(detailPage, one, "end-panel", "participants", 0)).toBe(
      one,
    );
  });

  // Only four registered occupants fit a side panel, and none fills its
  // tab, so these two use occupants of their own.
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
        { known },
      );
    expect(contents["end-panel"]?.tabs).toHaveLength(5);
    const [newTab] = destinations(
      detailPage,
      contents,
      "end-panel",
      "f",
      known,
    );
    expect(newTab).toEqual({ value: "new-tab", lock: "tab-cap" });
    expect(
      addOccupant(detailPage, contents, "end-panel", "f", "new-tab", {
        known: [...known, flowSpec("f")],
      }),
    ).toBe(contents);
  });

  it("locks stacking a fill occupant, or into a fill occupant's tab", () => {
    const known = [
      flowSpec("a"),
      flowSpec("b"),
      { ...flowSpec("doc"), sizing: "fill" as const },
    ];
    let contents = addOccupant(detailPage, {}, "end-panel", "a", "new-tab", {
      known,
    });
    contents = addOccupant(
      detailPage,
      contents,
      "end-panel",
      "doc",
      "new-tab",
      { known },
    );
    expect(
      destinations(detailPage, contents, "end-panel", "doc", known),
    ).toEqual([
      { value: "new-tab", lock: null },
      { value: 0, lock: "fill-alone" },
      { value: 1, lock: "fill-alone" },
    ]);
    expect(
      destinations(detailPage, contents, "end-panel", "b", known)[2],
    ).toEqual({
      value: 1,
      lock: "fill-alone",
    });
    expect(
      addOccupant(detailPage, contents, "end-panel", "b", 1, { label, known }),
    ).toBe(contents);
  });

  it("offers every registered occupant, locking ones that don't fit", () => {
    const choices = addChoices(detailPage, {}, "header", "key-facts");
    expect(choices.length).toBeGreaterThan(1);
    expect(choices.find((c) => c.value === "queue")?.lock).toBe("no-fit");
  });

  it("marks an occupant already there", () => {
    const contents = addOccupant(detailPage, {}, "end-panel", "key-facts");
    expect(
      addChoices(detailPage, contents, "end-panel", "queue").find(
        (c) => c.value === "key-facts",
      )?.lock,
    ).toBe("present");
  });
});

describe("removing", () => {
  it("removes an occupant, and a tab it empties", () => {
    let contents = addOccupant(detailPage, {}, "end-panel", "key-facts");
    contents = addOccupant(detailPage, contents, "end-panel", "participants");
    contents = removeFromSlot(contents, "end-panel", "participants", "queue");
    expect(contents["end-panel"]?.tabs).toEqual([
      { id: "key-facts", occupants: ["key-facts"] },
    ]);
    contents = removeFromSlot(contents, "end-panel", "key-facts", "queue");
    expect(contents).not.toHaveProperty("end-panel");
  });
});
