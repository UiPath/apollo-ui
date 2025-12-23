import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

describe("Tabs", () => {
  const TabsExample = ({
    onValueChange = vi.fn(),
  }: {
    onValueChange?: (value: string) => void;
  }) => (
    <Tabs defaultValue="tab1" onValueChange={onValueChange}>
      <TabsList aria-label="Example tabs">
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content for Tab 1</TabsContent>
      <TabsContent value="tab2">Content for Tab 2</TabsContent>
      <TabsContent value="tab3">Content for Tab 3</TabsContent>
    </Tabs>
  );

  it("renders without crashing", () => {
    render(<TabsExample />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<TabsExample />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders all tab triggers", () => {
    render(<TabsExample />);
    expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab 2" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab 3" })).toBeInTheDocument();
  });

  it("displays default active tab content", () => {
    render(<TabsExample />);
    expect(screen.getByText("Content for Tab 1")).toBeInTheDocument();
  });

  it("does not display inactive tab content", () => {
    render(<TabsExample />);
    expect(screen.queryByText("Content for Tab 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Content for Tab 3")).not.toBeInTheDocument();
  });

  it("switches tabs when clicked", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    render(<TabsExample onValueChange={handleValueChange} />);

    const tab2 = screen.getByRole("tab", { name: "Tab 2" });
    await user.click(tab2);

    expect(handleValueChange).toHaveBeenCalledWith("tab2");
    expect(screen.getByText("Content for Tab 2")).toBeInTheDocument();
    expect(screen.queryByText("Content for Tab 1")).not.toBeInTheDocument();
  });

  it("supports keyboard navigation with Arrow Right", async () => {
    const user = userEvent.setup();
    render(<TabsExample />);

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    await user.click(tab1);
    await user.keyboard("{ArrowRight}");

    await waitFor(() => {
      const tab2 = screen.getByRole("tab", { name: "Tab 2" });
      expect(tab2).toHaveFocus();
    });
  });

  it("supports keyboard navigation with Arrow Left", async () => {
    const user = userEvent.setup();
    render(<TabsExample />);

    const tab2 = screen.getByRole("tab", { name: "Tab 2" });
    await user.click(tab2);
    await user.keyboard("{ArrowLeft}");

    await waitFor(() => {
      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      expect(tab1).toHaveFocus();
    });
  });

  it("supports keyboard navigation with Home key", async () => {
    const user = userEvent.setup();
    render(<TabsExample />);

    const tab3 = screen.getByRole("tab", { name: "Tab 3" });
    await user.click(tab3);
    await user.keyboard("{Home}");

    await waitFor(() => {
      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      expect(tab1).toHaveFocus();
    });
  });

  it("supports keyboard navigation with End key", async () => {
    const user = userEvent.setup();
    render(<TabsExample />);

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    await user.click(tab1);
    await user.keyboard("{End}");

    await waitFor(() => {
      const tab3 = screen.getByRole("tab", { name: "Tab 3" });
      expect(tab3).toHaveFocus();
    });
  });

  it("indicates active tab with aria-selected", () => {
    render(<TabsExample />);
    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    const tab2 = screen.getByRole("tab", { name: "Tab 2" });

    expect(tab1).toHaveAttribute("aria-selected", "true");
    expect(tab2).toHaveAttribute("aria-selected", "false");
  });

  it("supports disabled tabs", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="tab1">
        <TabsList aria-label="Tabs">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2" disabled>
            Tab 2
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>,
    );

    const tab2 = screen.getByRole("tab", { name: "Tab 2" });
    expect(tab2).toBeDisabled();

    await user.click(tab2);
    expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
  });

  it("supports controlled mode", () => {
    const handleValueChange = vi.fn();
    const { rerender } = render(
      <Tabs value="tab1" onValueChange={handleValueChange}>
        <TabsList aria-label="Tabs">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>,
    );

    expect(screen.getByText("Content 1")).toBeInTheDocument();

    rerender(
      <Tabs value="tab2" onValueChange={handleValueChange}>
        <TabsList aria-label="Tabs">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>,
    );

    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });

  it("applies custom className to TabsList", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-list" aria-label="Tabs">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>,
    );

    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveClass("custom-list");
  });

  it("applies custom className to TabsTrigger", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList aria-label="Tabs">
          <TabsTrigger value="tab1" className="custom-trigger">
            Tab 1
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>,
    );

    const tab = screen.getByRole("tab", { name: "Tab 1" });
    expect(tab).toHaveClass("custom-trigger");
  });

  it("applies custom className to TabsContent", () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList aria-label="Tabs">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="custom-content">
          Content 1
        </TabsContent>
      </Tabs>,
    );

    const content = container.querySelector(".custom-content");
    expect(content).toBeInTheDocument();
  });

  it("has proper ARIA attributes on tablist", () => {
    render(<TabsExample />);
    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveAttribute("aria-label", "Example tabs");
  });

  it("has proper ARIA controls attributes", () => {
    render(<TabsExample />);
    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    expect(tab1).toHaveAttribute("aria-controls");
  });
});
