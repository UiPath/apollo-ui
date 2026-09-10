import { Badge, cn } from '@uipath/apollo-wind';
import * as React from 'react';
import { GUARDRAIL_CHIP_GEOMETRY } from './guardrail-chip';

export interface GuardrailStatusChipProps extends React.ComponentPropsWithoutRef<'div'> {
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
 */
const GuardrailStatusChip = React.forwardRef<HTMLDivElement, GuardrailStatusChipProps>(
  ({ tone = 'neutral', className, ...props }, ref) => (
    <Badge
      ref={ref}
      variant={TONE_VARIANT[tone]}
      data-slot="guardrail-status-chip"
      className={cn('h-5', GUARDRAIL_CHIP_GEOMETRY, className)}
      {...props}
    />
  )
);
GuardrailStatusChip.displayName = 'GuardrailStatusChip';

export { GuardrailStatusChip };
