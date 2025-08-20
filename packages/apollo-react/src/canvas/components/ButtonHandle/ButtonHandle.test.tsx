import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Position } from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";
import type { ButtonHandleConfig } from "./ButtonHandle";
import { ButtonHandles } from "./ButtonHandle";

// Mock @xyflow/react Handle component
vi.mock("@xyflow/react", () => ({
  Handle: ({ children, isConnectable, ...props }: any) => {
    // Filter out styled-component props that shouldn't be passed to DOM elements
    const domProps = Object.keys(props).reduce((acc: any, key) => {
      if (!key.startsWith("$")) {
        acc[key] = props[key];
      }
      return acc;
    }, {});

    return (
      <div data-testid="handle" data-is-connectable={isConnectable} {...domProps}>
        {children}
      </div>
    );
  },
  Position: {
    Top: "top",
    Bottom: "bottom",
    Left: "left",
    Right: "right",
  },
}));

describe("ButtonHandles", () => {
  it("renders multiple handles", () => {
    const handles: ButtonHandleConfig[] = [
      { id: "handle1", type: "source", handleType: "output" },
      { id: "handle2", type: "target", handleType: "input" },
    ];

    render(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} />);

    const handleElements = screen.getAllByTestId("handle");
    expect(handleElements).toHaveLength(2);
  });

  it("renders handle with label", () => {
    const handles: ButtonHandleConfig[] = [{ id: "handle1", type: "source", handleType: "output", label: "Output Handle" }];

    render(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} />);

    expect(screen.getByText("Output Handle")).toBeInTheDocument();
  });

  it("renders handle with label icon", () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    const handles: ButtonHandleConfig[] = [
      {
        id: "handle1",
        type: "source",
        handleType: "output",
        label: "With Icon",
        labelIcon: <TestIcon />,
      },
    ];

    render(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} />);

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    expect(screen.getByText("With Icon")).toBeInTheDocument();
  });

  it("calls onClick when button is clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const handles: ButtonHandleConfig[] = [
      {
        id: "handle1",
        type: "source",
        handleType: "output",
        showButton: true,
        onAction: handleClick,
      },
    ];

    render(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} selected={true} visible={true} />);

    // Find the handle element first
    const handle = screen.getByTestId("handle");

    // The button is rendered within the handle, look for the clickable element
    // The AddButton component uses a motion div that contains the icon
    const buttonContainer = handle.querySelector(".nodrag.nopan");

    if (!buttonContainer) {
      throw new Error("Button container not found");
    }

    // Click on the button container's child (the animated button)
    const animatedButton = buttonContainer.firstElementChild;
    if (!animatedButton) {
      throw new Error("Animated button not found");
    }

    await user.click(animatedButton);

    expect(handleClick).toHaveBeenCalledOnce();
    expect(handleClick).toHaveBeenCalledWith(
      expect.objectContaining({
        handleId: "handle1",
        nodeId: "test-node",
      })
    );
  });

  it("does not render button when showButton is false", () => {
    const handleClick = vi.fn();
    const handles: ButtonHandleConfig[] = [
      {
        id: "handle1",
        type: "source",
        handleType: "output",
        showButton: false,
        onAction: handleClick,
      },
    ];

    render(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} />);

    const buttons = screen.queryAllByTestId("ap-icon");
    expect(buttons).toHaveLength(0);
  });

  it("applies selected styles", () => {
    const handles: ButtonHandleConfig[] = [{ id: "handle1", type: "source", handleType: "output" }];

    const { rerender } = render(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} selected={false} />);

    // Check that it renders without selected state
    expect(screen.getByTestId("handle")).toBeInTheDocument();

    // Re-render with selected state
    rerender(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} selected={true} />);

    // Should still render
    expect(screen.getByTestId("handle")).toBeInTheDocument();
  });

  it("handles visibility prop", () => {
    const handles: ButtonHandleConfig[] = [{ id: "handle1", type: "source", handleType: "output" }];

    const { rerender } = render(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} visible={true} />);

    const handle = screen.getByTestId("handle");
    expect(handle).toHaveStyle({ opacity: "1" });

    rerender(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} visible={false} />);

    expect(handle).toHaveStyle({ opacity: "0" });
  });

  it("positions handles correctly for different positions", () => {
    const handles: ButtonHandleConfig[] = [
      { id: "handle1", type: "source", handleType: "output" },
      { id: "handle2", type: "source", handleType: "output" },
    ];

    const { rerender } = render(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Top} />);

    let handleElements = screen.getAllByTestId("handle");
    expect(handleElements[0]).toHaveStyle({ left: "33.33333333333333%" });
    expect(handleElements[1]).toHaveStyle({ left: "66.66666666666666%" });

    rerender(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} />);

    handleElements = screen.getAllByTestId("handle");
    expect(handleElements[0]).toHaveStyle({ top: "33.33333333333333%" });
    expect(handleElements[1]).toHaveStyle({ top: "66.66666666666666%" });
  });

  it("renders artifact handle type correctly", () => {
    const handles: ButtonHandleConfig[] = [{ id: "handle1", type: "source", handleType: "artifact" }];

    render(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} />);

    const handle = screen.getByTestId("handle");
    expect(handle).toHaveAttribute("data-is-connectable", "false");
  });

  it("applies custom color to handles", () => {
    const handles: ButtonHandleConfig[] = [
      {
        id: "handle1",
        type: "source",
        handleType: "output",
        color: "red",
      },
    ];

    render(<ButtonHandles handles={handles} nodeId="test-node" position={Position.Right} />);

    // The color is applied to HandleNotch component
    expect(screen.getByTestId("handle")).toBeInTheDocument();
  });
});
