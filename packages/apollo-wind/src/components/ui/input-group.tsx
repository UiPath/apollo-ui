import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Input, type InputProps } from '@/components/ui/input';
import { Textarea, type TextareaProps } from '@/components/ui/textarea';
import { cn } from '@/lib';

interface InputGroupValidationContextValue {
  error?: React.ReactNode;
  errorId?: string;
}

const InputGroupValidationContext = React.createContext<InputGroupValidationContextValue>({});

export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'ghost';
  size?: 'default' | 'xs';
  /** Field-specific validation feedback rendered below the grouped control. */
  error?: React.ReactNode;
  /** Optional id for the inline validation message. */
  errorId?: string;
}

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, error, errorId, variant = 'default', size = 'default', ...props }, ref) => {
    const generatedId = React.useId();
    const validationId = errorId ?? `input-group-${generatedId.replace(/:/g, '')}-error`;

    return (
      <InputGroupValidationContext.Provider value={{ error, errorId: validationId }}>
        {/* biome-ignore lint/a11y/useSemanticElements: input groups need role="group" to convey relationship between the field and its addons */}
        <div
          ref={ref}
          role="group"
          className={cn(
            'group/input-group relative flex w-full items-center gap-2 transition-colors has-[>textarea]:h-auto has-[>textarea]:items-start',
            // Size (mirrors Input's own size scale, since Input's box chrome moves up to this wrapper)
            size === 'default' &&
              'h-9 rounded-md px-3 py-1 future:h-10 future:rounded-xl future:py-2',
            size === 'xs' && 'h-6 gap-1 rounded px-2',
            // Variant (mirrors Input's own variant treatment exactly)
            variant === 'default' &&
              'border border-input bg-transparent future:border-0 future:bg-surface-overlay',
            variant === 'ghost' && 'border-0 bg-surface-overlay',
            // Focus state, forwarded from the inner control
            'has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-ring future:has-[[data-slot=input-group-control]:focus-visible]:ring-offset-2 future:has-[[data-slot=input-group-control]:focus-visible]:ring-offset-background',
            // Error state
            'has-[[data-slot][aria-invalid=true]]:border-error has-[[data-slot][aria-invalid=true]]:ring-error/20 future:has-[[data-slot][aria-invalid=true]]:ring-1 future:has-[[data-slot][aria-invalid=true]]:ring-error/40',
            error && 'border-error ring-error/20 future:ring-1 future:ring-error/40',
            // Disabled state
            'has-[[data-slot=input-group-control]:disabled]:cursor-not-allowed has-[[data-slot=input-group-control]:disabled]:opacity-50',
            className
          )}
          {...props}
        />
        {error && (
          <p
            id={validationId}
            data-slot="input-group-error"
            aria-live="polite"
            aria-atomic="true"
            className="mt-1 text-xs leading-4 text-error"
          >
            {error}
          </p>
        )}
      </InputGroupValidationContext.Provider>
    );
  }
);
InputGroup.displayName = 'InputGroup';

const inputGroupAddonVariants = cva(
  'flex h-auto cursor-text items-center justify-center gap-1 text-sm text-muted-foreground select-none group-has-[[data-slot=input-group-control]:disabled]/input-group:opacity-50 [&>svg:not([class*="size-"])]:size-4',
  {
    variants: {
      align: {
        'inline-start': 'order-first',
        'inline-end': 'order-last',
      },
    },
    defaultVariants: {
      align: 'inline-start',
    },
  }
);

export interface InputGroupAddonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof inputGroupAddonVariants> {}

const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, align = 'inline-start', onClick, ...props }, ref) => {
    return (
      // biome-ignore lint/a11y/useSemanticElements: addons need role="group" to convey relationship to the field they augment
      // biome-ignore lint/a11y/useKeyWithClickEvents: onClick only forwards focus to the field as a mouse convenience; the addon's actual interactive elements (buttons) remain independently keyboard-operable
      <div
        ref={ref}
        role="group"
        data-slot="input-group-addon"
        data-align={align}
        className={cn(inputGroupAddonVariants({ align }), className)}
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest('button')) {
            e.currentTarget.parentElement
              ?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')
              ?.focus();
          }
          onClick?.(e);
        }}
        {...props}
      />
    );
  }
);
InputGroupAddon.displayName = 'InputGroupAddon';

export interface InputGroupButtonProps extends ButtonProps {}

const InputGroupButton = React.forwardRef<HTMLButtonElement, InputGroupButtonProps>(
  ({ className, type = 'button', variant = 'ghost', size = 'xs', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        type={type}
        variant={variant}
        size={size}
        className={cn('gap-1', className)}
        {...props}
      />
    );
  }
);
InputGroupButton.displayName = 'InputGroupButton';

export interface InputGroupTextProps extends React.HTMLAttributes<HTMLSpanElement> {}

const InputGroupText = React.forwardRef<HTMLSpanElement, InputGroupTextProps>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'flex items-center gap-1 text-sm text-muted-foreground [&>svg:not([class*="size-"])]:size-4',
          className
        )}
        {...props}
      />
    );
  }
);
InputGroupText.displayName = 'InputGroupText';

export interface InputGroupInputProps
  extends Omit<InputProps, 'variant' | 'size' | 'error' | 'errorId'> {}

const InputGroupInput = React.forwardRef<HTMLInputElement, InputGroupInputProps>(
  (
    {
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
      'aria-invalid': ariaInvalid,
      className,
      ...props
    },
    ref
  ) => {
    const validation = React.useContext(InputGroupValidationContext);
    const describedBy = [ariaDescribedBy, validation.error ? validation.errorId : undefined]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="min-w-0 flex-1">
        <Input
          ref={ref}
          data-slot="input-group-control"
          aria-describedby={describedBy || undefined}
          aria-errormessage={validation.error ? validation.errorId : ariaErrorMessage}
          aria-invalid={validation.error ? true : ariaInvalid}
          className={cn(
            'h-full w-full rounded-none !border-0 !ring-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 future:h-full future:rounded-none future:border-0 future:bg-transparent future:p-0 future:focus-visible:ring-offset-0',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
InputGroupInput.displayName = 'InputGroupInput';

export interface InputGroupTextareaProps extends Omit<TextareaProps, 'variant'> {}

const InputGroupTextarea = React.forwardRef<HTMLTextAreaElement, InputGroupTextareaProps>(
  (
    {
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
      'aria-invalid': ariaInvalid,
      className,
      ...props
    },
    ref
  ) => {
    const validation = React.useContext(InputGroupValidationContext);
    const describedBy = [ariaDescribedBy, validation.error ? validation.errorId : undefined]
      .filter(Boolean)
      .join(' ');

    return (
      <Textarea
        ref={ref}
        data-slot="input-group-control"
        aria-describedby={describedBy || undefined}
        aria-errormessage={validation.error ? validation.errorId : ariaErrorMessage}
        aria-invalid={validation.error ? true : ariaInvalid}
        className={cn(
          'min-h-0 flex-1 resize-none rounded-none !border-0 !ring-0 bg-transparent p-0 py-2 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 future:rounded-none future:border-0 future:bg-transparent future:focus-visible:ring-offset-0',
          className
        )}
        {...props}
      />
    );
  }
);
InputGroupTextarea.displayName = 'InputGroupTextarea';

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
