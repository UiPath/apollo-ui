import * as React from 'react';
import { cn } from '@/lib/utils';
import { FormFieldError } from './form-field';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'ghost';
  size?: 'default' | 'xs';
  /**
   * Field-specific feedback rendered immediately below the input.
   * Keep the message focused on what went wrong and how to resolve it.
   */
  error?: React.ReactNode;
  /** Optional id for the inline validation message. */
  errorId?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
      'aria-invalid': ariaInvalid,
      className,
      error,
      errorId,
      id,
      type,
      variant = 'default',
      size = 'default',
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const validationId = errorId ?? `${id ?? `input-${generatedId.replace(/:/g, '')}`}-error`;
    const describedBy = [ariaDescribedBy, error ? validationId : undefined]
      .filter(Boolean)
      .join(' ');

    return (
      <>
        <input
          type={type}
          data-slot="input"
          id={id}
          {...props}
          aria-describedby={describedBy || undefined}
          aria-errormessage={error ? validationId : ariaErrorMessage}
          aria-invalid={error ? true : ariaInvalid}
          className={cn(
            // Base styles (all themes)
            'flex w-full transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error aria-invalid:focus-visible:ring-error',
            // Size
            size === 'default' &&
              'h-9 rounded-md px-3 py-1 text-base placeholder:text-muted-foreground md:text-sm',
            size === 'xs' && 'h-6 rounded px-2 text-xs placeholder:text-muted-foreground',
            // Variant
            variant === 'default' && 'border border-input bg-transparent',
            variant === 'ghost' && 'border-0 bg-surface-overlay',
            // Future theme overrides apply only to the default variant + default size
            variant === 'default' &&
              size === 'default' &&
              'future:h-10 future:rounded-xl future:border-0 future:bg-surface-overlay future:py-2 future:text-sm future:placeholder:text-foreground-muted future:placeholder:font-normal future:focus-visible:ring-offset-2 future:focus-visible:ring-offset-background future:aria-invalid:ring-1 future:aria-invalid:ring-error/40',
            className
          )}
          ref={ref}
        />
        <FormFieldError id={validationId} data-slot="input-error" className="mt-1">
          {error}
        </FormFieldError>
      </>
    );
  }
);
Input.displayName = 'Input';

export { Input };
