import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

// Mock the Image constructor to control loading behavior
beforeEach(() => {
  // Reset any mocks
  vi.restoreAllMocks();
});

describe("Avatar", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("displays fallback text", () => {
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  it("shows fallback when image fails to load", async () => {
    render(
      <Avatar>
        <AvatarImage src="invalid-url.jpg" alt="Avatar" />
        <AvatarFallback>FB</AvatarFallback>
      </Avatar>,
    );

    await waitFor(() => {
      expect(screen.getByText("FB")).toBeInTheDocument();
    });
  });

  it("applies custom className to Avatar", () => {
    const { container } = render(
      <Avatar className="custom-avatar">
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    expect(container.firstChild).toHaveClass("custom-avatar");
  });

  it("applies custom className to AvatarFallback", () => {
    render(
      <Avatar>
        <AvatarFallback className="custom-fallback">AB</AvatarFallback>
      </Avatar>,
    );
    const fallback = screen.getByText("AB");
    expect(fallback).toHaveClass("custom-fallback");
  });

  it("forwards ref correctly to Avatar", () => {
    const ref = { current: null };
    render(
      <Avatar ref={ref}>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("forwards ref correctly to AvatarFallback", () => {
    const ref = { current: null };
    render(
      <Avatar>
        <AvatarFallback ref={ref}>AB</AvatarFallback>
      </Avatar>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("renders with initials as fallback", () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders with icon as fallback", () => {
    render(
      <Avatar>
        <AvatarFallback>
          <svg data-testid="fallback-icon" />
        </AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByTestId("fallback-icon")).toBeInTheDocument();
  });

  it("supports delay on fallback", async () => {
    render(
      <Avatar>
        <AvatarImage src="invalid.jpg" alt="Avatar" />
        <AvatarFallback delayMs={100}>FB</AvatarFallback>
      </Avatar>,
    );

    await waitFor(
      () => {
        expect(screen.getByText("FB")).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it("renders rounded-full by default", () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    expect(container.firstChild).toHaveClass("rounded-full");
  });
});
