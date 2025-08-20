import { useMemo, useRef, useEffect } from "react";
import { useNodes, useReactFlow } from "@xyflow/react";
import { autoUpdate, flip, offset, useFloating, useMergeRefs, type Placement } from "@floating-ui/react";

export type AnchorRect = { x: number; y: number; width: number; height: number };

export interface UseFloatingPositionOptions {
  open?: boolean;
  nodeId?: string;
  anchorRect?: AnchorRect;
  placement?: Placement;
  offset?: number;
}

export function useFloatingPosition({
  open = true,
  nodeId,
  anchorRect,
  placement = "right-start",
  offset: offsetValue = 20,
}: UseFloatingPositionOptions) {
  const { getInternalNode } = useReactFlow();
  const nodes = useNodes();
  const referenceRef = useRef<HTMLDivElement>(null);

  const computedAnchor = useMemo<AnchorRect | null>(() => {
    if (anchorRect) {
      return anchorRect;
    }
    if (!nodeId) {
      return null;
    }
    const internalNode = getInternalNode(nodeId);
    if (!internalNode) {
      return null;
    }
    const position = internalNode.internals?.positionAbsolute || { x: 0, y: 0 };
    const node = nodes.find((n) => n.id === nodeId);
    const width = node?.measured?.width ?? node?.width ?? 200;
    const height = node?.measured?.height ?? node?.height ?? 100;
    return { x: position.x, y: position.y, width, height };
  }, [anchorRect, nodeId, getInternalNode, nodes]);

  const { refs, floatingStyles, update } = useFloating({
    placement,
    open: !!open && !!computedAnchor,
    middleware: [offset(offsetValue), flip()],
    whileElementsMounted: autoUpdate,
  });

  const mergedReferenceRef = useMergeRefs([refs.setReference, referenceRef]);

  useEffect(() => {
    if (open) update();
  }, [open, computedAnchor?.x, computedAnchor?.y, computedAnchor?.width, computedAnchor?.height, update]);

  return {
    computedAnchor,
    floatingStyles,
    refs,
    mergedReferenceRef,
  };
}
