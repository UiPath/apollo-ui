import * as React from 'react';
import { cn } from '@/lib/utils';
import { FormFieldError } from './form-field';
import { useControlValidation, useInputGroup } from './input-group-context';

// Inside an InputGroup the group draws the box, so the input paints none of its own and lets the
// group's padding be the padding.
const IN_GROUP_CLASS =
  'h-full w-full rounded-none !border-0 !ring-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 future:h-full future:rounded-none future:border-0 future:bg-transparent future:p-0 future:focus-visible:ring-offset-0';

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
      variant: variantProp = 'default',
      size: sizeProp = 'default',
      ...props
    },
    ref
  ) => {
    const group = useInputGroup();
    // The group owns the box, so the input's own variant and size do not apply inside one.
    const variant = group.inGroup ? 'default' : variantProp;
    const size = group.inGroup ? 'default' : sizeProp;
    const generatedId = React.useId();
    const validationId = errorId ?? `${id ?? `input-${generatedId.replace(/:/g, '')}`}-error`;
    const validation = useControlValidation(group, {
      error,
      errorId: validationId,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
    });

    const input = (
      <input
        type={type}
        data-slot={group.inGroup ? 'input-group-control' : 'input'}
        id={id}
        {...props}
        {...validation.aria}
        disabled={props.disabled || group.disabled}
        className={cn(
          // Base styles (all themes)
          'flex w-full transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring read-only:cursor-default disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error aria-invalid:focus-visible:ring-error',
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
          group.inGroup && IN_GROUP_CLASS,
          className
        )}
        ref={ref}
      />
    );

    // Inside a group the input takes the row's free width, and the group renders the message.
    return (
      <>
        {group.inGroup ? <div className="min-w-0 flex-1">{input}</div> : input}
        {validation.ownMessage && <FormFieldError id={validationId}>{error}</FormFieldError>}
      </>
    );
  }
);
Input.displayName = 'Input';

export { Input };
