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
    const button = (
      <Button
        ref={ref}
        data-testid={testId}
        // When disabled, the focusable wrapper span below carries the accessible
        // name so the name is not announced twice.
        aria-label={disabled ? undefined : label}
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
    );

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {disabled ? (
            // A disabled Apollo Button has `pointer-events-none` and cannot receive
            // focus, so it can never open the tooltip. Wrap it in a focusable,
            // hoverable span that becomes the tooltip trigger while the button keeps
            // its disabled semantics — this is how `runDisabledReason` stays discoverable
            // by both pointer and keyboard users.
            // biome-ignore lint/a11y/noNoninteractiveTabindex: intentional focusable tooltip trigger for a disabled control
            // biome-ignore lint/a11y/useAriaPropsSupportedByRole: the span is the interactive trigger and needs an accessible name
            <span tabIndex={0} aria-label={label} className="inline-flex">
              {button}
            </span>
          ) : (
            button
          )}
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>{tooltip ?? label}</TooltipContent>
      </Tooltip>
    );
  }
);
