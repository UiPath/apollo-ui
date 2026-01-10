import { Separator, cn } from '@uipath/apollo-wind';
import { memo } from 'react';
import type { CanvasToolbarSeparatorProps } from './CanvasToolbarSeparator.types';

/**
 * CanvasToolbarSeparator - Visual divider for toolbar sections
 *
 * A simple separator component for dividing toolbar sections.
 * Supports both vertical and horizontal orientations.
 *
 * @example
 * ```tsx
 * <CanvasToolbar>
 *   <CanvasToolbarButton icon={<Play />} label="Run" />
 *   <CanvasToolbarSeparator />
 *   <CanvasToolbarButton icon={<Stop />} label="Stop" />
 * </CanvasToolbar>
 * ```
 */
export const CanvasToolbarSeparator = memo(function CanvasToolbarSeparator({
  orientation = 'vertical',
  className,
}: CanvasToolbarSeparatorProps) {
  return (
    <Separator
      orientation={orientation}
      className={cn(orientation === 'vertical' ? 'h-5' : 'w-full', className)}
    />
  );
});
