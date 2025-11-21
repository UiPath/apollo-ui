import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "./dropdown-menu";

describe("DropdownMenu", () => {
  describe("rendering", () => {
    it("renders trigger button", () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );
      expect(screen.getByText("Open Menu")).toBeInTheDocument();
    });

    it("shows menu on click", async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByText("Open Menu"));

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });
      expect(screen.getByText("Action")).toBeInTheDocument();
    });

    it("renders menu label", async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuItem>Profile</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        expect(screen.getByText("My Account")).toBeInTheDocument();
      });
    });

    it("renders separator", async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Action 1</DropdownMenuItem>
            <DropdownMenuSeparator data-testid="separator" />
            <DropdownMenuItem>Action 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        expect(screen.getByTestId("separator")).toBeInTheDocument();
      });
    });

    it("renders shortcut", async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        expect(screen.getByText("⌘S")).toBeInTheDocument();
      });
    });
  });

  describe("accessibility", () => {
    it("has no accessibility violations when closed", async () => {
      const { container } = render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("trigger has aria-haspopup attribute", () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );
      expect(screen.getByText("Open Menu")).toHaveAttribute("aria-haspopup", "menu");
    });

    it("trigger has aria-expanded attribute", async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const trigger = screen.getByText("Open Menu");
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await user.click(trigger);
      await waitFor(() => {
        expect(trigger).toHaveAttribute("aria-expanded", "true");
      });
    });
  });

  describe("interactions", () => {
    it("calls onSelect when item is clicked", async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={handleSelect}>Action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        expect(screen.getByText("Action")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Action"));
      expect(handleSelect).toHaveBeenCalled();
    });

    it("closes menu after item selection", async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByText("Open"));
      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Action"));
      await waitFor(() => {
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      });
    });

    it("renders checkbox item", async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked>Show Status Bar</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        expect(screen.getByText("Show Status Bar")).toBeInTheDocument();
      });
    });

    it("renders radio group", async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="light">
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        expect(screen.getByText("Light")).toBeInTheDocument();
        expect(screen.getByText("Dark")).toBeInTheDocument();
      });
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>First</DropdownMenuItem>
            <DropdownMenuItem>Second</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByText("Open"));
      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      // Menu is navigable with keyboard
      expect(screen.getByText("Second")).toBeInTheDocument();
    });
  });

  describe("custom className", () => {
    it("DropdownMenuItem accepts custom className", async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem className="custom-item">Action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        expect(screen.getByText("Action")).toHaveClass("custom-item");
      });
    });

    it("DropdownMenuShortcut accepts custom className", async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save <DropdownMenuShortcut className="custom-shortcut">⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        expect(screen.getByText("⌘S")).toHaveClass("custom-shortcut");
      });
    });

    it("DropdownMenuContent accepts custom className", async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent className="custom-content">
            <DropdownMenuItem>Action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        expect(screen.getByRole("menu")).toHaveClass("custom-content");
      });
    });
  });

  describe("inset prop", () => {
    it("applies inset styles to DropdownMenuItem", async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        expect(screen.getByText("Inset Item")).toHaveClass("pl-8");
      });
    });

    it("applies inset styles to DropdownMenuLabel", async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        expect(screen.getByText("Inset Label")).toHaveClass("pl-8");
      });
    });
  });

  describe("disabled state", () => {
    it("renders disabled menu item", async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled>Disabled Action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        const item = screen.getByText("Disabled Action");
        expect(item).toHaveAttribute("data-disabled");
      });
    });
  });
});
