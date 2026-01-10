import { cn, ToggleGroup, ToggleGroupItem } from '@uipath/apollo-wind';
import { memo } from 'react';
import { useCanvasToolbarContext } from './CanvasToolbarContext';
import type {
  CanvasToolbarToggleGroupProps,
  CanvasToolbarToggleItemProps,
} from './CanvasToolbarToggleGroup.types';

/**
 * CanvasToolbarToggleGroup - Mutually exclusive toggle buttons for toolbar
 *
 * A toggle group component for toolbar use. Automatically inherits disabled
 * state from parent CanvasToolbar context. Supports single selection mode.
 *
 * @example
 * ```tsx
 * <CanvasToolbar>
 *   <CanvasToolbarToggleGroup value={mode} onValueChange={setMode}>
 *     <CanvasToolbarToggleItem value="design">Build</CanvasToolbarToggleItem>
 *     <CanvasToolbarToggleItem value="evaluate">Evaluate</CanvasToolbarToggleItem>
 *   </CanvasToolbarToggleGroup>
 * </CanvasToolbar>
 * ```
 */
export const CanvasToolbarToggleGroup = memo(function CanvasToolbarToggleGroup({
  value,
  onValueChange,
  children,
  disabled: localDisabled,
  type = 'single',
  className,
}: CanvasToolbarToggleGroupProps) {
  const context = useCanvasToolbarContext();

  // Merge local disabled with context disabled
  const disabled = localDisabled || context.disabled;

  return (
    <ToggleGroup
      type={type}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      className={className}
    >
      {children}
    </ToggleGroup>
  );
});

/**
 * CanvasToolbarToggleItem - Individual toggle item within CanvasToolbarToggleGroup
 *
 * A toggle item component designed for use within CanvasToolbarToggleGroup.
 * Applies consistent styling for toolbar toggle buttons.
 *
 * @example
 * ```tsx
 * <CanvasToolbarToggleGroup value={mode} onValueChange={setMode}>
 *   <CanvasToolbarToggleItem value="design">Build</CanvasToolbarToggleItem>
 *   <CanvasToolbarToggleItem value="evaluate">Evaluate</CanvasToolbarToggleItem>
 * </CanvasToolbarToggleGroup>
 * ```
 */
export const CanvasToolbarToggleItem = memo(function CanvasToolbarToggleItem({
  value,
  children,
  className,
}: CanvasToolbarToggleItemProps) {
  return (
    <ToggleGroupItem
      value={value}
      className={cn(
        'h-8 font-bold rounded-xl px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
        className
      )}
    >
      {children}
    </ToggleGroupItem>
  );
});
