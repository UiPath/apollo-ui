import { describe, expect, it } from "vitest";
import {
  type CollapsibleActionsSpaceInput,
  collapsibleActionsSpace,
} from "../../registry/page-header/collapsible-actions-space";

// A 1440px header with the standalone 32px padding on each side, the
// default 200px nav minimum, and a 90px primary button beside the actions.
const header: Omit<CollapsibleActionsSpaceInput, "layout" | "actionsWidth"> = {
  headerWidth: 1440,
  headerPadding: 64,
  navMinWidth: 200,
  fixedWidth: 90 + 16,
  gap: 16,
};

describe("collapsibleActionsSpace", () => {
  it("grid: measures from the header, not the content-sized actions column", () => {
    // Collapsed, the actions column is only as wide as the menu trigger and
    // the primary button. Measuring it would keep the actions collapsed.
    const collapsedColumn = 36 + 16 + 90;
    const space = collapsibleActionsSpace({
      ...header,
      layout: "grid",
      actionsWidth: collapsedColumn,
    });
    expect(space).toBe(1440 - 64 - 200 - 16 - 106);
    expect(space).toBeGreaterThan(collapsedColumn);
  });

  it("grid: the space doesn't depend on how wide the actions currently are", () => {
    const collapsed = collapsibleActionsSpace({
      ...header,
      layout: "grid",
      actionsWidth: 142,
    });
    const expanded = collapsibleActionsSpace({
      ...header,
      layout: "grid",
      actionsWidth: 400,
    });
    expect(collapsed).toBe(expanded);
  });

  it("grid with content: the actions column is a fixed share, so its width is the space", () => {
    expect(
      collapsibleActionsSpace({
        ...header,
        layout: "grid-with-content",
        actionsWidth: 344,
      }),
    ).toBe(344 - 106);
  });

  it("flex: the nav keeps its minimum on the shared row", () => {
    expect(
      collapsibleActionsSpace({
        ...header,
        headerWidth: 700,
        layout: "flex",
        actionsWidth: 0,
      }),
    ).toBe(700 - 64 - 200 - 106);
  });
});
