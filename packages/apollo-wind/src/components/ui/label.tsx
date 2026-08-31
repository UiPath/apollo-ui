import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/index';

const labelVariants = cva(
  'text-xs font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

export type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants>;

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, ...props }, ref) => (
    <LabelPrimitive.Root
      ref={ref}
      data-slot="label"
      className={cn(labelVariants(), className)}
      {...props}
    />
  )
);
Label.displayName = LabelPrimitive.Root.displayName;

export interface RequiredIndicatorProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children' | 'aria-hidden'> {}

/**
 * Marks a field as required. Place it right after the label text.
 *
 * Uses `text-current` rather than an error/destructive color: an untouched
 * required field isn't in an error state, so coloring the asterisk red reads
 * as a validation failure before the person has done anything. The asterisk
 * glyph is `aria-hidden` since it's a visual affordance, not the thing that
 * makes the field required to assistive tech; a `sr-only` "(required)" is
 * included alongside it so the label still announces the requirement even if
 * the field's own control is missing `required`/`aria-required`.
 */
const RequiredIndicator = React.forwardRef<HTMLSpanElement, RequiredIndicatorProps>(
  ({ className, ...props }, ref) => (
    <span ref={ref} {...props} className={cn('ml-0.5 text-current', className)}>
      <span aria-hidden="true">*</span>
      <span className="sr-only"> (required)</span>
    </span>
  )
);
RequiredIndicator.displayName = 'RequiredIndicator';

export { Label, RequiredIndicator };
