import { useEffect } from 'react';
import { useCanvasDndContext } from './CanvasDndContext';
import type { CanvasDndHandlers } from './types';

/**
 * Hook to register drag and drop handlers for a specific node type.
 *
 * This hook automatically registers the handlers on mount and unregisters them on unmount.
 * If the same nodeType is registered multiple times, the first registration wins.
 *
 * @param nodeType - Unique identifier for the node type (e.g., 'stage-node', 'trigger-node')
 * @param handlers - Object containing onDragStart and/or onDragEnd handlers
 *
 * @example
 * ```tsx
 * const MyNode = () => {
 *   useCanvasDndHandler('my-node-type', {
 *     onDragStart: (event) => {
 *       console.log('My node started dragging', event);
 *     },
 *     onDragEnd: (event) => {
 *       console.log('My node finished dragging', event);
 *     }
 *   });
 *
 *   return <div>My draggable node</div>;
 * };
 * ```
 */
export const useCanvasDndHandler = (nodeType: string, handlers: CanvasDndHandlers): void => {
  const { registerHandlers, unregisterHandlers } = useCanvasDndContext();

  useEffect(() => {
    registerHandlers(nodeType, handlers);

    return () => {
      unregisterHandlers(nodeType);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeType, registerHandlers, unregisterHandlers]);
};
