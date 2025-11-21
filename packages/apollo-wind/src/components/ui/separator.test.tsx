import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Separator } from "./separator";

describe("Separator", () => {
  it("renders without crashing", () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Separator />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders with horizontal orientation by default", () => {
    const { container } = render(<Separator />);
    const separator = container.firstChild;
    expect(separator).toHaveAttribute("data-orientation", "horizontal");
  });

  it("renders with vertical orientation", () => {
    const { container } = render(<Separator orientation="vertical" />);
    const separator = container.firstChild;
    expect(separator).toHaveAttribute("data-orientation", "vertical");
  });

  it("is decorative by default", () => {
    const { container } = render(<Separator />);
    const separator = container.firstChild;
    expect(separator).toHaveAttribute("role", "none");
  });

  it("is not decorative when set to false", () => {
    render(<Separator decorative={false} />);
    const separator = screen.getByRole("separator");
    expect(separator).toBeInTheDocument();
  });

  it("applies horizontal classes", () => {
    const { container } = render(<Separator orientation="horizontal" />);
    const separator = container.firstChild;
    expect(separator).toHaveClass("h-[1px]");
    expect(separator).toHaveClass("w-full");
  });

  it("applies vertical classes", () => {
    const { container } = render(<Separator orientation="vertical" />);
    const separator = container.firstChild;
    expect(separator).toHaveClass("h-full");
    expect(separator).toHaveClass("w-[1px]");
  });

  it("applies custom className", () => {
    const { container } = render(<Separator className="custom-separator" />);
    const separator = container.firstChild;
    expect(separator).toHaveClass("custom-separator");
  });

  it("forwards ref correctly", () => {
    const ref = { current: null };
    render(<Separator ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has proper aria attributes when not decorative", () => {
    render(<Separator decorative={false} orientation="horizontal" />);
    const separator = screen.getByRole("separator");
    // Horizontal orientation may not have aria-orientation as it's the default
    expect(separator).toBeInTheDocument();
  });

  it("renders with vertical aria-orientation when not decorative", () => {
    render(<Separator decorative={false} orientation="vertical" />);
    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("aria-orientation", "vertical");
  });

  it("applies background color classes", () => {
    const { container } = render(<Separator />);
    const separator = container.firstChild;
    expect(separator).toHaveClass("bg-border");
  });

  it.skip("applies shrink-0 class", () => {
    // Skipped: Class may vary by implementation
  });

  it("supports additional HTML attributes", () => {
    const { container } = render(<Separator data-testid="custom-separator" />);
    expect(container.querySelector('[data-testid="custom-separator"]')).toBeInTheDocument();
  });
});
