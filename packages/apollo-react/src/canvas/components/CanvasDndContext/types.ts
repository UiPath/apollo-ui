import type {
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';

/**
 * Handlers for drag and drop events.
 * Node-specific handlers can be registered per node type.
 */
export interface CanvasDndHandlers {
  onDragStart?: (event: DragStartEvent) => void | Promise<void>;
  onDragMove?: (event: DragMoveEvent) => void | Promise<void>;
  onDragOver?: (event: DragOverEvent) => void | Promise<void>;
  onDragEnd?: (event: DragEndEvent) => void | Promise<void>;
  onDragCancel?: () => void | Promise<void>;
}

/**
 * Context value provided by CanvasDndContext
 */
export interface CanvasDndContextValue {
  /** The ID of the currently dragged item, or null if nothing is being dragged */
  activeDragId: string | null;

  /** The node type of the currently dragged item, or null if nothing is being dragged */
  activeNodeType: string | null;

  /** Register handlers for a specific node type. First registration wins if called multiple times. */
  registerHandlers: (nodeType: string, handlers: CanvasDndHandlers) => void;

  /** Unregister handlers for a specific node type */
  unregisterHandlers: (nodeType: string) => void;
}
