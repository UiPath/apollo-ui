import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@uipath/apollo-wind';
import type { MouseEventHandler, ReactNode } from 'react';
import { forwardRef } from 'react';

interface ToolbarButtonProps {
  label: string;
  tooltip?: ReactNode;
  testId?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  ariaPressed?: boolean;
  className?: string;
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactNode;
}

export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  function ToolbarButton(
    { label, tooltip, testId, onClick, disabled, ariaPressed, className, tooltipSide, children },
    ref
  ) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            data-testid={testId}
            aria-label={label}
            aria-pressed={ariaPressed}
            variant="ghost"
            size="xs"
            icon
            className={className}
            onClick={onClick}
            disabled={disabled}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>{tooltip ?? label}</TooltipContent>
      </Tooltip>
    );
  }
);
