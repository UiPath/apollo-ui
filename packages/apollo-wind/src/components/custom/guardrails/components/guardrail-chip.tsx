import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib';

const guardrailChipVariants = cva(
  // Pill geometry over Toggle's base (which contributes the focus ring, disabled handling,
  // and data-[state] hooks). h-6/px-2.5/text-xs matches the compact chip scale.
  'h-6 min-w-0 gap-1 rounded-full border px-2.5 text-xs font-medium [&_svg]:size-3',
  {
    variants: {
      appearance: {
        default:
          'bg-background text-foreground border-border hover:bg-muted hover:text-foreground data-[state=on]:bg-brand-subtle data-[state=on]:text-foreground-accent data-[state=on]:border-brand-lighter',
        // Dashed affordance for items that can be added but are not currently targeted.
        addable:
          'border-dashed bg-background text-foreground-muted border-border hover:bg-muted hover:text-foreground',
      },
    },
    defaultVariants: { appearance: 'default' },
  }
);

export interface GuardrailChipProps
  extends React.ComponentPropsWithoutRef<typeof Toggle>,
    VariantProps<typeof guardrailChipVariants> {}

/** Toggleable pill used for scopes, entities, and tool targeting in the guardrail forms. */
const GuardrailChip = React.forwardRef<HTMLButtonElement, GuardrailChipProps>(
  ({ appearance, className, ...props }, ref) => (
    <Toggle
      ref={ref}
      data-slot="guardrail-chip"
      className={cn(guardrailChipVariants({ appearance, className }))}
      {...props}
    />
  )
);
GuardrailChip.displayName = 'GuardrailChip';

export { GuardrailChip, guardrailChipVariants };
