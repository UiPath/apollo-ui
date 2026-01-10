import { Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { cn, Row } from '@uipath/apollo-wind';
import { memo, useMemo } from 'react';
import type { CanvasToolbarProps } from './CanvasToolbar.types';
import { CanvasToolbarContext } from './CanvasToolbarContext';

/**
 * CanvasToolbar - Composable toolbar container for canvas controls
 *
 * A composable toolbar component that provides a scaffold for canvas controls.
 * Supports positioning via XYFlow Panel and shares disabled state via context.
 *
 * @example
 * ```tsx
 * <CanvasToolbar position="bottom-center">
 *   <CanvasToolbarButton icon={<Play />} label="Run" onClick={handleRun} />
 *   <CanvasToolbarSeparator />
 *   <CanvasToolbarButton icon={<Stop />} label="Stop" onClick={handleStop} />
 * </CanvasToolbar>
 * ```
 *
 * @example With toggle group
 * ```tsx
 * <CanvasToolbar position="bottom-center" disabled={isDebugMode}>
 *   <CanvasToolbarToggleGroup value={mode} onValueChange={setMode}>
 *     <CanvasToolbarToggleItem value="design">Build</CanvasToolbarToggleItem>
 *     <CanvasToolbarToggleItem value="evaluate">Evaluate</CanvasToolbarToggleItem>
 *   </CanvasToolbarToggleGroup>
 *   <CanvasToolbarSeparator />
 *   <CanvasToolbarButton icon={<Plus />} label="Add" onClick={handleAdd} />
 * </CanvasToolbar>
 * ```
 */
export const CanvasToolbar = memo(function CanvasToolbar({
  children,
  position = 'bottom-center',
  hidden = false,
  disabled = false,
  className,
}: CanvasToolbarProps) {
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({ disabled }), [disabled]);

  // Return null if toolbar should be hidden
  if (hidden) {
    return null;
  }

  return (
    <Panel position={position}>
      <CanvasToolbarContext.Provider value={contextValue}>
        <Row
          className={cn(
            'gap-1 items-center rounded-2xl border bg-background p-1.5 backdrop-blur-sm shadow-lg',
            className
          )}
        >
          {children}
        </Row>
      </CanvasToolbarContext.Provider>
    </Panel>
  );
});
