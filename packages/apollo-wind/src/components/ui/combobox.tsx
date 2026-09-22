'use client';

import { Check, ChevronDown } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib';
import { FormFieldError } from './form-field';

export interface ComboboxItem {
  value: string;
  label: string;
}

export interface ComboboxProps {
  /** Applied to the trigger button, so a `<label htmlFor>` pointing at it associates correctly. */
  id?: string;
  items: ComboboxItem[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  /**
   * Field-specific feedback rendered immediately below the trigger.
   * Keep the message focused on what went wrong and how to resolve it.
   */
  error?: React.ReactNode;
  /** Optional id for the inline validation message. */
  errorId?: string;
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
  'aria-describedby'?: string;
  'aria-errormessage'?: string;
}

export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(function Combobox(
  {
    id,
    items,
    value,
    onValueChange,
    placeholder = 'Select an option...',
    searchPlaceholder = 'Search...',
    emptyText = 'No results found.',
    disabled,
    className,
    error,
    errorId,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
  },
  ref
) {
  const [open, setOpen] = React.useState(false);
  const generatedId = React.useId();
  const validationId = errorId ?? `${id ?? `combobox-${generatedId.replace(/:/g, '')}`}-error`;
  const describedBy = [ariaDescribedBy, error ? validationId : undefined].filter(Boolean).join(' ');

  const selectedItem = items.find((item) => item.value === value);

  return (
    // A Fragment: keeps the trigger's element type stable across renders so toggling `error`
    // never remounts it and drops focus mid-interaction (a conditional wrapper would).
    <>
      <Popover data-slot="combobox" open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            // aria-label always wins over a `<label htmlFor>` association in the
            // accessible-name computation, so only set it when there's no id for a
            // consumer's label to target (same pattern as MultiSelect).
            aria-label={id ? undefined : selectedItem ? selectedItem.label : placeholder}
            aria-describedby={describedBy || undefined}
            aria-errormessage={error ? validationId : ariaErrorMessage}
            aria-invalid={error ? true : ariaInvalid}
            className={cn(
              'w-[280px] justify-between future:h-10 future:rounded-xl future:border-0 future:bg-surface-overlay future:px-4 future:gap-4 future:hover:bg-surface-hover future:font-normal future:text-foreground future:focus-visible:ring-offset-2 future:focus-visible:ring-offset-background',
              className
            )}
            disabled={disabled}
          >
            {selectedItem ? (
              selectedItem.label
            ) : (
              <span className="text-foreground-muted">{placeholder}</span>
            )}
            <ChevronDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={(currentValue) => {
                      onValueChange?.(currentValue === value ? '' : currentValue);
                      setOpen(false);
                    }}
                  >
                    {item.label}
                    <Check
                      className={cn('ml-auto', value === item.value ? 'opacity-100' : 'opacity-0')}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <FormFieldError id={validationId}>{error}</FormFieldError>
    </>
  );
});
