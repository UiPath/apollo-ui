import { init, t } from "i18next";
import { beforeAll, describe, expect, it } from "vitest";
import {
  occupantTarget,
  rename,
  restore,
  stackTarget,
  withRenames,
} from "@/app/preview/occupants/workbench-renames";
import type { PanelSpec } from "@/lib/panel";

// Preview-only renames: registered as workbench-only translation keys, and
// pointed at by the page's panel, never written to it as strings.

beforeAll(async () => {
  await init({ lng: "en", resources: { en: { translation: {} } } });
});

const panel: PanelSpec = {
  surface: "side-panel",
  tabs: [
    { id: "queue", occupants: ["queue"] },
    {
      id: "activity-timeline",
      label: "workbench_tab_label_overview",
      occupants: ["activity-timeline", "participants"],
    },
  ],
};

describe("renames", () => {
  it("registers a name under a workbench-only key that translates", () => {
    const renames = rename({}, occupantTarget("queue"), "  Inbox  ");
    const key = renames[occupantTarget("queue")];
    expect(key).toMatch(/^workbench_renamed_\d+$/);
    expect(key && t(key)).toBe("Inbox");
  });

  it("never reuses a key, so an earlier name keeps its text", () => {
    const first = rename({}, occupantTarget("queue"), "Inbox");
    const second = rename(first, occupantTarget("queue"), "Tasks");
    const [a, b] = [first, second].map((r) => r[occupantTarget("queue")]);
    expect(a).not.toBe(b);
    expect(a && t(a)).toBe("Inbox");
    expect(b && t(b)).toBe("Tasks");
  });

  it("an empty name, or restoring, puts the default back", () => {
    const renamed = rename({}, occupantTarget("queue"), "Inbox");
    expect(rename(renamed, occupantTarget("queue"), "   ")).toEqual({});
    expect(restore(renamed, occupantTarget("queue"))).toEqual({});
  });

  it("points the page's panel at the keys, and leaves the rest as declared", () => {
    let renames = rename({}, occupantTarget("activity-timeline"), "Events");
    renames = rename(
      renames,
      stackTarget("end-panel", "activity-timeline"),
      "Context",
    );
    const shown = withRenames("end-panel", panel, renames);
    expect(shown.tabs[0]).toEqual(panel.tabs[0]);
    expect(shown.tabs[1]?.label).toBe(
      renames[stackTarget("end-panel", "activity-timeline")],
    );
    expect(shown.tabs[1]?.occupants).toEqual([
      {
        occupant: "activity-timeline",
        title: renames[occupantTarget("activity-timeline")],
      },
      "participants",
    ]);
    // A stack's rename is that slot's: another slot's tab is untouched.
    expect(withRenames("start-panel", panel, renames).tabs[1]?.label).toBe(
      "workbench_tab_label_overview",
    );
  });
});
