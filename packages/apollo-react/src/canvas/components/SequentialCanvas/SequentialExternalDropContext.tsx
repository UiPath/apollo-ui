import {
  createContext,
  type DragEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { InsertionSlot } from '../../utils/sequential/sequential.types';
import type { SequentialExternalDrop } from './SequentialCanvas.types';

export interface SequentialExternalDropValue {
  /** An accepted external drag is over the canvas: every ⊕ shows at full strength. */
  isDragActive: boolean;
  accepts: (event: DragEvent) => boolean;
  drop: (event: DragEvent, slot: InsertionSlot) => void;
  /** The slot a placeholder row's click would insert at, by placeholder node id. */
  getPlaceholderSlot: (placeholderId: string) => InsertionSlot | undefined;
}

/** Highlight for the drop target an accepted drag is over. */
export const SEQ_DROP_OVER_CLASS = 'opacity-100 border-brand ring-2 ring-brand';

const SequentialExternalDropContext = createContext<SequentialExternalDropValue | undefined>(
  undefined
);

/** Provided by `SequentialCanvas.tsx` only while an external drop is active (sequential view, design mode). */
export const SequentialExternalDropProvider = SequentialExternalDropContext.Provider;

export function useSequentialExternalDrop(): SequentialExternalDropValue | undefined {
  return useContext(SequentialExternalDropContext);
}

/**
 * Canvas-side state for `SequentialCanvasProps.externalDrop`: whether an accepted
 * drag is over the canvas wrapper, and the context value the drop targets read.
 * `externalDrop` is read through a ref so a host passing an inline object does
 * not re-render every target on each host render.
 */
export function useSequentialExternalDropController(
  externalDrop: SequentialExternalDrop | undefined,
  placeholderSlots: ReadonlyMap<string, InsertionSlot>
) {
  const latest = useRef(externalDrop);
  latest.current = externalDrop;
  const isEnabled = externalDrop !== undefined;
  const [isOverCanvas, setIsOverCanvas] = useState(false);
  const isDragActive = isEnabled && isOverCanvas;

  // A drag released outside every target, or cancelled, never reaches a drop
  // handler here; the drag source's `dragend` still bubbles to the window.
  useEffect(() => {
    if (!isDragActive) return;
    const clear = () => setIsOverCanvas(false);
    window.addEventListener('dragend', clear);
    window.addEventListener('drop', clear);
    return () => {
      window.removeEventListener('dragend', clear);
      window.removeEventListener('drop', clear);
    };
  }, [isDragActive]);

  const accepts = useCallback((event: DragEvent) => latest.current?.accepts(event) ?? false, []);

  const value = useMemo<SequentialExternalDropValue | undefined>(
    () =>
      isEnabled
        ? {
            isDragActive,
            accepts,
            drop: (event, slot) => {
              setIsOverCanvas(false);
              latest.current?.onDrop(event, slot);
            },
            getPlaceholderSlot: (placeholderId) => placeholderSlots.get(placeholderId),
          }
        : undefined,
    [isEnabled, isDragActive, accepts, placeholderSlots]
  );

  const onDragEnter = useCallback(
    (event: DragEvent) => {
      if (accepts(event)) setIsOverCanvas(true);
    },
    [accepts]
  );
  const onDragLeave = useCallback((event: DragEvent) => {
    if (isLeavingElement(event)) setIsOverCanvas(false);
  }, []);

  return {
    value,
    wrapperProps: isEnabled ? { onDragEnter, onDragLeave } : undefined,
  };
}

export interface SequentialDropTarget {
  /** Drag handlers for the target element; absent when external drop is inactive or there is no slot. */
  dropProps?: {
    onDragEnter: (event: DragEvent) => void;
    onDragOver: (event: DragEvent) => void;
    onDragLeave: (event: DragEvent) => void;
    onDrop: (event: DragEvent) => void;
    'data-drop-over'?: true;
  };
  isDragActive: boolean;
  isOver: boolean;
}

/** Makes one insert affordance an external drop target for `slot`. */
export function useSequentialDropTarget(slot: InsertionSlot | undefined): SequentialDropTarget {
  const context = useSequentialExternalDrop();
  const [isOverTarget, setIsOverTarget] = useState(false);
  const isDragActive = context?.isDragActive ?? false;
  const isOver = isDragActive && isOverTarget;

  const onDragOver = useCallback(
    (event: DragEvent) => {
      if (!context?.accepts(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      setIsOverTarget(true);
    },
    [context]
  );
  const onDragLeave = useCallback((event: DragEvent) => {
    if (isLeavingElement(event)) setIsOverTarget(false);
  }, []);
  const onDrop = useCallback(
    (event: DragEvent) => {
      if (!context || !slot || !context.accepts(event)) return;
      event.preventDefault();
      event.stopPropagation();
      setIsOverTarget(false);
      context.drop(event, slot);
    },
    [context, slot]
  );

  if (!context || !slot) return { isDragActive, isOver: false };
  return {
    dropProps: {
      onDragEnter: onDragOver,
      onDragOver,
      onDragLeave,
      onDrop,
      ...(isOver ? { 'data-drop-over': true } : {}),
    },
    isDragActive,
    isOver,
  };
}

/** `dragleave` also fires when the pointer moves onto a descendant; only a real exit counts. */
function isLeavingElement(event: DragEvent): boolean {
  const next = event.relatedTarget;
  return !(next instanceof Node && event.currentTarget.contains(next));
}
