import * as React from 'react';
import { cn } from '@/lib';
import {
  DEFAULT_VALUE_MODE_STRINGS,
  type ValueMode,
  type ValueModeStrings,
} from './value-mode-strings';

export interface ValueModeIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  mode: ValueMode;
  disabled?: boolean;
  /** Overrides for any subset of the English strings; only `expressionIndicator` is read. */
  strings?: Partial<ValueModeStrings>;
}

/**
 * The `=` ahead of an expression value. Renders nothing in literal mode: its absence is the signal
 * that the value is plain text. `className` takes alignment overrides, such as nudging the glyph
 * onto the first line of a growable editor.
 */
const ValueModeIndicator = React.forwardRef<HTMLDivElement, ValueModeIndicatorProps>(
  ({ mode, disabled, strings, className, ...props }, ref) => {
    const label = strings?.expressionIndicator ?? DEFAULT_VALUE_MODE_STRINGS.expressionIndicator;
    if (mode !== 'expression') return null;

    return (
      <div
        ref={ref}
        data-slot="value-mode-indicator"
        // A named image, since screen readers would read the glyph as "equals" and `title` is not
        // announced reliably.
        role="img"
        aria-label={label}
        title={label}
        className={cn(
          'flex items-center justify-center px-2 font-mono text-sm font-medium text-muted-foreground',
          disabled && 'opacity-50',
          className
        )}
        {...props}
      >
        <span aria-hidden="true">=</span>
      </div>
    );
  }
);
ValueModeIndicator.displayName = 'ValueModeIndicator';

export { ValueModeIndicator };
