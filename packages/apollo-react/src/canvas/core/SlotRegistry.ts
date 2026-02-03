/**
 * Slot Registry System
 *
 * Provides a registry for custom slot renderers and event handlers.
 * Allows wrapper components (AgentNode, ResourceNode, etc.) to register
 * complex rendering logic that can be referenced by ID in slot configs.
 */

import type { CustomSlotConfig } from '../schema/slot-config';
import type { ExecutionState } from '../types/execution';

/**
 * Context provided to slot renderers
 * Contains runtime state needed for conditional rendering
 */
export interface SlotRenderContext {
  nodeId: string;
  selected?: boolean;
  executionState?: ExecutionState;
  mode?: string; // Canvas mode (design, view, debug, readonly, etc.)
}

/**
 * Slot renderer function signature
 * Takes a custom slot config and context, returns a React element
 */
export type SlotRenderer = (
  config: CustomSlotConfig,
  context: SlotRenderContext
) => React.ReactNode;

/**
 * Event handler function signature
 * Takes context and performs an action (no return value)
 */
export type SlotEventHandler = (context: SlotRenderContext) => void;

/**
 * Registry for custom slot renderers and event handlers
 *
 * Usage:
 * ```typescript
 * const registry = useSlotRegistry();
 *
 * // Register a custom renderer
 * registry.registerRenderer('my-footer', (config, context) => {
 *   return <MyFooter {...config.props} selected={context.selected} />;
 * });
 *
 * // Register an event handler
 * registry.registerEventHandler('my-click', (context) => {
 *   console.log('Clicked node:', context.nodeId);
 * });
 * ```
 */
export class SlotRegistry {
  private renderers = new Map<string, SlotRenderer>();
  private eventHandlers = new Map<string, SlotEventHandler>();

  /**
   * Register a custom slot renderer
   * @param slotId Unique identifier for this renderer
   * @param renderer Function that renders the slot
   */
  registerRenderer(slotId: string, renderer: SlotRenderer): void {
    this.renderers.set(slotId, renderer);
  }

  /**
   * Register an event handler
   * @param handlerId Unique identifier for this handler
   * @param handler Function that handles the event
   */
  registerEventHandler(handlerId: string, handler: SlotEventHandler): void {
    this.eventHandlers.set(handlerId, handler);
  }

  /**
   * Get a registered renderer by ID
   * @param slotId The slot renderer ID
   * @returns The renderer function, or undefined if not found
   */
  getRenderer(slotId: string): SlotRenderer | undefined {
    return this.renderers.get(slotId);
  }

  /**
   * Get a registered event handler by ID
   * @param handlerId The event handler ID
   * @returns The handler function, or undefined if not found
   */
  getEventHandler(handlerId: string): SlotEventHandler | undefined {
    return this.eventHandlers.get(handlerId);
  }

  /**
   * Clear all registered renderers and handlers
   * Useful for testing or cleanup
   */
  clear(): void {
    this.renderers.clear();
    this.eventHandlers.clear();
  }

  /**
   * Get count of registered renderers
   * @returns Number of registered renderers
   */
  getRendererCount(): number {
    return this.renderers.size;
  }

  /**
   * Get count of registered event handlers
   * @returns Number of registered event handlers
   */
  getEventHandlerCount(): number {
    return this.eventHandlers.size;
  }
}

/**
 * Global slot registry instance
 * Used by default when no context provider is present
 */
const globalSlotRegistry = new SlotRegistry();

/**
 * Hook to access the slot registry
 *
 * Currently returns the global registry instance.
 * Could be enhanced to use React Context for better testability
 * and isolation between different canvas instances.
 *
 * @returns The slot registry instance
 */
export function useSlotRegistry(): SlotRegistry {
  // TODO: Consider using React Context for better testability
  // const context = useContext(SlotRegistryContext);
  // return context ?? globalSlotRegistry;
  return globalSlotRegistry;
}

/**
 * Get the global slot registry instance
 * Useful for testing or imperative access outside of React components
 *
 * @returns The global slot registry
 */
export function getGlobalSlotRegistry(): SlotRegistry {
  return globalSlotRegistry;
}
