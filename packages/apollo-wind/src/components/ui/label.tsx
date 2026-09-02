import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/index';

const labelVariants = cva(
  'inline-block text-xs peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        /** Names a field: the header above an input, select, or editor. */
        default: 'font-medium text-foreground',
        /** De-emphasized, for a label that names one option inside a field. */
        muted: 'font-normal text-foreground-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/** Variant props, for consumers that forward a variant through to `Label`. */
export type LabelVariants = VariantProps<typeof labelVariants>;

export type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & LabelVariants;

/**
 * Compose `RequiredIndicator` as the last child to mark a field required.
 *
 * Long labels wrap. Do not ellipsize one with `truncate`: the indicator shares
 * the label's inline run, so the ellipsis swallows it, and a clipped field name
 * is unreadable anyway.
 *
 * Renders `inline-block` rather than the `<label>` default of `inline`.
 * Vertical margins do nothing on an inline box, so under Tailwind v4, where
 * `space-y-*` puts `margin-block-end` on every child but the last, the gap a
 * `space-y-1.5` wrapper means to put under the label was silently dropped.
 * `inline-block` keeps the label usable in inline flow, which `block` would
 * not. As a grid or flex item the label is blockified anyway, so this changes
 * nothing inside `FormField`, and a consumer needing another display passes
 * one: `cn` merges `className` last.
 *
 * `data-variant` exposes the variant so a container can restyle every label of
 * one kind at once rather than reaching for each slot by name. Target it as
 * `label[data-variant=default]`: callers rename `data-slot`, and `data-variant`
 * alone is a convention other components share.
 */
const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <LabelPrimitive.Root
      ref={ref}
      data-slot="label"
      data-variant={variant}
      className={cn(labelVariants({ variant }), className)}
      {...props}
    />
  )
);
Label.displayName = LabelPrimitive.Root.displayName;

export interface RequiredIndicatorProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children' | 'aria-hidden'> {
  /**
   * Visually hidden text announced in place of the asterisk. apollo-wind ships
   * no i18n, so localized consumers pass their own translated string here.
   */
  srLabel?: string;
}

/**
 * Marks a field as required. Place it right after the label text.
 *
 * Uses the foreground color rather than an error/destructive color: an untouched
 * required field isn't in an error state, so coloring the asterisk red reads
 * as a validation failure before the person has done anything. The asterisk
 * glyph is `aria-hidden` since it's a visual affordance, not the thing that
 * makes the field required to assistive tech;
 * Use `required` or `aria-required` on the field's control for that.
 * Or pass `srLabel` to provide assistive announcements if the field's own control
 * is missing `required`/`aria-required`.
 */
const RequiredIndicator = React.forwardRef<HTMLSpanElement, RequiredIndicatorProps>(
  ({ className, srLabel, ...props }, ref) => (
    <span ref={ref} {...props} className={cn('ml-0.5', className, 'text-foreground')}>
      <span aria-hidden="true">*</span>
      {srLabel && <span className="sr-only">{srLabel}</span>}
    </span>
  )
);
RequiredIndicator.displayName = 'RequiredIndicator';

export { Label, RequiredIndicator };
