import { BackgroundVariant } from "@xyflow/react";

// This is the grid size used for snapping and layout
// Nodes should be multiples of this size to allow for proper alignment
export const BASE_CANVAS_GRID_SPACING = 16;

export const BASE_CANVAS_DEFAULTS = {
  zoom: {
    min: 0.2,
    max: 3,
    default: 1,
  },
  defaultViewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
  fitViewOptions: {
    padding: 0.1,
    duration: 300,
  },
  background: {
    gap: BASE_CANVAS_GRID_SPACING,
    size: 2,
    color: "var(--color-border-de-emp)",
    bgColor: "var(--color-background-secondary)",
    variant: BackgroundVariant.Dots,
  },
  transitions: {
    opacity: "opacity 0.2s ease-in-out",
    default: {
      cssValue: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      durationMs: 300,
    },
  },
  edge: {
    type: "default",
  },
  pro: {
    hideAttribution: true,
  },
  snapToGrid: true,
  snapGrid: [BASE_CANVAS_GRID_SPACING, BASE_CANVAS_GRID_SPACING] as [number, number],
  maintainNodesInView: {
    padding: 50,
    debounceMs: 50,
  },
} as const;

// Timing constants
export const FIT_VIEW_DELAY_MS = 50;
export const CANVAS_READY_DELAY_MS = 50;

// Edge styling defaults
export const EDGE_STYLES = {
  strokeWidth: 1,
  selectedStrokeWidth: 3,
} as const;

// Default node dimensions
export const NODE_DIMENSIONS = {
  agent: { width: 320, height: 140 },
  resource: { width: 80, height: 80 },
  flow: { width: 150, height: 60 },
  codedAgent: { width: 220, height: 80 },
} as const;

// Flow layout constants
export const FLOW_LAYOUT = {
  groupSpacing: 120,
  groupDistanceHorizontal: 200,
  groupDistanceVertical: 160,
} as const;
