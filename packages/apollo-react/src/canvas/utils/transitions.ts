import type { Viewport } from '@uipath/uix/xyflow/react';
import { animate } from 'motion';

export const ANIMATION_CONSTANTS = {
  MAX_ZOOM: 3, // Maximum zoom level for node focus
  NODE_FOCUS_PADDING: 0.1, // Padding around focused node (10% for tighter zoom)
  DEFAULT_CANVAS_WIDTH: 800, // Fallback canvas width
  DEFAULT_CANVAS_HEIGHT: 600, // Fallback canvas height

  TRANSITION_TIMEOUT: 5000, // Maximum time for transition (5 seconds)
} as const;

/**
 * Configuration for canvas navigation transitions
 */
export const TRANSITION_CONFIG = {
  // Duration for drill-in/drill-out animations
  drillDuration: 0.4,

  // Duration for viewport changes
  viewportDuration: 0.3,

  // Easing curves for natural motion
  easing: {
    // Smooth acceleration into the node
    drillIn: [0.4, 0, 0.2, 1],
    // Smooth deceleration out of the node
    drillOut: [0.4, 0, 0.2, 1],
    // Standard smooth viewport changes
    viewport: [0.25, 0.1, 0.25, 1],
  },
} as const;

/**
 * Represents a node's position and dimensions for transition calculations
 */
export interface NodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates the viewport needed to focus on a specific node
 * @param nodeBounds The bounds of the node to focus on
 * @param canvasSize The size of the canvas viewport
 * @param padding Padding around the node (0-1, where 1 is 100% padding)
 */
export function calculateNodeFocusViewport(
  nodeBounds: NodeBounds,
  canvasSize: { width: number; height: number },
  padding: number = 0.1
): Viewport {
  // Calculate zoom level to fit the node with padding
  const paddingX = canvasSize.width * padding;
  const paddingY = canvasSize.height * padding;

  const availableWidth = canvasSize.width - 2 * paddingX;
  const availableHeight = canvasSize.height - 2 * paddingY;

  const scaleX = availableWidth / nodeBounds.width;
  const scaleY = availableHeight / nodeBounds.height;

  // Use the smaller scale to ensure the node fits entirely
  const zoom = Math.min(scaleX, scaleY, ANIMATION_CONSTANTS.MAX_ZOOM);

  // Calculate center position
  const centerX = nodeBounds.x + nodeBounds.width / 2;
  const centerY = nodeBounds.y + nodeBounds.height / 2;

  // Calculate viewport position to center the node
  const x = canvasSize.width / 2 - centerX * zoom;
  const y = canvasSize.height / 2 - centerY * zoom;

  return { x, y, zoom };
}

/**
 * Animates viewport transition using Motion's animate function
 * @param fromViewport Starting viewport
 * @param toViewport Target viewport
 * @param duration Animation duration in seconds
 * @param onUpdate Callback for each animation frame
 * @param onComplete Callback when animation completes
 */
export async function animateViewport(
  fromViewport: Viewport,
  toViewport: Viewport,
  duration: number = TRANSITION_CONFIG.viewportDuration,
  onUpdate?: (viewport: Viewport) => void,
  onComplete?: () => void
): Promise<void> {
  return new Promise((resolve) => {
    animate(fromViewport, toViewport, {
      duration,
      ease: TRANSITION_CONFIG.easing.viewport,
      onUpdate: (latest) => {
        if (onUpdate) {
          onUpdate(latest as Viewport);
        }
      },
      onComplete: () => {
        if (onComplete) {
          onComplete();
        }
        resolve();
      },
    });
  });
}

/**
 * Creates a smooth animation for drill-in transitions
 * @param fromViewport Starting viewport (usually current canvas view)
 * @param nodeViewport Target viewport (focused on the node being drilled into)
 * @param onUpdate Callback for each animation frame
 * @param onComplete Callback when animation completes
 */
export async function animateDrillIn(
  fromViewport: Viewport,
  nodeViewport: Viewport,
  onUpdate?: (viewport: Viewport) => void,
  onComplete?: () => void
): Promise<void> {
  return new Promise((resolve) => {
    animate(fromViewport, nodeViewport, {
      duration: TRANSITION_CONFIG.drillDuration,
      ease: TRANSITION_CONFIG.easing.drillIn,
      onUpdate: (latest) => {
        if (onUpdate) {
          onUpdate(latest as Viewport);
        }
      },
      onComplete: () => {
        if (onComplete) {
          onComplete();
        }
        resolve();
      },
    });
  });
}

/**
 * Creates a smooth animation for drill-out transitions
 * @param fromViewport Starting viewport (child canvas view)
 * @param parentViewport Target viewport (parent canvas with node visible)
 * @param onUpdate Callback for each animation frame
 * @param onComplete Callback when animation completes
 */
export async function animateDrillOut(
  fromViewport: Viewport,
  parentViewport: Viewport,
  onUpdate?: (viewport: Viewport) => void,
  onComplete?: () => void
): Promise<void> {
  return new Promise((resolve) => {
    animate(fromViewport, parentViewport, {
      duration: TRANSITION_CONFIG.drillDuration,
      ease: TRANSITION_CONFIG.easing.drillOut,
      onUpdate: (latest) => {
        if (onUpdate) {
          onUpdate(latest as Viewport);
        }
      },
      onComplete: () => {
        if (onComplete) {
          onComplete();
        }
        resolve();
      },
    });
  });
}

/**
 * Helper to get canvas dimensions from a React Flow instance
 */
export function getCanvasSize(containerElement?: HTMLElement | null): {
  width: number;
  height: number;
} {
  if (!containerElement) {
    return {
      width: ANIMATION_CONSTANTS.DEFAULT_CANVAS_WIDTH,
      height: ANIMATION_CONSTANTS.DEFAULT_CANVAS_HEIGHT,
    };
  }

  const rect = containerElement.getBoundingClientRect();
  return {
    width: rect.width || ANIMATION_CONSTANTS.DEFAULT_CANVAS_WIDTH,
    height: rect.height || ANIMATION_CONSTANTS.DEFAULT_CANVAS_HEIGHT,
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}
