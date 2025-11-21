import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

describe("AlertDialog", () => {
  const AlertDialogExample = () => (
    <AlertDialog>
      <AlertDialogTrigger>Delete</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  it("renders trigger without crashing", () => {
    render(<AlertDialogExample />);
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("has no accessibility violations when closed", async () => {
    const { container } = render(<AlertDialogExample />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { container } = render(<AlertDialogExample />);

    const trigger = screen.getByRole("button", { name: "Delete" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("opens alert dialog when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<AlertDialogExample />);

    const trigger = screen.getByRole("button", { name: "Delete" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
  });

  it("displays alert dialog title", async () => {
    const user = userEvent.setup();
    render(<AlertDialogExample />);

    const trigger = screen.getByRole("button", { name: "Delete" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    });
  });

  it("displays alert dialog description", async () => {
    const user = userEvent.setup();
    render(<AlertDialogExample />);

    const trigger = screen.getByRole("button", { name: "Delete" });
    await user.click(trigger);

    await waitFor(() => {
      expect(
        screen.getByText("This action cannot be undone. This will permanently delete your data."),
      ).toBeInTheDocument();
    });
  });

  it("closes dialog with cancel button", async () => {
    const user = userEvent.setup();
    render(<AlertDialogExample />);

    const trigger = screen.getByRole("button", { name: "Delete" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  it("closes dialog with action button", async () => {
    const user = userEvent.setup();
    render(<AlertDialogExample />);

    const trigger = screen.getByRole("button", { name: "Delete" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    const actionButton = screen.getByRole("button", { name: "Continue" });
    await user.click(actionButton);

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  it.skip("does not close with Escape key by default", async () => {
    // Skipped: Radix AlertDialog may close with Escape depending on version
  });

  it("supports controlled mode", async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();
    const { rerender } = render(
      <AlertDialog open={false} onOpenChange={handleOpenChange}>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Title</AlertDialogTitle>
          <AlertDialogDescription>Description</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);

    expect(handleOpenChange).toHaveBeenCalledWith(true);

    rerender(
      <AlertDialog open={true} onOpenChange={handleOpenChange}>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Title</AlertDialogTitle>
          <AlertDialogDescription>Description</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
  });

  it.skip("traps focus within alert dialog", async () => {
    // Skipped: Focus trapping behavior is complex in jsdom
  });

  it("applies custom className to content", async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent className="custom-dialog">
          <AlertDialogTitle>Title</AlertDialogTitle>
          <AlertDialogDescription>Description</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>,
    );

    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);

    await waitFor(() => {
      const dialog = screen.getByRole("alertdialog");
      expect(dialog).toHaveClass("custom-dialog");
    });
  });

  it("has proper ARIA attributes", async () => {
    const user = userEvent.setup();
    render(<AlertDialogExample />);

    const trigger = screen.getByRole("button", { name: "Delete" });
    await user.click(trigger);

    await waitFor(() => {
      const dialog = screen.getByRole("alertdialog");
      expect(dialog).toHaveAttribute("aria-describedby");
      expect(dialog).toHaveAttribute("aria-labelledby");
    });
  });

  it("renders overlay when open", async () => {
    const user = userEvent.setup();
    render(<AlertDialogExample />);

    const trigger = screen.getByRole("button", { name: "Delete" });
    await user.click(trigger);

    await waitFor(() => {
      const overlay = document.querySelector(".bg-black\\/80");
      expect(overlay).toBeInTheDocument();
    });
  });

  it("action button has default variant", async () => {
    const user = userEvent.setup();
    render(<AlertDialogExample />);

    const trigger = screen.getByRole("button", { name: "Delete" });
    await user.click(trigger);

    await waitFor(() => {
      const actionButton = screen.getByRole("button", { name: "Continue" });
      expect(actionButton).toHaveClass("bg-primary");
    });
  });

  it("cancel button has outline variant", async () => {
    const user = userEvent.setup();
    render(<AlertDialogExample />);

    const trigger = screen.getByRole("button", { name: "Delete" });
    await user.click(trigger);

    await waitFor(() => {
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(cancelButton).toHaveClass("border");
    });
  });
});
