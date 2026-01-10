import { createContext, useContext } from 'react';

/**
 * Context value for CanvasToolbar to share state with child components
 */
export interface CanvasToolbarContextValue {
  /**
   * When true, all interactive children (buttons, toggles) should be disabled
   */
  disabled: boolean;
}

/**
 * Context for sharing toolbar state across child components
 */
export const CanvasToolbarContext = createContext<CanvasToolbarContextValue>({
  disabled: false,
});

/**
 * Hook to access the CanvasToolbar context
 * @returns The current toolbar context value
 */
export const useCanvasToolbarContext = () => useContext(CanvasToolbarContext);
