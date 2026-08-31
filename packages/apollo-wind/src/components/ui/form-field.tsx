import * as React from 'react';

import { Label, RequiredIndicator } from '@/components/ui/label';
import { cn } from '@/lib/index';

export type FormFieldProps = React.ComponentPropsWithoutRef<'div'>;

/**
 * Vertical field anatomy: label, control, supporting text, validation message.
 *
 * These parts are presentational and hold no form state, so they compose the
 * same way inside a metadata-driven form as they do in hand-built panels.
 */
const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} data-slot="form-field" className={cn('grid gap-1.5', className)} {...props}>
      {children}
    </div>
  )
);
FormField.displayName = 'FormField';

export interface FormFieldLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
  /** Appends the required indicator after the label text. */
  required?: boolean;
}

/** Names the field. Pair with a control via `htmlFor`. */
const FormFieldLabel = React.forwardRef<HTMLLabelElement, FormFieldLabelProps>(
  ({ children, required = false, ...props }, ref) => (
    <Label ref={ref} data-slot="form-field-label" {...props}>
      {children}
      {required && <RequiredIndicator />}
    </Label>
  )
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
        data-slot="form-field-error"
        aria-live="polite"
        aria-atomic="true"
        className={cn('text-xs leading-4 text-error', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);
FormFieldError.displayName = 'FormFieldError';

export { FormField, FormFieldDescription, FormFieldError, FormFieldLabel };
