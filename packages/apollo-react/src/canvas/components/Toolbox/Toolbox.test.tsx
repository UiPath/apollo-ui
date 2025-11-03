import { describe, expect, it, vi } from "vitest";
import { render, screen, userEvent, type UserEvent } from "../../utils/testing";
import type { ListItem } from "./ListView";
import { Toolbox } from "./Toolbox";

describe("Toolbox", () => {
  const mockItems: ListItem[] = [
    {
      id: "item-1",
      name: "Item 1",
      data: { value: "data-1" },
      icon: { name: "star" },
    },
    {
      id: "item-2",
      name: "Item 2",
      data: { value: "data-2" },
      icon: { name: "favorite" },
      children: [
        {
          id: "child-1",
          name: "Child 1",
          data: { value: "child-data-1" },
          icon: { name: "child_care" },
        },
      ],
    },
  ];

  const defaultProps = {
    title: "Test Toolbox",
    initialItems: mockItems,
    onClose: vi.fn(),
    onItemSelect: vi.fn(),
  };

  describe("Rendering", () => {
    it("should render title correctly", () => {
      render(<Toolbox {...defaultProps} />);

      expect(screen.getByText("Test Toolbox")).toBeInTheDocument();
    });

    it("should render search box", () => {
      render(<Toolbox {...defaultProps} />);

      expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    });

    it("should render all items in ListView", () => {
      render(<Toolbox {...defaultProps} />);

      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });

    it("should pass loading state to ListView", () => {
      render(<Toolbox {...defaultProps} loading={true} />);

      // ListView items should be disabled when loading
      const items = screen.getAllByRole("button");

      for (const item of items) {
        expect(item).toBeDisabled();
      }
    });
  });

  describe("Navigation", () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it("should not show back button initially", () => {
      render(<Toolbox {...defaultProps} />);

      expect(screen.queryByRole("button", { name: /back/i })).not.toBeInTheDocument();
    });

    it("should navigate to children when item with children is clicked", async () => {
      render(<Toolbox {...defaultProps} />);

      await user.click(screen.getByText("Item 2"));

      // Should show child item
      expect(screen.getByText("Child 1")).toBeInTheDocument();
      // Should update title
      expect(screen.getByText("Item 2")).toBeInTheDocument();
      // Parent items should not be visible
      expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
    });

    it("should show back button after navigating to children", async () => {
      render(<Toolbox {...defaultProps} />);

      await user.click(screen.getByText("Item 2"));

      expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
    });

    it("should navigate back to parent when back button is clicked", async () => {
      render(<Toolbox {...defaultProps} />);

      // Navigate to children
      await user.click(screen.getByText("Item 2"));

      // Click back button
      await user.click(screen.getByRole("button", { name: /back/i }));

      // Should show parent items again
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
      // Should update title back to original
      expect(screen.getByText("Test Toolbox")).toBeInTheDocument();
    });

    it("should call onItemSelect when item without children is clicked", async () => {
      const onItemSelect = vi.fn();
      render(<Toolbox {...defaultProps} onItemSelect={onItemSelect} />);

      await user.click(screen.getByText("Item 1"));

      expect(onItemSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "item-1",
          name: "Item 1",
        })
      );
    });

    it("should not call onItemSelect when item with children is clicked", async () => {
      const onItemSelect = vi.fn();
      render(<Toolbox {...defaultProps} onItemSelect={onItemSelect} />);

      await user.click(screen.getByText("Item 2"));

      expect(onItemSelect).not.toHaveBeenCalled();
    });
  });

  describe("Search", () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it("should show empty state when no items match search", async () => {
      render(<Toolbox {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search");

      await user.type(searchInput, "NonExistent");

      expect(screen.getByText("No matching nodes found")).toBeInTheDocument();
    });

    it("should clear search when input is cleared", async () => {
      render(<Toolbox {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search");

      // Type search query
      await user.type(searchInput, "1");

      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Child 1")).toBeInTheDocument();

      // Clear search
      await user.clear(searchInput);

      // Should show all items again
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });

    it("should search nested children", async () => {
      render(<Toolbox {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search");

      await user.type(searchInput, "Child");

      expect(screen.getByText("Child 1")).toBeInTheDocument();

      // Should not show parent that doesn't match
      expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
    });

    it("should disable sections during search", async () => {
      const itemsWithSections: ListItem[] = [
        {
          id: "item-1",
          name: "Item 1",
          data: {},
          section: "Section A",
        },
        {
          id: "item-2",
          name: "Item 2",
          data: {},
          section: "Section B",
        },
      ];

      render(<Toolbox {...defaultProps} initialItems={itemsWithSections} />);

      const searchInput = screen.getByPlaceholderText("Search");

      await user.type(searchInput, "Item");

      // Wait for search to complete
      expect(screen.getByText("Item 1")).toBeInTheDocument();

      // Sections should not be visible during search
      expect(screen.queryByText("Section A")).not.toBeInTheDocument();
      expect(screen.queryByText("Section B")).not.toBeInTheDocument();
    });

    it("should use custom onSearch function if provided", async () => {
      const onSearch = vi.fn().mockResolvedValue([
        {
          id: "custom-result",
          name: "Custom Result",
          data: {},
        },
      ]);

      render(<Toolbox {...defaultProps} onSearch={onSearch} />);

      const searchInput = screen.getByPlaceholderText("Search");

      await user.type(searchInput, "custom");

      expect(screen.getByText("Custom Result")).toBeInTheDocument();
    });

    it("should clear search when Escape is pressed during search", async () => {
      render(<Toolbox {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search");

      // Type search query
      await user.type(searchInput, "Item 1");

      expect(screen.getByText("Item 1")).toBeInTheDocument();

      // Press Escape
      await user.keyboard("{Escape}");

      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });
  });

  describe("Keyboard shortcuts", () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it("should close toolbox when Escape is pressed at root level", async () => {
      const onClose = vi.fn();
      render(<Toolbox {...defaultProps} onClose={onClose} />);

      await user.keyboard("{Escape}");

      expect(onClose).toHaveBeenCalled();
    });

    it("should navigate back when Escape is pressed in nested view", async () => {
      const onClose = vi.fn();
      render(<Toolbox {...defaultProps} onClose={onClose} />);

      // Navigate to children
      await user.click(screen.getByText("Item 2"));

      // Press Escape
      await user.keyboard("{Escape}");

      // Should navigate back, not close
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("Callbacks", () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it("should call onBack callback when navigating back", async () => {
      const onBack = vi.fn();
      render(<Toolbox {...defaultProps} onBack={onBack} />);

      // Navigate to children
      await user.click(screen.getByText("Item 2"));

      // Click back
      await user.click(screen.getByRole("button", { name: /back/i }));

      expect(onBack).toHaveBeenCalled();
    });
  });
});
