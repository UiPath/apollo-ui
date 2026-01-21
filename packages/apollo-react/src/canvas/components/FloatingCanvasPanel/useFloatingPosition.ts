import {
  autoUpdate,
  flip,
  offset,
  type Placement,
  useFloating,
  useMergeRefs,
} from '@floating-ui/react';
import { useInternalNode } from '@uipath/apollo-react/canvas/xyflow/react';
import { type CSSProperties, type RefCallback, useEffect, useMemo, useRef } from 'react';

export type AnchorRect = { x: number; y: number; width: number; height: number };

export interface UseFloatingPositionOptions {
  open?: boolean;
  nodeId?: string;
  anchorRect?: AnchorRect;
  placement?: Placement;
  offset?: number;
}

export interface UseFloatingPositionReturn {
  computedAnchor: AnchorRect | null;
  floatingStyles: CSSProperties;
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
}: UseFloatingPositionOptions): UseFloatingPositionReturn {
  const referenceRef = useRef<HTMLDivElement>(null);
  const internalNode = useInternalNode(nodeId || '');

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
    middleware: [offset(offsetValue), flip()],
    whileElementsMounted: autoUpdate,
  });

  const mergedReferenceRef = useMergeRefs([refs.setReference, referenceRef]);

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
    refs,
    mergedReferenceRef,
  };
}
