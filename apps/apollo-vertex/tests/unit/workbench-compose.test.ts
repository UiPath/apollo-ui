import { describe, expect, it } from "vitest";
import { TEMPLATE_HOSTS } from "@/app/_components/template-hosts";
import {
  activeTab,
  addOccupant,
  holdsPanel,
  normalizeContents,
  occupantsIn,
  placeOccupant,
  removeFromSlot,
  type SlotContents,
} from "@/app/preview/occupants/workbench-compose";
import { panelLocks, picker } from "@/app/preview/occupants/workbench-picker";
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

describe("placing an occupant as a page starts", () => {
  // The template view has no focused occupant: one is placed once, as the
  // view opens with nothing on its page, or from an older link.
  it("puts it in its slot, alone, when nothing else is there", () => {
    const contents = placeOccupant(detailPage, {}, "end-panel", "queue");
    expect(contents).toEqual({
      "end-panel": {
        surface: "side-panel",
        tabs: [{ id: "queue", occupants: ["queue"] }],
      },
    });
  });

  it("puts it first in a panel slot that holds others", () => {
    const added = addOccupant(detailPage, {}, "end-panel", "key-facts");
    const contents = placeOccupant(detailPage, added, "end-panel", "queue");
    expect(
      occupantsIn(contents["end-panel"] ?? { surface: "side-panel", tabs: [] }),
    ).toEqual(["queue", "key-facts"]);
  });

  it("takes it out of any other slot", () => {
    const elsewhere = addOccupant(detailPage, {}, "start-panel", "queue");
    const contents = placeOccupant(detailPage, elsewhere, "end-panel", "queue");
    expect(contents).not.toHaveProperty("start-panel");
  });
});

describe("no focused occupant", () => {
  it("leaves the contents as they are, only what each slot can hold", () => {
    const added = addOccupant(detailPage, {}, "end-panel", "key-facts");
    expect(normalizeContents(detailPage, added)).toEqual(added);
    expect(normalizeContents(detailPage, {})).toEqual({});
  });

  it("never offers an occupant on the page for another slot", () => {
    const contents = placeOccupant(detailPage, {}, "end-panel", "queue");
    const start = picker(detailPage, contents, "start-panel", "new-tab");
    expect(start.choices).not.toContain("queue");
    expect(start.left[0]).toEqual({ reason: "on-page", count: 1 });
  });

  it("lets any occupant be taken out", () => {
    const contents = placeOccupant(detailPage, {}, "end-panel", "queue");
    expect(removeFromSlot(contents, "end-panel", "queue")).toEqual({});
  });

  it("opens a slot on its first tab", () => {
    let contents = addOccupant(detailPage, {}, "end-panel", "key-facts");
    contents = addOccupant(detailPage, contents, "end-panel", "queue");
    const panel = contents["end-panel"];
    if (!panel) throw new Error("No end panel");
    expect(activeTab(panel)).toBe("key-facts");
  });
});

describe("capacity", () => {
  it("lets a slot that holds one take only one occupant", () => {
    const main = addOccupant(detailPage, {}, "main", "key-facts");
    expect(
      occupantsIn(main.main ?? { surface: "side-panel", tabs: [] }),
    ).toEqual(["key-facts"]);
    expect(addOccupant(detailPage, main, "main", "participants")).toBe(main);
    // There's nowhere to put another but in place of the one there.
    expect(holdsPanel(detailPage, "main")).toBe(false);
    expect(picker(detailPage, main, "main", "replace").choices).toContain(
      "participants",
    );
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
    expect(normalizeContents(detailPage, two)).not.toHaveProperty("main");
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
    expect(panelLocks(contents, "end-panel", known).newTab).toBe("tab-cap");
    expect(
      addOccupant(detailPage, contents, "end-panel", "f", "new-tab", {
        known: [...known, flowSpec("f")],
      }),
    ).toBe(contents);
  });

  it("keeps a fill occupant alone in its tab", () => {
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
    // Its own tab takes nothing else (the picker tests cover offering it).
    expect(panelLocks(contents, "end-panel", known)).toEqual({
      newTab: null,
      tabs: [null, "fill-alone"],
    });
    expect(
      addOccupant(detailPage, contents, "end-panel", "b", 1, { label, known }),
    ).toBe(contents);
  });

  it("offers what fits, leaving out the ones that don't", () => {
    const header = picker(detailPage, {}, "header", "replace");
    expect(header.choices.length).toBeGreaterThan(0);
    expect(header.choices).not.toContain("queue");
    expect(header.left).toContainEqual({ reason: "no-fit", count: 3 });
  });

  it("doesn't offer an occupant already there", () => {
    const contents = addOccupant(detailPage, {}, "end-panel", "key-facts");
    const end = picker(detailPage, contents, "end-panel", "new-tab");
    expect(end.choices).not.toContain("key-facts");
    expect(end.left).toContainEqual({ reason: "on-page", count: 1 });
  });
});

describe("removing", () => {
  it("removes an occupant, and a tab it empties", () => {
    let contents = addOccupant(detailPage, {}, "end-panel", "key-facts");
    contents = addOccupant(detailPage, contents, "end-panel", "participants");
    contents = removeFromSlot(contents, "end-panel", "participants");
    expect(contents["end-panel"]?.tabs).toEqual([
      { id: "key-facts", occupants: ["key-facts"] },
    ]);
    contents = removeFromSlot(contents, "end-panel", "key-facts");
    expect(contents).not.toHaveProperty("end-panel");
  });
});
