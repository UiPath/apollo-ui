import { type ReactFlowState, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

// The `.react-flow` wrapper, deliberately not `.react-flow__renderer`.
//
// The renderer is absolutely positioned *with* a z-index (4), so it forms a
// stacking context: a portalled panel's own z-index can then only order it
// within the renderer's subtree. ReactFlow's `<Panel>` chrome
// (`.react-flow__panel`, z-index 5) is a sibling of the renderer, so canvas
// controls mounted that way would paint over the panel no matter how high its
// z-index went. Portalling into the wrapper instead makes the panel a sibling
// of that chrome, where its z-index competes on equal terms and wins.
//
// Geometry is unaffected: the wrapper is `position: relative` and the renderer
// is `inset: 0` of it, so both are the same box and act as the same
// offsetParent for the absolutely-positioned panel. Clipping is unchanged too,
// since `overflow: hidden` lives on the wrapper, not the renderer.
const reactFlowPortalSelector = (state: ReactFlowState) => state.domNode;

export interface CanvasPortalProps {
  children: ReactNode;
}

export function CanvasPortal({ children }: CanvasPortalProps) {
  const wrapperRef = useStore(reactFlowPortalSelector);

  if (!wrapperRef) {
    return null;
  }

  return createPortal(children, wrapperRef);
}
