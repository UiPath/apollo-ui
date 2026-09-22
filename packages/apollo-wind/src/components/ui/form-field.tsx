import * as React from 'react';

import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Label, RequiredIndicator } from '@/components/ui/label';
import { cn } from '@/lib/index';

export type FormFieldProps = React.ComponentPropsWithoutRef<'div'>;

/**
 * Vertical field anatomy: label, control, supporting text, validation message.
 *
 * These parts are presentational and hold no form state, so they compose the
 * same way inside a metadata-driven form as they do in hand-built panels.
 *
 * The single column is pinned to `minmax(0, 1fr)` rather than left implicit.
 * An implicit `auto` track floors at its widest child's min-content, and a
 * control that ellipsizes is `white-space: nowrap`, so its min-content is the
 * whole string: the field would push past a width-constrained host instead of
 * truncating. A `1fr` track still resolves to max-content when the host width
 * is indefinite, so shrink-to-fit hosts are unaffected. `className` is merged
 * last, so a consumer can still override with `grid-cols-2` or similar.
 *
 * A direct-child validation message's own top margin is cancelled here
 * (`[&>[data-slot=form-field-error]]:mt-0`), since this stack's own `gap-1.5` already
 * spaces it -- otherwise the two would add up. Scoped to this component rather than a
 * bare `.gap-1.5` selector in global CSS: keeping it here means it compiles into
 * Tailwind's layered output (so a consumer's own margin utility can still win, at
 * (0,2,0) vs this rule's (0,1,0) within the same layer) and survives the field rhythm
 * changing out from under an unrelated stylesheet. A hand-built `grid gap-1.5` stack
 * that isn't `<FormField>` doesn't get this for free -- see `FieldExample` in
 * apps/storybook's guidance-primitives.tsx for the pattern to reach for instead of
 * reintroducing the cancellation ad hoc.
 */
const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="form-field"
      className={cn(
        'grid grid-cols-[minmax(0,1fr)] gap-1.5 [&>[data-slot=form-field-error]]:mt-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
FormField.displayName = 'FormField';

export interface FormFieldLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
  /** Appends the required indicator after the label text. */
  required?: boolean;
  /**
   * Appends an info-tooltip trigger after the label text and the required indicator.
   * Requires an ancestor `TooltipProvider` (Radix throws without one).
   */
  tooltip?: React.ReactNode;
  /** Accessible name of the tooltip trigger. Defaults to 'More information'. */
  tooltipAriaLabel?: string;
}

/** Names the field. Pair with a control via `htmlFor`. */
const FormFieldLabel = React.forwardRef<HTMLLabelElement, FormFieldLabelProps>(
  ({ children, required = false, tooltip, tooltipAriaLabel, className, ...props }, ref) => {
    const label = (
      <Label ref={ref} data-slot="form-field-label" className={className} {...props}>
        {children}
        {required && <RequiredIndicator />}
      </Label>
    );

    if (tooltip === undefined || tooltip === null || tooltip === false) return label;

    // The trigger is a real <button>, and <label>'s content model forbids descendant
    // labelable elements — nesting it would also make a click on the icon ambiguous with
    // activating the labelled control. So it sits *beside* the label in an inline wrapper,
    // which keeps the ref, `htmlFor` and styling on the label element itself.
    return (
      <span className="inline-flex items-center">
        {label}
        <InfoTooltip content={tooltip} aria-label={tooltipAriaLabel ?? 'More information'} />
      </span>
    );
  }
);
FormFieldLabel.displayName = 'FormFieldLabel';

export type FormFieldDescriptionProps = React.ComponentPropsWithoutRef<'p'>;

/** Supporting guidance rendered below a field control. */
const FormFieldDescription = React.forwardRef<HTMLParagraphElement, FormFieldDescriptionProps>(
  ({ children, className, ...props }, ref) => {
    if (!children) return null;
    return (
      <p
        ref={ref}
        data-slot="form-field-description"
        className={cn('text-xs leading-4 text-foreground-muted', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);
FormFieldDescription.displayName = 'FormFieldDescription';

export type FormFieldErrorProps = React.ComponentPropsWithoutRef<'p'>;

/**
 * Validation message rendered below a field control. Uses the `error` token
 * rather than `destructive`, which some themes resolve to a different color.
 */
const FormFieldError = React.forwardRef<HTMLParagraphElement, FormFieldErrorProps>(
  ({ children, className, ...props }, ref) => {
    if (!children) return null;
    return (
      <p
        ref={ref}
        aria-live="polite"
        aria-atomic="true"
        className={cn('text-xs leading-4 text-error mt-1.5', className)}
        {...props}
        // Always the canonical marker, even if a caller's own `data-slot` slips in through
        // `...props` -- FormField's gap-cancelling rule above depends on this exact value
        // being the one, stable way to find "the validation message" from any ancestor.
        data-slot="form-field-error"
      >
        {children}
      </p>
    );
  }
);
FormFieldError.displayName = 'FormFieldError';

export { FormField, FormFieldDescription, FormFieldError, FormFieldLabel };
