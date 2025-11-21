import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "./context-menu";

describe("ContextMenu", () => {
  describe("rendering", () => {
    it("renders trigger element", () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Right click me</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Action</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>,
      );
      expect(screen.getByText("Right click me")).toBeInTheDocument();
    });

    it("shows menu on right click", async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Right click me</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Action</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>,
      );

      await user.pointer({
        keys: "[MouseRight]",
        target: screen.getByText("Right click me"),
      });

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });
      expect(screen.getByText("Action")).toBeInTheDocument();
    });

    it("renders menu label", async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>My Label</ContextMenuLabel>
            <ContextMenuItem>Action</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>,
      );

      await user.pointer({
        keys: "[MouseRight]",
        target: screen.getByText("Trigger"),
      });

      await waitFor(() => {
        expect(screen.getByText("My Label")).toBeInTheDocument();
      });
    });

    it("renders separator", async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Action 1</ContextMenuItem>
            <ContextMenuSeparator data-testid="separator" />
            <ContextMenuItem>Action 2</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>,
      );

      await user.pointer({
        keys: "[MouseRight]",
        target: screen.getByText("Trigger"),
      });

      await waitFor(() => {
        expect(screen.getByTestId("separator")).toBeInTheDocument();
      });
    });

    it("renders shortcut", async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              Copy <ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>,
      );

      await user.pointer({
        keys: "[MouseRight]",
        target: screen.getByText("Trigger"),
      });

      await waitFor(() => {
        expect(screen.getByText("⌘C")).toBeInTheDocument();
      });
    });
  });

  describe("accessibility", () => {
    it("has no accessibility violations when closed", async () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Right click me</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Action</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("interactions", () => {
    it("calls onSelect when item is clicked", async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={handleSelect}>Action</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>,
      );

      await user.pointer({
        keys: "[MouseRight]",
        target: screen.getByText("Trigger"),
      });

      await waitFor(() => {
        expect(screen.getByText("Action")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Action"));
      expect(handleSelect).toHaveBeenCalled();
    });

    it("renders checkbox item", async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem checked>Show Toolbar</ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>,
      );

      await user.pointer({
        keys: "[MouseRight]",
        target: screen.getByText("Trigger"),
      });

      await waitFor(() => {
        expect(screen.getByText("Show Toolbar")).toBeInTheDocument();
      });
    });

    it("renders radio group", async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup value="small">
              <ContextMenuRadioItem value="small">Small</ContextMenuRadioItem>
              <ContextMenuRadioItem value="large">Large</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>,
      );

      await user.pointer({
        keys: "[MouseRight]",
        target: screen.getByText("Trigger"),
      });

      await waitFor(() => {
        expect(screen.getByText("Small")).toBeInTheDocument();
        expect(screen.getByText("Large")).toBeInTheDocument();
      });
    });
  });

  describe("custom className", () => {
    it("ContextMenuItem accepts custom className", async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem className="custom-item">Action</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>,
      );

      await user.pointer({
        keys: "[MouseRight]",
        target: screen.getByText("Trigger"),
      });

      await waitFor(() => {
        expect(screen.getByText("Action")).toHaveClass("custom-item");
      });
    });

    it("ContextMenuShortcut accepts custom className", async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              Copy <ContextMenuShortcut className="custom-shortcut">⌘C</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>,
      );

      await user.pointer({
        keys: "[MouseRight]",
        target: screen.getByText("Trigger"),
      });

      await waitFor(() => {
        expect(screen.getByText("⌘C")).toHaveClass("custom-shortcut");
      });
    });
  });

  describe("inset prop", () => {
    it("applies inset styles to ContextMenuItem", async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem inset>Inset Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>,
      );

      await user.pointer({
        keys: "[MouseRight]",
        target: screen.getByText("Trigger"),
      });

      await waitFor(() => {
        expect(screen.getByText("Inset Item")).toHaveClass("pl-8");
      });
    });

    it("applies inset styles to ContextMenuLabel", async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel inset>Inset Label</ContextMenuLabel>
          </ContextMenuContent>
        </ContextMenu>,
      );

      await user.pointer({
        keys: "[MouseRight]",
        target: screen.getByText("Trigger"),
      });

      await waitFor(() => {
        expect(screen.getByText("Inset Label")).toHaveClass("pl-8");
      });
    });
  });
});
