import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";

describe("Drawer", () => {
  const DrawerExample = () => (
    <Drawer>
      <DrawerTrigger>Open Drawer</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Drawer Title</DrawerTitle>
          <DrawerDescription>This is a drawer description.</DrawerDescription>
        </DrawerHeader>
        <div>Drawer content goes here</div>
        <DrawerFooter>
          <DrawerClose>Close</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );

  describe("rendering", () => {
    it("renders trigger without crashing", () => {
      render(<DrawerExample />);
      expect(screen.getByRole("button", { name: "Open Drawer" })).toBeInTheDocument();
    });

    it("opens drawer when trigger is clicked", async () => {
      const user = userEvent.setup();
      render(<DrawerExample />);

      const trigger = screen.getByRole("button", { name: "Open Drawer" });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("displays drawer title", async () => {
      const user = userEvent.setup();
      render(<DrawerExample />);

      await user.click(screen.getByRole("button", { name: "Open Drawer" }));

      await waitFor(() => {
        expect(screen.getByText("Drawer Title")).toBeInTheDocument();
      });
    });

    it("displays drawer description", async () => {
      const user = userEvent.setup();
      render(<DrawerExample />);

      await user.click(screen.getByRole("button", { name: "Open Drawer" }));

      await waitFor(() => {
        expect(screen.getByText("This is a drawer description.")).toBeInTheDocument();
      });
    });

    it("displays drawer content", async () => {
      const user = userEvent.setup();
      render(<DrawerExample />);

      await user.click(screen.getByRole("button", { name: "Open Drawer" }));

      await waitFor(() => {
        expect(screen.getByText("Drawer content goes here")).toBeInTheDocument();
      });
    });
  });

  describe("accessibility", () => {
    it("has no accessibility violations when closed", async () => {
      const { container } = render(<DrawerExample />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no accessibility violations when open", async () => {
      const user = userEvent.setup();
      const { container } = render(<DrawerExample />);

      await user.click(screen.getByRole("button", { name: "Open Drawer" }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has proper ARIA attributes", async () => {
      const user = userEvent.setup();
      render(<DrawerExample />);

      await user.click(screen.getByRole("button", { name: "Open Drawer" }));

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveAttribute("aria-describedby");
        expect(dialog).toHaveAttribute("aria-labelledby");
      });
    });
  });

  describe("interactions", () => {
    it("supports controlled mode", async () => {
      const user = userEvent.setup();
      const handleOpenChange = vi.fn();
      const { rerender } = render(
        <Drawer open={false} onOpenChange={handleOpenChange}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerDescription>Description</DrawerDescription>
          </DrawerContent>
        </Drawer>,
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(handleOpenChange).toHaveBeenCalledWith(true);

      rerender(
        <Drawer open={true} onOpenChange={handleOpenChange}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerDescription>Description</DrawerDescription>
          </DrawerContent>
        </Drawer>,
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });
  });

  describe("custom className", () => {
    it("applies custom className to content", async () => {
      const user = userEvent.setup();
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent className="custom-drawer">
            <DrawerTitle>Title</DrawerTitle>
            <DrawerDescription>Description</DrawerDescription>
          </DrawerContent>
        </Drawer>,
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveClass("custom-drawer");
      });
    });
  });
});
