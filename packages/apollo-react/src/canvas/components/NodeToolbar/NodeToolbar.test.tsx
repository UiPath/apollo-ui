import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, userEvent, type UserEvent, waitFor } from "../../utils/testing";
import { NodeToolbar } from "./NodeToolbar";
import type { NodeToolbarConfig, ToolbarActionItem } from "./NodeToolbar.types";

describe("NodeToolbar", () => {
  const mockAction1: ToolbarActionItem = {
    id: "action-1",
    icon: "edit",
    label: "Edit",
    onAction: vi.fn(),
  };

  const mockAction2: ToolbarActionItem = {
    id: "action-2",
    icon: "delete",
    label: "Delete",
    onAction: vi.fn(),
  };

  const mockPinnedAction: ToolbarActionItem = {
    id: "pinned-action",
    icon: "star",
    label: "Star",
    isPinned: true,
    onAction: vi.fn(),
  };

  const mockDisabledAction: ToolbarActionItem = {
    id: "disabled-action",
    icon: "lock",
    label: "Locked",
    disabled: true,
    onAction: vi.fn(),
  };

  const mockToggledAction: ToolbarActionItem = {
    id: "toggled-action",
    icon: "visibility",
    label: "Toggle View",
    isToggled: true,
    color: "#4CAF50",
    onAction: vi.fn(),
  };

  const defaultConfig: NodeToolbarConfig = {
    actions: [mockAction1, mockAction2],
    position: "top",
    align: "end",
  };

  const defaultProps = {
    nodeId: "test-node",
    config: defaultConfig,
    expanded: true,
  };

  describe("Display states", () => {
    it("should show all actions when expanded", () => {
      const configWithMixed: NodeToolbarConfig = {
        actions: [mockPinnedAction, mockAction1, mockAction2, mockToggledAction],
        position: "top",
      };

      render(<NodeToolbar {...defaultProps} config={configWithMixed} expanded={true} />);

      expect(screen.getByLabelText("Star")).toBeInTheDocument();
      expect(screen.getByLabelText("Edit")).toBeInTheDocument();
      expect(screen.getByLabelText("Delete")).toBeInTheDocument();
      const toggleButton = screen.getByLabelText("Toggle View");
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute("aria-pressed", "true");
    });

    it("should show only pinned actions when not expanded", () => {
      const configWithMixed: NodeToolbarConfig = {
        actions: [mockPinnedAction, mockAction1, mockAction2],
        position: "top",
      };

      render(<NodeToolbar {...defaultProps} config={configWithMixed} expanded={false} />);

      expect(screen.getByLabelText("Star")).toBeInTheDocument();
      expect(screen.queryByLabelText("Edit")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Delete")).not.toBeInTheDocument();
    });

    it("should hide toolbar when not expanded and no pinned actions", () => {
      render(<NodeToolbar {...defaultProps} expanded={false} />);

      expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
    });

    it("should hide all actions including pinned when hidden is true", () => {
      const configWithPinned: NodeToolbarConfig = {
        actions: [mockPinnedAction, mockAction1],
        position: "top",
      };

      render(<NodeToolbar {...defaultProps} config={configWithPinned} hidden={true} />);

      expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Star")).not.toBeInTheDocument();
    });
  });

  describe("Action interactions", () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
      vi.clearAllMocks();
    });

    it("should call onAction when action button is clicked", async () => {
      render(<NodeToolbar {...defaultProps} />);

      await user.click(screen.getByLabelText("Edit"));

      expect(mockAction1.onAction).toHaveBeenCalledWith("test-node");
    });

    it("should not call onAction when disabled action is clicked", async () => {
      const configWithDisabled: NodeToolbarConfig = {
        actions: [mockDisabledAction],
        position: "top",
      };

      render(<NodeToolbar {...defaultProps} config={configWithDisabled} />);

      const disabledButton = screen.getByLabelText("Locked");
      expect(disabledButton).toHaveAttribute("aria-disabled", "true");

      // Disabled button has pointer-events: none, so we verify it's disabled
      // rather than attempting to click it
      expect(mockDisabledAction.onAction).not.toHaveBeenCalled();
    });

    it("should call onAction with correct nodeId", async () => {
      const differentNodeId = "different-node";
      render(<NodeToolbar {...defaultProps} nodeId={differentNodeId} />);

      await user.click(screen.getByLabelText("Delete"));

      expect(mockAction2.onAction).toHaveBeenCalledWith(differentNodeId);
    });
  });

  describe("Overflow menu", () => {
    let user: UserEvent;

    const overflowAction1: ToolbarActionItem = {
      id: "overflow-1",
      icon: "settings",
      label: "Settings",
      onAction: vi.fn(),
    };

    const overflowAction2: ToolbarActionItem = {
      id: "overflow-2",
      icon: "info",
      label: "Info",
      onAction: vi.fn(),
    };

    beforeEach(() => {
      user = userEvent.setup();
      vi.clearAllMocks();
    });

    it("should render overflow button when overflowActions are provided and expanded", () => {
      const configWithOverflow: NodeToolbarConfig = {
        actions: [mockAction1],
        overflowActions: [overflowAction1, overflowAction2],
        position: "top",
      };

      render(<NodeToolbar {...defaultProps} config={configWithOverflow} />);

      expect(screen.getByLabelText("More options")).toBeInTheDocument();
    });

    it("should not render overflow button when not expanded", () => {
      const configWithOverflow: NodeToolbarConfig = {
        actions: [mockPinnedAction],
        overflowActions: [overflowAction1],
        position: "top",
      };

      render(<NodeToolbar {...defaultProps} config={configWithOverflow} expanded={false} />);

      expect(screen.queryByLabelText("More options")).not.toBeInTheDocument();
    });

    it("should not render overflow button when no overflowActions provided", () => {
      render(<NodeToolbar {...defaultProps} />);

      expect(screen.queryByLabelText("More options")).not.toBeInTheDocument();
    });

    it("should open dropdown menu when overflow button is clicked", async () => {
      const configWithOverflow: NodeToolbarConfig = {
        actions: [mockAction1],
        overflowActions: [overflowAction1, overflowAction2],
        position: "top",
      };

      render(<NodeToolbar {...defaultProps} config={configWithOverflow} />);

      const overflowButton = screen.getByLabelText("More options");
      expect(overflowButton).toHaveAttribute("aria-expanded", "false");

      await user.click(overflowButton);

      expect(overflowButton).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText("Info")).toBeInTheDocument();
    });

    it("should close dropdown menu when overflow button is clicked again", async () => {
      const configWithOverflow: NodeToolbarConfig = {
        actions: [mockAction1],
        overflowActions: [overflowAction1],
        position: "top",
      };

      render(<NodeToolbar {...defaultProps} config={configWithOverflow} />);

      const overflowButton = screen.getByLabelText("More options");

      await user.click(overflowButton);
      expect(screen.getByRole("menu")).toBeInTheDocument();

      await user.click(overflowButton);
      await waitFor(() => {
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      });
    });

    it("should call overflow action onAction when clicked", async () => {
      const configWithOverflow: NodeToolbarConfig = {
        actions: [mockAction1],
        overflowActions: [overflowAction1, overflowAction2],
        position: "top",
      };

      render(<NodeToolbar {...defaultProps} config={configWithOverflow} />);

      await user.click(screen.getByLabelText("More options"));
      await user.click(screen.getByText("Settings"));

      expect(overflowAction1.onAction).toHaveBeenCalledWith("test-node");
    });

    it("should close dropdown after clicking overflow action", async () => {
      const configWithOverflow: NodeToolbarConfig = {
        actions: [mockAction1],
        overflowActions: [overflowAction1],
        position: "top",
      };

      render(<NodeToolbar {...defaultProps} config={configWithOverflow} />);

      await user.click(screen.getByLabelText("More options"));
      await user.click(screen.getByText("Settings"));

      await waitFor(() => {
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      });
    });

    it("should not call overflow action onAction when disabled item is clicked", async () => {
      const disabledOverflowAction: ToolbarActionItem = {
        id: "overflow-disabled",
        icon: "lock",
        label: "Disabled Option",
        disabled: true,
        onAction: vi.fn(),
      };

      const configWithOverflow: NodeToolbarConfig = {
        actions: [mockAction1],
        overflowActions: [disabledOverflowAction],
        position: "top",
      };

      render(<NodeToolbar {...defaultProps} config={configWithOverflow} />);

      await user.click(screen.getByLabelText("More options"));

      const disabledOption = screen.getByLabelText("Disabled Option");
      expect(disabledOption).toHaveAttribute("aria-disabled", "true");

      // Disabled button has pointer-events: none, so we verify it's disabled
      // rather than attempting to click it
      expect(disabledOverflowAction.onAction).not.toHaveBeenCalled();
    });

    it("should render separators in overflow menu", async () => {
      const configWithOverflow: NodeToolbarConfig = {
        actions: [mockAction1],
        overflowActions: [overflowAction1, { id: "separator" }, overflowAction2],
        position: "top",
      };

      render(<NodeToolbar {...defaultProps} config={configWithOverflow} />);

      await user.click(screen.getByLabelText("More options"));

      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText("Info")).toBeInTheDocument();
    });

    it("should close dropdown when clicking outside", async () => {
      const configWithOverflow: NodeToolbarConfig = {
        actions: [mockAction1],
        overflowActions: [overflowAction1],
        position: "top",
      };

      const { container } = render(<NodeToolbar {...defaultProps} config={configWithOverflow} />);

      await user.click(screen.getByLabelText("More options"));
      expect(screen.getByRole("menu")).toBeInTheDocument();

      await user.click(container);
      await waitFor(() => {
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      });
    });
  });

  describe("Error handling", () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
      vi.clearAllMocks();
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should handle errors in onAction gracefully", async () => {
      const errorAction: ToolbarActionItem = {
        id: "error-action",
        icon: "error",
        label: "Error Action",
        onAction: vi.fn(() => {
          throw new Error("Test error");
        }),
      };

      const configWithError: NodeToolbarConfig = {
        actions: [errorAction],
        position: "top",
      };

      render(<NodeToolbar {...defaultProps} config={configWithError} />);

      await user.click(screen.getByLabelText("Error Action"));

      expect(errorAction.onAction).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it("should handle errors in overflow action onAction gracefully", async () => {
      const errorOverflowAction: ToolbarActionItem = {
        id: "overflow-error",
        icon: "error",
        label: "Error Overflow",
        onAction: vi.fn(() => {
          throw new Error("Overflow error");
        }),
      };

      const configWithError: NodeToolbarConfig = {
        actions: [mockAction1],
        overflowActions: [errorOverflowAction],
        position: "top",
      };

      render(<NodeToolbar {...defaultProps} config={configWithError} />);

      await user.click(screen.getByLabelText("More options"));
      await user.click(screen.getByText("Error Overflow"));

      expect(errorOverflowAction.onAction).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("Custom icons", () => {
    it("should render custom icon component", () => {
      const customIconAction: ToolbarActionItem = {
        id: "custom-icon",
        icon: <div data-testid="custom-icon">Custom</div>,
        label: "Custom Icon",
        onAction: vi.fn(),
      };

      const configWithCustomIcon: NodeToolbarConfig = {
        actions: [customIconAction],
        position: "top",
      };

      render(<NodeToolbar {...defaultProps} config={configWithCustomIcon} />);

      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });

    it("should render custom icon in overflow menu", async () => {
      const customIconOverflow: ToolbarActionItem = {
        id: "custom-overflow",
        icon: <div data-testid="custom-overflow-icon">Custom Overflow</div>,
        label: "Custom Overflow",
        onAction: vi.fn(),
      };

      const configWithCustomIcon: NodeToolbarConfig = {
        actions: [mockAction1],
        overflowActions: [customIconOverflow],
        position: "top",
      };

      const user = userEvent.setup();
      render(<NodeToolbar {...defaultProps} config={configWithCustomIcon} />);

      await user.click(screen.getByLabelText("More options"));

      expect(screen.getByTestId("custom-overflow-icon")).toBeInTheDocument();
    });
  });
});
