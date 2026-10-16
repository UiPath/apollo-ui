import { describe, expect, it } from "vitest";

import { visibleColumnCountAfterToggle } from "./data-table-view-options";

describe("visibleColumnCountAfterToggle", () => {
  const columns = [
    { id: "select", canHide: false, isVisible: true },
    { id: "invoiceNumber", canHide: true, isVisible: true },
    { id: "status", canHide: true, isVisible: true },
    { id: "assignee", canHide: true, isVisible: false },
  ];

  it("adds the toggled column when showing it", () => {
    expect(visibleColumnCountAfterToggle(columns, "assignee", true)).toBe(3);
  });

  it("excludes the toggled column when hiding it", () => {
    expect(visibleColumnCountAfterToggle(columns, "status", false)).toBe(1);
  });

  it("ignores non-hideable columns in the count", () => {
    expect(visibleColumnCountAfterToggle(columns, "assignee", false)).toBe(2);
  });
});
