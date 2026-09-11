import { badgeVariants, cn } from '@uipath/apollo-wind';
import * as React from 'react';
import { GUARDRAIL_CHIP_GEOMETRY } from './guardrail-chip';

export interface GuardrailStatusChipProps extends React.ComponentPropsWithoutRef<'span'> {
  /** Maps onto the wind `Badge` variants: a neutral fact, a warning, or a blocking error. */
  tone?: 'neutral' | 'warning' | 'error';
}

const TONE_VARIANT = {
  neutral: 'secondary',
  warning: 'warning',
  error: 'error',
} as const;

/**
 * Read-only status label for a guardrail row (definition status, governance administration).
 *
 * Deliberately **not** `GuardrailChip`: that wraps a Radix `Toggle`, so it is a focusable
 * button carrying pressed state. These are labels, and rendering them as toggles would put
 * fake buttons in the tab order and misreport them to screen readers. It reuses the chip
 * family's pill geometry instead, so the two still read as one system.
 *
 * A `<span>` composed from wind's exported `badgeVariants`, not the `Badge` component, which
 * renders a `<div>`: the palette entry places these chips inside its `<button>`, and flow
 * content is invalid there. The classes are the badge's, so the two stay one system.
 */
const GuardrailStatusChip = React.forwardRef<HTMLSpanElement, GuardrailStatusChipProps>(
  ({ tone = 'neutral', className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="guardrail-status-chip"
      className={cn(
        badgeVariants({ variant: TONE_VARIANT[tone] }),
        'h-5',
        GUARDRAIL_CHIP_GEOMETRY,
        className
      )}
      {...props}
    />
  )
);
GuardrailStatusChip.displayName = 'GuardrailStatusChip';

export { GuardrailStatusChip };
