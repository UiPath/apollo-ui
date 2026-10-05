import { describe, expect, it } from "vitest";
import { removeFromSlot } from "@/app/preview/occupants/workbench-compose";
import {
  normalizeView,
  parseWorkbenchView,
  serializeWorkbenchView,
} from "@/app/preview/occupants/workbench-url-state";

// Each template slot's contents in the link: <slot>-contents, tabs joined
// by "~", a stack's occupants by ".", and a stack's label id before ":".

const base = "?occupant=queue&view=template&slot=end-panel";
const roundTrip = (query: string) =>
  serializeWorkbenchView(parseWorkbenchView(query));

describe("slot contents in links", () => {
  it("reads tabs, stacks, and labels", () => {
    const view = parseWorkbenchView(
      `${base}&end-panel-contents=queue~overview:key-facts.participants~activity-timeline`,
    );
    expect(view.contents["end-panel"]?.tabs).toEqual([
      { id: "queue", occupants: ["queue"] },
      {
        id: "key-facts",
        label: "workbench_tab_label_overview",
        occupants: ["key-facts", "participants"],
      },
      { id: "activity-timeline", occupants: ["activity-timeline"] },
    ]);
  });

  it("writes them back as they were read", () => {
    // In the template's slot order.
    const query = `${base}&start-panel-contents=key-facts&end-panel-contents=queue~overview:key-facts.participants~activity-timeline`;
    expect(roundTrip(query)).toBe(query);
  });

  it("writes the focused occupant where it sits", () => {
    const query = `${base}&end-panel-contents=key-facts~queue`;
    expect(roundTrip(query)).toBe(query);
  });

  it("writes nothing for a slot holding only the focused occupant", () => {
    expect(roundTrip(`${base}&end-panel-contents=queue`)).toBe(base);
  });

  it("opens a link without them as before", () => {
    const view = parseWorkbenchView(base);
    expect(view.contents).toEqual({
      "end-panel": {
        surface: "side-panel",
        tabs: [{ id: "queue", occupants: ["queue"] }],
      },
    });
  });

  it("drops a slot it can't hold", () => {
    // A stack needs a label; main holds one; nobody isn't registered.
    expect(
      roundTrip(
        `${base}&start-panel-contents=key-facts.participants&main-contents=key-facts~participants&header-contents=nobody`,
      ),
    ).toBe(base);
  });

  it("falls back to the focused occupant alone when its slot is invalid", () => {
    const view = parseWorkbenchView(
      `${base}&end-panel-contents=queue~key-facts.participants`,
    );
    expect(view.contents["end-panel"]?.tabs).toEqual([
      { id: "queue", occupants: ["queue"] },
    ]);
  });

  it("puts the focused occupant first when the link leaves it out", () => {
    expect(roundTrip(`${base}&end-panel-contents=key-facts`)).toBe(
      `${base}&end-panel-contents=queue~key-facts`,
    );
  });

  it("is read and written only in the template view", () => {
    expect(roundTrip("?occupant=queue&end-panel-contents=key-facts")).toBe(
      "?occupant=queue",
    );
  });
});

describe("the chosen tab in links", () => {
  const stacked = `${base}&end-panel-contents=queue~overview:key-facts.participants`;

  it("reads and writes it by its id, the tab's first occupant", () => {
    const query = `${stacked}&end-panel-tab=key-facts`;
    expect(parseWorkbenchView(query).tabs).toEqual({
      "end-panel": "key-facts",
    });
    expect(roundTrip(query)).toBe(query);
  });

  it("writes nothing for the tab the slot opens on", () => {
    expect(roundTrip(`${stacked}&end-panel-tab=queue`)).toBe(stacked);
  });

  it("falls back to the first tab once its first occupant is taken out", () => {
    const view = parseWorkbenchView(`${stacked}&end-panel-tab=key-facts`);
    const next = normalizeView({
      ...view,
      contents: removeFromSlot(
        view.contents,
        "end-panel",
        "key-facts",
        "queue",
      ),
    });
    // The tab is Participants' now, so key-facts names no tab.
    expect(next.contents["end-panel"]?.tabs.map((tab) => tab.id)).toEqual([
      "queue",
      "participants",
    ]);
    expect(next.tabs).toEqual({ "end-panel": "queue" });
    expect(serializeWorkbenchView(next)).toBe(
      `${base}&end-panel-contents=queue~participants`,
    );
  });

  it("falls back to the first tab, not the focused one, for an id a link no longer has", () => {
    const view = parseWorkbenchView(
      `${base}&end-panel-contents=key-facts~queue&end-panel-tab=participants`,
    );
    expect(view.tabs).toEqual({ "end-panel": "key-facts" });
  });

  it("drops a tab for a slot that holds nothing", () => {
    expect(roundTrip(`${base}&start-panel-tab=key-facts`)).toBe(base);
  });
});
