import {
  type ReactFlowState,
  useStore,
  ViewportPortal,
} from '@uipath/apollo-react/canvas/xyflow/react';
import type { CSSProperties, ReactNode } from 'react';
import { useCallback } from 'react';
import { shallow } from 'zustand/shallow';

// React Flow adds 1000 to selected node z-index and styles its connection line at 1001.
// Node viewport overlays sit just above those library layers.
const NODE_VIEWPORT_OVERLAY_Z_INDEX = {
  nodeHandleAffordance: 1002,
  nodeToolbar: 1003,
} as const;

type NodeViewportOverlayLayer = keyof typeof NODE_VIEWPORT_OVERLAY_Z_INDEX;

export type NodeViewportOverlayAnchor = {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  transform?: CSSProperties['transform'];
};

export type NodeViewportOverlayProps = {
  nodeId: string;
  anchor?: NodeViewportOverlayAnchor;
  layer?: NodeViewportOverlayLayer;
  children: ReactNode;
};

type NodeViewportOverlayGeometry = {
  x: number | undefined;
  y: number | undefined;
  width: number | undefined;
  height: number | undefined;
};

export function NodeViewportOverlay({ nodeId, anchor, layer, children }: NodeViewportOverlayProps) {
  const geometry = useStore(
    useCallback(
      (state: ReactFlowState): NodeViewportOverlayGeometry => {
        const internalNode = state.nodeLookup.get(nodeId);
        const positionAbsolute = internalNode?.internals.positionAbsolute;

        return {
          x: positionAbsolute?.x,
          y: positionAbsolute?.y,
          width: anchor?.width ?? internalNode?.measured?.width ?? internalNode?.width,
          height: anchor?.height ?? internalNode?.measured?.height ?? internalNode?.height,
        };
      },
      [anchor?.height, anchor?.width, nodeId]
    ),
    shallow
  );

  if (
    geometry.x == null ||
    geometry.y == null ||
    geometry.width == null ||
    geometry.height == null
  ) {
    return children;
  }

  return (
    <ViewportPortal>
      <div
        className="absolute pointer-events-none"
        style={{
          position: 'absolute',
          left: geometry.x + (anchor?.left ?? 0),
          top: geometry.y + (anchor?.top ?? 0),
          width: geometry.width,
          height: geometry.height,
          transform: anchor?.transform,
          zIndex: layer ? NODE_VIEWPORT_OVERLAY_Z_INDEX[layer] : undefined,
        }}
      >
        {children}
      </div>
    </ViewportPortal>
  );
}
