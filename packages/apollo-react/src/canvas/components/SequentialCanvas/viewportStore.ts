import type { Viewport } from '@uipath/apollo-react/canvas/xyflow/react';
import type { CanvasView } from '../../utils/sequential/sequential.types';

export interface ViewportStore {
  saveViewport: (view: CanvasView, viewport: Viewport) => void;
  /** The viewport to restore for a view; undefined means fit fresh. */
  getViewport: (view: CanvasView) => Viewport | undefined;
}

/** In-memory per-view viewport store with stable method identities. */
export function createViewportStore(): ViewportStore {
  const byView = new Map<CanvasView, Viewport>();
  return {
    saveViewport: (view, viewport) => {
      byView.set(view, viewport);
    },
    getViewport: (view) => byView.get(view),
  };
}
