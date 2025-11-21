import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

describe("Popover", () => {
  const PopoverExample = () => (
    <Popover>
      <PopoverTrigger>Open Popover</PopoverTrigger>
      <PopoverContent>Popover content goes here</PopoverContent>
    </Popover>
  );

  it("renders trigger without crashing", () => {
    render(<PopoverExample />);
    expect(screen.getByRole("button", { name: "Open Popover" })).toBeInTheDocument();
  });

  it("has no accessibility violations when closed", async () => {
    const { container } = render(<PopoverExample />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { container } = render(<PopoverExample />);

    const trigger = screen.getByRole("button", { name: "Open Popover" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Popover content goes here")).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("opens popover when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<PopoverExample />);

    const trigger = screen.getByRole("button", { name: "Open Popover" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Popover content goes here")).toBeInTheDocument();
    });
  });

  it("closes popover when trigger is clicked again", async () => {
    const user = userEvent.setup();
    render(<PopoverExample />);

    const trigger = screen.getByRole("button", { name: "Open Popover" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Popover content goes here")).toBeInTheDocument();
    });

    await user.click(trigger);

    await waitFor(() => {
      expect(screen.queryByText("Popover content goes here")).not.toBeInTheDocument();
    });
  });

  it("closes popover with Escape key", async () => {
    const user = userEvent.setup();
    render(<PopoverExample />);

    const trigger = screen.getByRole("button", { name: "Open Popover" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Popover content goes here")).toBeInTheDocument();
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByText("Popover content goes here")).not.toBeInTheDocument();
    });
  });

  it("applies custom className to content", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent className="custom-popover">Custom Content</PopoverContent>
      </Popover>,
    );

    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);

    await waitFor(() => {
      const content = screen.getByText("Custom Content");
      expect(content).toHaveClass("custom-popover");
    });
  });

  it("supports controlled mode", async () => {
    const { rerender } = render(
      <Popover open={false}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    );

    expect(screen.queryByText("Content")).not.toBeInTheDocument();

    rerender(
      <Popover open={true}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    );

    await waitFor(() => {
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  it("supports align prop", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent align="start">Aligned content</PopoverContent>
      </Popover>,
    );

    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Aligned content")).toBeInTheDocument();
    });
  });

  it("supports sideOffset prop", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent sideOffset={10}>Content</PopoverContent>
      </Popover>,
    );

    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  it("forwards ref correctly to content", () => {
    const ref = { current: null };
    render(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent ref={ref}>Content</PopoverContent>
      </Popover>,
    );
    waitFor(() => {
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  it("supports side prop", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent side="top">Top content</PopoverContent>
      </Popover>,
    );

    const trigger = screen.getByRole("button", { name: "Open" });
    await act(async () => {
      await user.click(trigger);
    });

    await waitFor(() => {
      expect(screen.getByText("Top content")).toBeInTheDocument();
    });
  });

  it("closes on outside click", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <PopoverExample />
      </div>,
    );

    const trigger = screen.getByRole("button", { name: "Open Popover" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Popover content goes here")).toBeInTheDocument();
    });

    const outside = screen.getByTestId("outside");
    await user.click(outside);

    await waitFor(() => {
      expect(screen.queryByText("Popover content goes here")).not.toBeInTheDocument();
    });
  });

  it("supports asChild on trigger", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <button>Custom trigger</button>
        </PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    );

    const trigger = screen.getByRole("button", { name: "Custom trigger" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });
});
