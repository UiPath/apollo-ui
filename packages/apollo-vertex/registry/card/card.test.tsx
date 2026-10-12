import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Card } from "./card";

afterEach(cleanup);

describe("Card wrapperClassName", () => {
  it("applies to the root element of a plain card", () => {
    const { container } = render(<Card wrapperClassName="col-span-2" />);

    expect(container.firstElementChild?.classList).toContain("col-span-2");
  });

  it("applies to the glow wrapper of a selectable card, not the button", () => {
    const { container, getByRole } = render(
      <Card selectable="standard" wrapperClassName="col-span-2" />,
    );

    expect(container.firstElementChild?.tagName).toBe("DIV");
    expect(container.firstElementChild?.classList).toContain("col-span-2");
    expect(getByRole("button").classList).not.toContain("col-span-2");
  });

  it("keeps className on the inner button of a selectable card", () => {
    const { container, getByRole } = render(
      <Card selectable="standard" className="p-0" />,
    );

    expect(getByRole("button").classList).toContain("p-0");
    expect(container.firstElementChild?.classList).not.toContain("p-0");
  });
});
