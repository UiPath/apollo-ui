import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@uipath/apollo-wind';
import type { AriaAttributes, MouseEventHandler, ReactNode } from 'react';
import { forwardRef } from 'react';

interface ToolbarButtonProps {
  label: string;
  tooltip?: ReactNode;
  testId?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  ariaPressed?: AriaAttributes['aria-pressed'];
  className?: string;
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactNode;
}

export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  function ToolbarButton(
    { label, tooltip, testId, onClick, disabled, ariaPressed, className, tooltipSide, children },
    ref
  ) {
    // A disabled action WITH an explanation (tooltip) stays focusable via aria-disabled
    // so its tooltip is reachable by pointer and keyboard — a native `disabled` button has
    // `pointer-events-none` and cannot take focus, so its tooltip could never open.
    // Activation is guarded below. Disabled actions WITHOUT an explanation use the native
    // disabled attribute: no tooltip to surface and no extra tab stop.
    const softDisabled = !!disabled && tooltip != null;
    const nativeDisabled = !!disabled && !softDisabled;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            data-testid={testId}
            aria-label={label}
            aria-pressed={ariaPressed}
            aria-disabled={softDisabled || undefined}
            variant="ghost"
            size="xs"
            icon
            className={
              softDisabled ? `${className ?? ''} opacity-50 cursor-not-allowed`.trim() : className
            }
            onClick={softDisabled ? undefined : onClick}
            disabled={nativeDisabled}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>{tooltip ?? label}</TooltipContent>
      </Tooltip>
    );
  }
);
