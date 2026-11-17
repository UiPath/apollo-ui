import type {
  Edge,
  FitViewOptions,
  Node,
  OnMove,
  ReactFlowInstance,
  Viewport,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasView } from '../../utils/sequential';
import { createViewportStore, type ViewportStore } from './viewportStore';

interface UseCanvasViewViewportArgs<N extends Node, E extends Edge> {
  view: CanvasView;
  reactFlow: Pick<ReactFlowInstance<N, E>, 'fitView' | 'getViewport' | 'setViewport'>;
  externalStore?: ViewportStore;
  fitViewOptions?: FitViewOptions<N>;
  fitOnMount?: boolean;
}

interface UseCanvasViewViewportResult {
  defaultViewport?: Viewport;
  onMove: OnMove;
}

/**
 * Preserves an independent pan position per view, with or without SequentialViewProvider.
 * Zoom is not per-view: it carries across the toggle from the view being left.
 */
export function useCanvasViewViewport<N extends Node, E extends Edge>({
  view,
  reactFlow,
  externalStore,
  fitViewOptions,
  fitOnMount = false,
}: UseCanvasViewViewportArgs<N, E>): UseCanvasViewViewportResult {
  const [localStore] = useState(createViewportStore);
  const previousView = useRef(view);
  const initialized = useRef(false);

  const saveViewport = useCallback(
    (forView: CanvasView, viewport: Viewport) => {
      localStore.saveViewport(forView, viewport);
      externalStore?.saveViewport(forView, viewport);
    },
    [externalStore, localStore]
  );

  const getViewport = useCallback(
    (forView: CanvasView) => externalStore?.getViewport(forView) ?? localStore.getViewport(forView),
    [externalStore, localStore]
  );

  const onMove = useCallback<OnMove>(
    (_event, viewport) => saveViewport(view, viewport),
    [saveViewport, view]
  );

  const defaultViewport = getViewport(view);

  useEffect(() => {
    if (initialized.current) return;

    // Fit once after xyflow commits the deterministic sequential positions; afterwards onMove
    // and the view-change effect own the viewport.
    if (!fitOnMount || defaultViewport) {
      initialized.current = true;
      return;
    }

    const animationFrame = requestAnimationFrame(() => {
      initialized.current = true;
      void reactFlow.fitView({ ...fitViewOptions, duration: 0 });
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [defaultViewport, fitOnMount, fitViewOptions, reactFlow]);

  useEffect(() => {
    if (previousView.current === view) return;

    // The node arrays have changed by now but xyflow's viewport has not; capture it for the
    // view just left.
    const departingViewport = reactFlow.getViewport();
    saveViewport(previousView.current, departingViewport);
    previousView.current = view;

    const saved = getViewport(view);
    if (saved) {
      // Restores the saved pan at the current zoom. The saved x/y were captured at a possibly
      // different zoom, so the position can land off-target; restore `saved.zoom` to change that.
      void reactFlow.setViewport({ ...saved, zoom: departingViewport.zoom }, { duration: 300 });
    } else {
      // First entry: fit the content without changing the zoom level.
      void reactFlow.fitView({
        ...fitViewOptions,
        minZoom: departingViewport.zoom,
        maxZoom: departingViewport.zoom,
        duration: 300,
      });
    }
  }, [view, reactFlow, fitViewOptions, getViewport, saveViewport]);

  return { defaultViewport, onMove };
}
