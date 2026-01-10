import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from '@uipath/apollo-wind';
import { forwardRef, memo } from 'react';
import type { CanvasToolbarButtonProps } from './CanvasToolbarButton.types';
import { useCanvasToolbarContext } from './CanvasToolbarContext';

/**
 * CanvasToolbarButton - Icon button with tooltip for toolbar actions
 *
 * A button component designed for toolbar use. Automatically inherits disabled
 * state from parent CanvasToolbar context. Includes tooltip support for accessibility.
 *
 * @example
 * ```tsx
 * <CanvasToolbar>
 *   <CanvasToolbarButton
 *     icon={<Play className="h-4 w-4" />}
 *     label="Run workflow"
 *     onClick={handleRun}
 *   />
 * </CanvasToolbar>
 * ```
 */
export const CanvasToolbarButton = memo(
  forwardRef<HTMLButtonElement, CanvasToolbarButtonProps>(function CanvasToolbarButton(
    { icon, label, onClick, disabled: localDisabled, tooltipPlacement = 'top', className },
    ref
  ) {
    const context = useCanvasToolbarContext();

    // Merge local disabled with context disabled
    const disabled = localDisabled || context.disabled;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8 nodrag nopan', className)}
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={tooltipPlacement}>{label}</TooltipContent>
      </Tooltip>
    );
  })
);
