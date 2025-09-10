import { render } from "@testing-library/react";
import { Position } from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";
import type { EdgeProps } from "@xyflow/react";
import ConditionalEdgeElement from "./ConditionalEdgeElement";

// Mock AnimatedSVGEdge and DefaultEdgeElement
vi.mock("./AnimatedEdge", () => ({
  AnimatedSVGEdge: (props: Record<string, unknown>) => {
    // Only pass through the props we want to test, filter out EdgeProps
    const {
      reverseDirection,
      hasError,
      hasSuccess,
      hasRunning,
      _isCurrentBreakpoint,
      // Filter out EdgeProps that would cause React warnings
      sourceX: _sourceX,
      sourceY: _sourceY,
      targetX: _targetX,
      targetY: _targetY,
      sourcePosition: _sourcePosition,
      targetPosition: _targetPosition,
      source: _source,
      target: _target,
      id: _id,
      data: _data,
      selected: _selected,
      animated: _animated,
      style: _style,
      markerEnd: _markerEnd,
      markerStart: _markerStart,
      interactionWidth: _interactionWidth,
      label: _label,
      labelStyle: _labelStyle,
      labelShowBg: _labelShowBg,
      labelBgStyle: _labelBgStyle,
      labelBgPadding: _labelBgPadding,
      labelBgBorderRadius: _labelBgBorderRadius,
      deletable: _deletable,
      selectable: _selectable,
      ..._rest
    } = props;
    return (
      <div
        data-testid="animated-edge"
        data-reverse-direction={reverseDirection}
        data-has-error={hasError}
        data-has-success={hasSuccess}
        data-has-running={hasRunning}
      />
    );
  },
}));
vi.mock("./DefaultEdge", () => ({
  DefaultEdgeElement: (props: Record<string, unknown>) => {
    // Filter out EdgeProps that would cause React warnings
    const {
      sourceX: _sourceX,
      sourceY: _sourceY,
      targetX: _targetX,
      targetY: _targetY,
      sourcePosition: _sourcePosition,
      targetPosition: _targetPosition,
      source: _source,
      target: _target,
      id: _id,
      data: _data,
      selected: _selected,
      animated: _animated,
      style: _style,
      markerEnd: _markerEnd,
      markerStart: _markerStart,
      interactionWidth: _interactionWidth,
      label: _label,
      labelStyle: _labelStyle,
      labelShowBg: _labelShowBg,
      labelBgStyle: _labelBgStyle,
      labelBgPadding: _labelBgPadding,
      labelBgBorderRadius: _labelBgBorderRadius,
      deletable: _deletable,
      selectable: _selectable,
      ..._rest
    } = props;
    return <div data-testid="default-edge" />;
  },
}));

// Mock useAgentFlowStore
const mockNodes = [
  { id: "agent", type: "agent" },
  {
    id: "resource",
    type: "resource",
    selected: true,
    data: { hasError: false, hasSuccess: false, hasRunning: false },
  },
];
vi.mock("../store/agent-flow-store", () => ({
  useAgentFlowStore: () => ({
    nodes: mockNodes,
    props: { mode: "view" }, // Add props with mode
  }),
}));

const baseEdgeProps: Omit<EdgeProps, "id" | "source" | "target"> = {
  sourceX: 0,
  sourceY: 0,
  targetX: 0,
  targetY: 0,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
  data: {},
  selected: false,
  animated: false,
  style: {},
  markerEnd: undefined,
  markerStart: undefined,
  interactionWidth: 0,
  label: undefined,
  labelStyle: undefined,
  labelShowBg: undefined,
  labelBgStyle: undefined,
  labelBgPadding: undefined,
  labelBgBorderRadius: undefined,
  deletable: undefined,
  selectable: undefined,
};

describe("ConditionalEdgeElement", () => {
  it("renders AnimatedSVGEdge for agent to selected resource", () => {
    const props: EdgeProps = {
      ...baseEdgeProps,
      id: "test-edge",
      source: "agent",
      target: "resource",
    };
    const { getByTestId } = render(<ConditionalEdgeElement {...props} />);
    expect(getByTestId("animated-edge")).toBeInTheDocument();
  });

  it("renders AnimatedSVGEdge with reverseDirection for selected resource to agent", () => {
    // Make resource the source and agent the target
    const props: EdgeProps = {
      ...baseEdgeProps,
      id: "test-edge",
      source: "resource",
      target: "agent",
    };
    const { getByTestId } = render(<ConditionalEdgeElement {...props} />);
    expect(getByTestId("animated-edge")).toBeInTheDocument();
    // Should have reverseDirection prop
    expect(getByTestId("animated-edge")).toHaveAttribute("data-reverse-direction", "true");
  });

  it("renders DefaultEdgeElement for other cases", () => {
    // Neither agent nor resource is selected
    const props: EdgeProps = {
      ...baseEdgeProps,
      id: "test-edge",
      source: "agent",
      target: "resource",
    };
    // Change selected to false
    (mockNodes[1] as NonNullable<(typeof mockNodes)[number]>).selected = false;
    const { getByTestId } = render(<ConditionalEdgeElement {...props} />);
    expect(getByTestId("default-edge")).toBeInTheDocument();
  });
});
