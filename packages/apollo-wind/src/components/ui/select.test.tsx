import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

describe("Select", () => {
  const SelectExample = ({
    onValueChange = vi.fn(),
  }: {
    onValueChange?: (value: string) => void;
  }) => (
    <Select onValueChange={onValueChange}>
      <SelectTrigger aria-label="Select a fruit">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );

  it("renders without crashing", () => {
    render(<SelectExample />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<SelectExample />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("displays placeholder text", () => {
    render(<SelectExample />);
    expect(screen.getByText("Select a fruit")).toBeInTheDocument();
  });

  it("opens dropdown when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<SelectExample />);

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
    });
  });

  it("selects an item when clicked", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    render(<SelectExample onValueChange={handleValueChange} />);

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("option", { name: "Apple" }));

    expect(handleValueChange).toHaveBeenCalledWith("apple");
  });

  it("supports keyboard navigation with Arrow Down", async () => {
    const user = userEvent.setup();
    render(<SelectExample />);

    const trigger = screen.getByRole("combobox");
    trigger.focus();
    await user.keyboard("{ArrowDown}");

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
    });
  });

  it("supports keyboard navigation with Arrow Up", async () => {
    const user = userEvent.setup();
    render(<SelectExample />);

    const trigger = screen.getByRole("combobox");
    trigger.focus();
    await user.keyboard("{ArrowUp}");

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
    });
  });

  it("supports keyboard navigation with Space", async () => {
    const user = userEvent.setup();
    render(<SelectExample />);

    const trigger = screen.getByRole("combobox");
    trigger.focus();
    await user.keyboard(" ");

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
    });
  });

  it("supports keyboard navigation with Enter", async () => {
    const user = userEvent.setup();
    render(<SelectExample />);

    const trigger = screen.getByRole("combobox");
    trigger.focus();
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
    });
  });

  it("closes dropdown with Escape key", async () => {
    const user = userEvent.setup();
    render(<SelectExample />);

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("option", { name: "Apple" })).not.toBeInTheDocument();
    });
  });

  it("can be disabled", () => {
    render(
      <Select disabled>
        <SelectTrigger aria-label="Select">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="item">Item</SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeDisabled();
  });

  it("supports controlled mode", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    const { rerender } = render(
      <Select value="apple" onValueChange={handleValueChange}>
        <SelectTrigger aria-label="Select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>,
    );

    expect(screen.getByText("Apple")).toBeInTheDocument();

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Banana" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("option", { name: "Banana" }));
    expect(handleValueChange).toHaveBeenCalledWith("banana");

    rerender(
      <Select value="banana" onValueChange={handleValueChange}>
        <SelectTrigger aria-label="Select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>,
    );

    expect(screen.getByText("Banana")).toBeInTheDocument();
  });

  it("renders SelectLabel correctly", async () => {
    const user = userEvent.setup();
    render(<SelectExample />);

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Fruits")).toBeInTheDocument();
    });
  });

  it("supports disabled items", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    render(
      <Select onValueChange={handleValueChange}>
        <SelectTrigger aria-label="Select">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="enabled">Enabled</SelectItem>
          <SelectItem value="disabled" disabled>
            Disabled
          </SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      const disabledOption = screen.getByRole("option", { name: "Disabled" });
      expect(disabledOption).toHaveAttribute("data-disabled", "");
    });
  });

  it("applies custom className to trigger", () => {
    render(
      <Select>
        <SelectTrigger className="custom-class" aria-label="Select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="item">Item</SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("custom-class");
  });

  it("has proper ARIA attributes", () => {
    render(<SelectExample />);
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveAttribute("aria-label", "Select a fruit");
  });
});
