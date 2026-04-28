import { useInternalNode, ViewportPortal } from '@uipath/apollo-react/canvas/xyflow/react';
import type { CSSProperties, ReactNode } from 'react';

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

export function NodeViewportOverlay({ nodeId, anchor, layer, children }: NodeViewportOverlayProps) {
  const internalNode = useInternalNode(nodeId);
  const positionAbsolute = internalNode?.internals.positionAbsolute;
  const width = anchor?.width ?? internalNode?.measured?.width ?? internalNode?.width;
  const height = anchor?.height ?? internalNode?.measured?.height ?? internalNode?.height;

  if (!positionAbsolute || width == null || height == null) {
    return children;
  }

  return (
    <ViewportPortal>
      <div
        className="absolute pointer-events-none"
        style={{
          position: 'absolute',
          left: positionAbsolute.x + (anchor?.left ?? 0),
          top: positionAbsolute.y + (anchor?.top ?? 0),
          width,
          height,
          transform: anchor?.transform,
          zIndex: layer ? NODE_VIEWPORT_OVERLAY_Z_INDEX[layer] : undefined,
        }}
      >
        {children}
      </div>
    </ViewportPortal>
  );
}
