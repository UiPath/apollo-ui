import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";

const TestHoverCard = ({ contentClassName }: { contentClassName?: string }) => (
  <HoverCard>
    <HoverCardTrigger>Hover me</HoverCardTrigger>
    <HoverCardContent className={contentClassName}>Card content</HoverCardContent>
  </HoverCard>
);

describe("HoverCard", () => {
  describe("Rendering", () => {
    it("renders trigger element", () => {
      render(<TestHoverCard />);
      expect(screen.getByText("Hover me")).toBeInTheDocument();
    });

    it("does not render content initially", () => {
      render(<TestHoverCard />);
      expect(screen.queryByText("Card content")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has no accessibility violations when closed", async () => {
      const { container } = render(<TestHoverCard />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Props", () => {
    it("applies custom className to content", async () => {
      const user = userEvent.setup();
      render(<TestHoverCard contentClassName="custom-content" />);

      await user.hover(screen.getByText("Hover me"));
      await waitFor(() => {
        const content = screen.getByText("Card content");
        expect(content.closest("[data-state]")).toHaveClass("custom-content");
      });
    });

    it("renders with custom align", async () => {
      const user = userEvent.setup();
      render(
        <HoverCard>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent align="start">Content</HoverCardContent>
        </HoverCard>,
      );

      await user.hover(screen.getByText("Trigger"));
      await waitFor(() => {
        expect(screen.getByText("Content")).toBeInTheDocument();
      });
    });

    it("renders with custom sideOffset", async () => {
      const user = userEvent.setup();
      render(
        <HoverCard>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent sideOffset={10}>Content</HoverCardContent>
        </HoverCard>,
      );

      await user.hover(screen.getByText("Trigger"));
      await waitFor(() => {
        expect(screen.getByText("Content")).toBeInTheDocument();
      });
    });
  });

  describe("Interactions", () => {
    it("shows content on hover", async () => {
      const user = userEvent.setup();
      render(<TestHoverCard />);

      await user.hover(screen.getByText("Hover me"));
      await waitFor(() => {
        expect(screen.getByText("Card content")).toBeInTheDocument();
      });
    });

    it("hides content on unhover", async () => {
      const user = userEvent.setup();
      render(<TestHoverCard />);

      await user.hover(screen.getByText("Hover me"));
      await waitFor(() => {
        expect(screen.getByText("Card content")).toBeInTheDocument();
      });

      await user.unhover(screen.getByText("Hover me"));
      await waitFor(() => {
        expect(screen.queryByText("Card content")).not.toBeInTheDocument();
      });
    });
  });

  describe("Controlled", () => {
    it("can be controlled with open prop", () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>,
      );

      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("stays closed when open is false", async () => {
      const user = userEvent.setup();
      render(
        <HoverCard open={false}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>,
      );

      await user.hover(screen.getByText("Trigger"));
      expect(screen.queryByText("Content")).not.toBeInTheDocument();
    });
  });
});
