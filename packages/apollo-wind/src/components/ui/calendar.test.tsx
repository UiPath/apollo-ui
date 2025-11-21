import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { Calendar } from "./calendar";

describe("Calendar", () => {
  describe("rendering", () => {
    it("renders calendar", () => {
      render(<Calendar />);
      expect(screen.getByRole("grid")).toBeInTheDocument();
    });

    it("renders with current month", () => {
      render(<Calendar />);
      const currentMonth = new Date().toLocaleString("default", { month: "long" });
      expect(screen.getByText(new RegExp(currentMonth))).toBeInTheDocument();
    });

    it("renders navigation buttons", () => {
      render(<Calendar />);
      expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    });

    it("renders weekday headers", () => {
      render(<Calendar />);
      expect(screen.getByText("Su")).toBeInTheDocument();
      expect(screen.getByText("Mo")).toBeInTheDocument();
    });

    it("renders day buttons", () => {
      render(<Calendar />);
      // Day buttons are in the grid
      expect(screen.getByRole("grid")).toBeInTheDocument();
      expect(screen.getByText("15")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has no accessibility violations", async () => {
      const { container } = render(<Calendar />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no violations with selected date", async () => {
      const { container } = render(<Calendar mode="single" selected={new Date()} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("interactions", () => {
    it("navigates to previous month", async () => {
      const user = userEvent.setup();
      render(<Calendar defaultMonth={new Date(2024, 5, 15)} />);

      expect(screen.getByText(/June/)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /previous/i }));

      expect(screen.getByText(/May/)).toBeInTheDocument();
    });

    it("navigates to next month", async () => {
      const user = userEvent.setup();
      render(<Calendar defaultMonth={new Date(2024, 5, 15)} />);

      expect(screen.getByText(/June/)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /next/i }));

      expect(screen.getByText(/July/)).toBeInTheDocument();
    });

    it("calls onSelect when day is clicked in single mode", async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();
      render(
        <Calendar mode="single" defaultMonth={new Date(2024, 5, 1)} onSelect={handleSelect} />,
      );

      await user.click(screen.getByText("15"));

      expect(handleSelect).toHaveBeenCalled();
    });
  });

  describe("modes", () => {
    it("supports single selection mode", () => {
      render(
        <Calendar
          mode="single"
          selected={new Date(2024, 5, 15)}
          defaultMonth={new Date(2024, 5, 1)}
        />,
      );
      // The selected day should be marked with data-selected
      const selectedCell = screen.getByText("15").closest("[data-selected]");
      expect(selectedCell).toHaveAttribute("data-selected", "true");
    });

    it("supports range selection mode", () => {
      render(
        <Calendar
          mode="range"
          selected={{
            from: new Date(2024, 5, 10),
            to: new Date(2024, 5, 15),
          }}
          defaultMonth={new Date(2024, 5, 1)}
        />,
      );
      expect(screen.getByRole("grid")).toBeInTheDocument();
    });
  });

  describe("props", () => {
    it("respects showOutsideDays prop", () => {
      const { rerender } = render(
        <Calendar showOutsideDays={true} defaultMonth={new Date(2024, 5, 1)} />,
      );
      // With showOutsideDays, days from adjacent months are visible
      expect(screen.getByRole("grid")).toBeInTheDocument();

      rerender(<Calendar showOutsideDays={false} defaultMonth={new Date(2024, 5, 1)} />);
      expect(screen.getByRole("grid")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(<Calendar className="custom-calendar" />);
      expect(container.querySelector(".custom-calendar")).toBeInTheDocument();
    });

    it("respects disabled dates", () => {
      render(
        <Calendar
          mode="single"
          defaultMonth={new Date(2024, 5, 1)}
          disabled={[new Date(2024, 5, 15)]}
        />,
      );
      const disabledDay = screen.getByText("15").closest("button");
      expect(disabledDay).toBeDisabled();
    });
  });

  describe("buttonVariant prop", () => {
    it("accepts different button variants", () => {
      const { container } = render(<Calendar buttonVariant="outline" />);
      expect(container.querySelector("[data-slot='calendar']")).toBeInTheDocument();
    });
  });
});
