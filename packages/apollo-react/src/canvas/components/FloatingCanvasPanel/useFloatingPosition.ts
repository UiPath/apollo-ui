import {
  autoUpdate,
  flip,
  offset,
  type Placement,
  shift,
  size,
  useFloating,
  useMergeRefs,
} from '@floating-ui/react';
import { useInternalNode } from '@uipath/apollo-react/canvas/xyflow/react';
import { type CSSProperties, type RefCallback, useEffect, useMemo, useRef, useState } from 'react';

export type AnchorRect = { x: number; y: number; width: number; height: number };

/**
 * Viewport padding (px) reserved around the floating element when computing
 * `availableHeight` / `shift` boundaries. Keeps the panel from butting against
 * the viewport edge at low resolutions.
 */
const VIEWPORT_PADDING = 8;

export interface UseFloatingPositionOptions {
  open?: boolean;
  nodeId?: string;
  anchorRect?: AnchorRect;
  placement?: Placement;
  offset?: number;
  fallbackPlacement?: 'none' | 'start' | 'end';
}

export interface UseFloatingPositionReturn {
  computedAnchor: AnchorRect | null;
  floatingStyles: CSSProperties;
  availableHeight: number | null;
  refs: {
    setReference: RefCallback<Element>;
    setFloating: RefCallback<HTMLElement>;
  };
  mergedReferenceRef: ((instance: Element | null) => void) | null;
}

export function useFloatingPosition({
  open = true,
  nodeId,
  anchorRect,
  placement = 'right-start',
  offset: offsetValue = 20,
  fallbackPlacement = 'none',
}: UseFloatingPositionOptions): UseFloatingPositionReturn {
  const referenceRef = useRef<HTMLDivElement>(null);
  const internalNode = useInternalNode(nodeId || '');
  const [availableHeight, setAvailableHeight] = useState<number | null>(null);

  const computedAnchor = useMemo<AnchorRect | null>(() => {
    if (anchorRect) {
      return anchorRect;
    }

    if (!internalNode) {
      return null;
    }

    const position = internalNode.internals?.positionAbsolute || { x: 0, y: 0 };
    const width = internalNode.measured?.width ?? internalNode.width ?? 200;
    const height = internalNode.measured?.height ?? internalNode.height ?? 100;
    return { x: position.x, y: position.y, width, height };
  }, [anchorRect, internalNode]);

  const { refs, floatingStyles, update } = useFloating({
    placement,
    open: !!open && !!computedAnchor,
    middleware: [
      offset(offsetValue),
      flip({ fallbackAxisSideDirection: fallbackPlacement }),
      shift({ padding: VIEWPORT_PADDING }),
      size({
        padding: VIEWPORT_PADDING,
        apply({ availableHeight: ah }) {
          const next = Math.max(0, Math.floor(ah));
          setAvailableHeight((prev) => (prev === next ? prev : next));
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const mergedReferenceRef = useMergeRefs([refs.setReference, referenceRef]);

  // Drop the cached viewport cap when the panel closes. Call sites typically
  // keep the panel mounted and toggle `open`, so without this a reopen would
  // render one frame with a stale `availableHeight` (e.g. from a since-changed
  // viewport) before the `size` middleware recomputes.
  useEffect(() => {
    if (!open) setAvailableHeight(null);
  }, [open]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Dependencies are correct
  useEffect(() => {
    if (open) update();
  }, [
    open,
    computedAnchor?.x,
    computedAnchor?.y,
    computedAnchor?.width,
    computedAnchor?.height,
    update,
  ]);

  return {
    computedAnchor,
    floatingStyles,
    availableHeight,
    refs,
    mergedReferenceRef,
  };
}
