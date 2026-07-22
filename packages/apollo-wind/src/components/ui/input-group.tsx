import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Input, type InputProps } from '@/components/ui/input';
import { Textarea, type TextareaProps } from '@/components/ui/textarea';
import { cn } from '@/lib';

export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'ghost';
  size?: 'default' | 'xs';
}

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      // biome-ignore lint/a11y/useSemanticElements: input groups need role="group" to convey relationship between the field and its addons
      <div
        ref={ref}
        role="group"
        className={cn(
          'group/input-group relative flex w-full items-center gap-2 transition-colors has-[>textarea]:h-auto has-[>textarea]:items-start',
          // Block-aligned addons (toolbar rows) stack the group into a column instead of
          // sitting inline. `!` is required: these must win over the unconditional height/
          // items-center utilities below regardless of Tailwind's generated rule order,
          // since has-[]: variants and plain utilities aren't reconciled by class merging.
          'has-[>[data-align=block-start]]:!h-auto has-[>[data-align=block-start]]:!flex-col has-[>[data-align=block-start]]:!items-stretch',
          'has-[>[data-align=block-end]]:!h-auto has-[>[data-align=block-end]]:!flex-col has-[>[data-align=block-end]]:!items-stretch',
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
          'has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-destructive/20',
          // Disabled state
          'has-[[data-slot=input-group-control]:disabled]:cursor-not-allowed has-[[data-slot=input-group-control]:disabled]:opacity-50',
          className
        )}
        {...props}
      />
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
        'block-start': 'order-first w-full basis-full justify-start',
        'block-end': 'order-last w-full basis-full justify-start border-t border-input',
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

export interface InputGroupInputProps extends Omit<InputProps, 'variant' | 'size'> {}

const InputGroupInput = React.forwardRef<HTMLInputElement, InputGroupInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        data-slot="input-group-control"
        className={cn(
          'h-full flex-1 rounded-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 future:h-full future:rounded-none future:border-0 future:bg-transparent future:p-0 future:focus-visible:ring-offset-0',
          className
        )}
        {...props}
      />
    );
  }
);
InputGroupInput.displayName = 'InputGroupInput';

export interface InputGroupTextareaProps extends Omit<TextareaProps, 'variant'> {}

const InputGroupTextarea = React.forwardRef<HTMLTextAreaElement, InputGroupTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <Textarea
        ref={ref}
        data-slot="input-group-control"
        className={cn(
          'min-h-0 flex-1 resize-none rounded-none border-0 bg-transparent p-0 py-2 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 future:rounded-none future:border-0 future:bg-transparent future:focus-visible:ring-offset-0',
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
