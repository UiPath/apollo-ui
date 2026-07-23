import type {
  Edge,
  FitViewOptions,
  Node,
  OnMove,
  ReactFlowInstance,
  Viewport,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useEffect, useRef } from 'react';
import type { CanvasView } from '../../utils/sequential';

interface ExternalViewportStore {
  saveViewport: (view: CanvasView, viewport: Viewport) => void;
  getViewport: (view: CanvasView) => Viewport | undefined;
}

interface UseCanvasViewViewportArgs<N extends Node, E extends Edge> {
  view: CanvasView;
  reactFlow: Pick<ReactFlowInstance<N, E>, 'fitView' | 'getViewport' | 'setViewport'>;
  externalStore?: ExternalViewportStore;
  fitViewOptions?: FitViewOptions<N>;
  fitOnMount?: boolean;
}

interface UseCanvasViewViewportResult {
  defaultViewport?: Viewport;
  onMove: OnMove;
}

/**
 * Preserves an independent viewport for each presentation, even when the
 * optional persisted SequentialViewProvider is absent.
 */
export function useCanvasViewViewport<N extends Node, E extends Edge>({
  view,
  reactFlow,
  externalStore,
  fitViewOptions,
  fitOnMount = false,
}: UseCanvasViewViewportArgs<N, E>): UseCanvasViewViewportResult {
  const localViewportByView = useRef<Map<CanvasView, Viewport>>(new Map());
  const previousView = useRef(view);
  const initialized = useRef(false);

  const saveViewport = useCallback(
    (forView: CanvasView, viewport: Viewport) => {
      localViewportByView.current.set(forView, viewport);
      externalStore?.saveViewport(forView, viewport);
    },
    [externalStore]
  );

  const getViewport = useCallback(
    (forView: CanvasView) =>
      externalStore?.getViewport(forView) ?? localViewportByView.current.get(forView),
    [externalStore]
  );

  const onMove = useCallback<OnMove>(
    (_event, viewport) => saveViewport(view, viewport),
    [saveViewport, view]
  );

  const defaultViewport = getViewport(view);

  useEffect(() => {
    if (initialized.current) return;

    // Sequential nodes already have deterministic positions and dimensions, so
    // the viewport hook only needs to fit them once after XYFlow commits them.
    // From then on, onMove and the view-change effect own viewport persistence.
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

    // The node arrays have changed by the time this effect runs, but XYFlow's
    // viewport has not. Capture it for the presentation we just left before
    // restoring or initially fitting the new one.
    const departingViewport = reactFlow.getViewport();
    saveViewport(previousView.current, departingViewport);
    previousView.current = view;

    const saved = getViewport(view);
    if (saved) {
      void reactFlow.setViewport({ ...saved, zoom: departingViewport.zoom }, { duration: 300 });
    } else {
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
