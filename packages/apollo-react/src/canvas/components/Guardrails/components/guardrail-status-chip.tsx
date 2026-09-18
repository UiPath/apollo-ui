import { badgeVariants, cn } from '@uipath/apollo-wind';
import * as React from 'react';
import { GUARDRAIL_CHIP_GEOMETRY } from './guardrail-chip';

export interface GuardrailStatusChipProps extends React.ComponentPropsWithoutRef<'span'> {
  /**
   * Maps onto the wind `Badge` variants. `success` and `info` are the colours both products
   * already give a BYO chip and a "Preview" chip, not choices made here.
   */
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'error';
}

const TONE_VARIANT = {
  neutral: 'secondary',
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
} as const;

/**
 * Read-only status label for a guardrail row (definition status, governance administration).
 *
 * Deliberately not `GuardrailChip`, which wraps a Radix `Toggle`: these are labels, and
 * rendering them as toggles would put fake buttons in the tab order. It borrows the chip
 * family's pill geometry so the two still read as one system.
 *
 * A `<span>` composed from `badgeVariants` rather than `Badge`, which renders a `<div>`: the
 * palette entry puts these inside its `<button>`, where flow content is invalid.
 */
const GuardrailStatusChip = React.forwardRef<HTMLSpanElement, GuardrailStatusChipProps>(
  ({ tone = 'neutral', className, children, title, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="guardrail-status-chip"
      // The pill is a fixed height and the text is the host's, so a long label truncates and
      // `title` carries the rest. Native `title`, not wind's `Tooltip`, whose trigger would be
      // a control nested inside the palette entry's own `<button>`.
      title={title ?? (typeof children === 'string' ? children : undefined)}
      className={cn(
        badgeVariants({ variant: TONE_VARIANT[tone] }),
        'h-5',
        GUARDRAIL_CHIP_GEOMETRY,
        className
      )}
      {...props}
    >
      {/* Its own block box: `text-overflow` does not reach the anonymous flex item bare text
          becomes inside `inline-flex`. */}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  )
);
GuardrailStatusChip.displayName = 'GuardrailStatusChip';

export { GuardrailStatusChip };
