import type * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib';

/**
 * Tone of a guardrail list chip. `accent` marks provenance (governance-managed, preview),
 * `warning` and `error` mark a definition the tenant cannot currently use.
 */
export type GuardrailStatusChipTone = 'neutral' | 'accent' | 'warning' | 'error';

const TONE_VARIANT = {
  neutral: 'secondary',
  accent: 'info',
  warning: 'warning',
  error: 'error',
} as const satisfies Record<GuardrailStatusChipTone, React.ComponentProps<typeof Badge>['variant']>;

export interface GuardrailStatusChipProps extends React.ComponentPropsWithoutRef<typeof Badge> {
  tone?: GuardrailStatusChipTone;
}

/**
 * Static label pill for a guardrail row: status, origin, preview.
 *
 * Built on `Badge` rather than `GuardrailChip` on purpose. `GuardrailChip` wraps a Radix
 * Toggle, so it is a focusable button with pressed state; these chips are read-only text and
 * would put fake buttons in the tab order. The geometry matches `guardrailChipVariants` so the
 * two chip families still read as one system.
 */
export function GuardrailStatusChip({
  tone = 'neutral',
  className,
  ...props
}: GuardrailStatusChipProps) {
  return (
    <Badge
      data-slot="guardrail-status-chip"
      variant={TONE_VARIANT[tone]}
      className={cn('h-6 gap-1 whitespace-nowrap px-2.5 font-medium [&_svg]:size-3', className)}
      {...props}
    />
  );
}
