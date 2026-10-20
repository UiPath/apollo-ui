import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Toaster } from "./sonner";

vi.mock("sonner", () => ({
  Toaster: ({ theme }: { theme?: string }) => (
    <div data-testid="sonner" data-theme={theme} />
  ),
}));

describe("Toaster", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders without a theme provider and leaves Sonner on its default theme", () => {
    const { getByTestId } = render(<Toaster theme="dark" />);

    expect(getByTestId("sonner").dataset.theme).toBeUndefined();
  });
});
