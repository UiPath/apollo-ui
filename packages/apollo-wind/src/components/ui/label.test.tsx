import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Input } from "./input";
import { Label } from "./label";

describe("Label", () => {
  it("renders label with text", () => {
    render(<Label>Username</Label>);
    expect(screen.getByText("Username")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <div>
        <Label htmlFor="username">Username</Label>
        <Input id="username" />
      </div>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("applies base classes", () => {
    render(<Label>Email</Label>);
    const label = screen.getByText("Email");
    expect(label).toHaveClass("text-sm", "font-medium");
  });

  it("accepts htmlFor attribute", () => {
    render(<Label htmlFor="email">Email</Label>);
    expect(screen.getByText("Email")).toHaveAttribute("for", "email");
  });

  it("accepts custom className", () => {
    render(<Label className="custom-label">Custom</Label>);
    expect(screen.getByText("Custom")).toHaveClass("custom-label");
  });

  it("forwards ref correctly", () => {
    const ref = { current: null };
    render(<Label ref={ref}>Label</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });
});
