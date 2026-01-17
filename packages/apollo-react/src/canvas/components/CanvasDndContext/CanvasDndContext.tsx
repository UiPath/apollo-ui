import {
  closestCenter,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  KeyboardSensor,
  type Modifiers,
  PointerSensor,
  type SensorDescriptor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { CanvasDndContextValue, CanvasDndHandlers } from './types';

const CanvasDndContextInternal = createContext<CanvasDndContextValue | null>(null);

export interface CanvasDndContextProps {
  children: React.ReactNode;

  /** Global handler called for all drag start events (runs before node-specific handlers) */
  onDragStart?: (event: DragStartEvent) => void;

  /** Global handler called for all drag move events (runs before node-specific handlers) */
  onDragMove?: (event: DragMoveEvent) => void;

  /** Global handler called for all drag over events (runs before node-specific handlers) */
  onDragOver?: (event: DragOverEvent) => void;

  /** Global handler called for all drag end events (runs before node-specific handlers) */
  onDragEnd?: (event: DragEndEvent) => void;

  /** Global handler called for all drag cancel events (runs before node-specific handlers) */
  onDragCancel?: () => void;

  /** Custom sensors configuration. If not provided, defaults to PointerSensor and KeyboardSensor */
  sensors?: SensorDescriptor<any>[];

  /** Collision detection algorithm. Defaults to closestCenter */
  collisionDetection?: CollisionDetection;

  /** Modifiers to apply to drag operations */
  modifiers?: Modifiers;
}

/**
 * CanvasDndContext provides a shared DndContext for all draggable elements in the canvas.
 * It allows different node types to register their own drag handlers while maintaining
 * a single drag and drop context.
 *
 * @example
 * ```tsx
 * <CanvasDndContext
 *   onDragStart={(event) => console.log('Global: drag started')}
 *   onDragEnd={(event) => console.log('Global: drag ended')}
 * >
 *   <BaseCanvas>
 *     // Your nodes that use useCanvasDndHandler
 *   </BaseCanvas>
 * </CanvasDndContext>
 * ```
 */
export const CanvasDndContext: React.FC<CanvasDndContextProps> = ({
  children,
  onDragStart: globalDragStart,
  onDragMove: globalDragMove,
  onDragOver: globalDragOver,
  onDragEnd: globalDragEnd,
  onDragCancel: globalDragCancel,
  sensors: customSensors,
  collisionDetection = closestCenter,
  modifiers,
}) => {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeNodeType, setActiveNodeType] = useState<string | null>(null);

  // Use a ref to store handlers to avoid re-creating context value on handler changes
  const handlersRef = useRef<Map<string, CanvasDndHandlers>>(new Map());

  // Default sensors: PointerSensor with activation constraint and KeyboardSensor
  const defaultSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sensors = customSensors || defaultSensors;

  /**
   * Register handlers for a specific node type.
   * First registration wins - subsequent registrations for the same nodeType are ignored.
   */
  const registerHandlers = useCallback((nodeType: string, handlers: CanvasDndHandlers) => {
    if (!handlersRef.current.has(nodeType)) {
      handlersRef.current.set(nodeType, handlers);
    }
  }, []);

  /**
   * Unregister handlers for a specific node type
   */
  const unregisterHandlers = useCallback((nodeType: string) => {
    handlersRef.current.delete(nodeType);
  }, []);

  /**
   * Composed drag start handler:
   * 1. Updates active drag state
   * 2. Runs global handler (if provided)
   * 3. Runs node-specific handler (if registered)
   */
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const dragId = event.active.id as string;
      const nodeType = event.active.data.current?.nodeType as string | undefined;

      setActiveDragId(dragId);
      setActiveNodeType(nodeType || null);

      // Run global handler first
      globalDragStart?.(event);

      // Run node-specific handler if registered
      if (nodeType) {
        const handlers = handlersRef.current.get(nodeType);
        handlers?.onDragStart?.(event);
      }
    },
    [globalDragStart]
  );

  /**
   * Composed drag move handler:
   * 1. Runs global handler (if provided)
   * 2. Runs node-specific handler (if registered)
   */
  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      // Run global handler first
      globalDragMove?.(event);

      // Run node-specific handler if registered
      if (activeNodeType) {
        const handlers = handlersRef.current.get(activeNodeType);
        handlers?.onDragMove?.(event);
      }
    },
    [globalDragMove, activeNodeType]
  );

  /**
   * Composed drag over handler:
   * 1. Runs global handler (if provided)
   * 2. Runs node-specific handler (if registered)
   */
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      // Run global handler first
      globalDragOver?.(event);

      // Run node-specific handler if registered
      if (activeNodeType) {
        const handlers = handlersRef.current.get(activeNodeType);
        handlers?.onDragOver?.(event);
      }
    },
    [globalDragOver, activeNodeType]
  );

  /**
   * Composed drag end handler:
   * 1. Runs global handler (if provided)
   * 2. Runs node-specific handler (if registered)
   * 3. Resets active drag state
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      // Run global handler first
      globalDragEnd?.(event);

      // Run node-specific handler if registered
      if (activeNodeType) {
        const handlers = handlersRef.current.get(activeNodeType);
        handlers?.onDragEnd?.(event);
      }

      // Reset state
      setActiveDragId(null);
      setActiveNodeType(null);
    },
    [globalDragEnd, activeNodeType]
  );

  /**
   * Composed drag cancel handler:
   * 1. Runs global handler (if provided)
   * 2. Runs node-specific handler (if registered)
   * 3. Resets active drag state
   */
  const handleDragCancel = useCallback(() => {
    // Run global handler first
    globalDragCancel?.();

    // Run node-specific handler if registered
    if (activeNodeType) {
      const handlers = handlersRef.current.get(activeNodeType);
      handlers?.onDragCancel?.();
    }

    // Reset state
    setActiveDragId(null);
    setActiveNodeType(null);
  }, [globalDragCancel, activeNodeType]);

  const contextValue: CanvasDndContextValue = {
    activeDragId,
    activeNodeType,
    registerHandlers,
    unregisterHandlers,
  };

  return (
    <CanvasDndContextInternal.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        modifiers={modifiers}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}
      </DndContext>
    </CanvasDndContextInternal.Provider>
  );
};

/**
 * Hook to access the CanvasDndContext
 * @throws Error if used outside of CanvasDndContext
 */
export const useCanvasDndContext = (): CanvasDndContextValue => {
  const context = useContext(CanvasDndContextInternal);
  if (!context) {
    throw new Error('useCanvasDndContext must be used within a CanvasDndContext');
  }
  return context;
};
