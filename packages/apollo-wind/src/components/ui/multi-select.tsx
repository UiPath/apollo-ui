import { ChevronsUpDown, X } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { InputGroupTrigger } from '@/components/ui/input-group';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/index';
import { FormFieldError } from './form-field';
import { useControlValidation, useInputGroup } from './input-group-context';

export interface MultiSelectProps {
  /** Applied to the trigger button, so a `<label htmlFor>` pointing at it associates correctly. */
  id?: string;
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  maxSelected?: number;
  disabled?: boolean;
  searchPlaceholder?: string;
  clearAllText?: string | ((count: number) => string);
  /** Called when the multi-select popover closes after being opened. */
  onBlur?: () => void;
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

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      id,
      options,
      selected,
      onChange,
      placeholder = 'Select items...',
      emptyMessage = 'No items found.',
      className,
      maxSelected,
      disabled = false,
      searchPlaceholder = 'Search...',
      clearAllText,
      onBlur,
      error,
      errorId,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    // Inside an InputGroup the trigger is the group's control, and the panel anchors to the group's
    // box, so it opens below the box's border and matches its width rather than the inset trigger's.
    const group = useInputGroup();
    const groupAnchor = group.anchor;
    const grouped = group.inGroup;
    const generatedId = React.useId();
    const validationId =
      errorId ?? `${id ?? `multi-select-${generatedId.replace(/:/g, '')}`}-error`;

    const handleUnselect = (value: string) => {
      onChange(selected.filter((s) => s !== value));
    };

    const handleSelect = (value: string) => {
      if (selected.includes(value)) {
        handleUnselect(value);
      } else {
        if (maxSelected && selected.length >= maxSelected) {
          return;
        }
        onChange([...selected, value]);
      }
    };

    const handleClearAll = () => {
      onChange([]);
    };

    const validation = useControlValidation(group, {
      error,
      errorId: validationId,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
    });
    const triggerProps = {
      id,
      role: 'combobox',
      'aria-expanded': open,
      ...validation.aria,
      // aria-label always wins over a `<label htmlFor>` association in the
      // accessible-name computation, so only set it when there's no id for a
      // consumer's label to target -- otherwise the label's own text names
      // the field, same as any other labelable control (Input, Select, ...).
      'aria-label': id
        ? undefined
        : selected.length > 0
          ? `${selected.length} ${selected.length === 1 ? 'item' : 'items'} selected`
          : placeholder,
      disabled: disabled || group.disabled,
    } as const;

    const triggerContent = (
      <>
        {/* In a group, the chips and caret share the enclosing row's first line: one row of chips
            is exactly that line's height, and the caret stays on it as the chips wrap, as the
            shell's own trailing affordance does. */}
        <div
          className={cn(
            'flex flex-wrap gap-1 flex-1',
            grouped && 'min-h-6.5 items-center py-0.5 future:min-h-6 future:py-px'
          )}
        >
          {selected.length === 0 ? (
            <span className="text-foreground-muted">{placeholder}</span>
          ) : (
            selected.map((value) => {
              const option = options.find((opt) => opt.value === value);
              return (
                <Badge
                  key={value}
                  variant="secondary"
                  className="mr-1 future:bg-surface-raised future:hover:bg-surface-raised"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnselect(value);
                  }}
                >
                  {option?.label}
                  <button
                    type="button"
                    aria-label={`Remove ${option?.label}`}
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer bg-transparent border-0 p-0 inline-flex items-center"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUnselect(value);
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              );
            })
          )}
        </div>
        {grouped ? (
          <span className="flex h-6.5 shrink-0 items-center self-start future:h-6">
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </span>
        ) : (
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        )}
      </>
    );

    return (
      <div
        ref={ref}
        data-slot="multi-select"
        // In a group, this root is the group's flex item, so it takes the row's free width.
        className={cn('relative', grouped && 'min-w-0 flex-1', className)}
      >
        <Popover
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen && open) onBlur?.();
          }}
        >
          <PopoverTrigger asChild>
            {grouped ? (
              <InputGroupTrigger
                {...triggerProps}
                className={cn('items-start', selected.length > 0 && 'h-auto')}
              >
                {triggerContent}
              </InputGroupTrigger>
            ) : (
              <Button
                variant="outline"
                {...triggerProps}
                className={cn(
                  'w-full justify-between future:rounded-xl future:border-0 future:bg-surface-overlay future:px-4 future:gap-4 future:hover:bg-surface-hover future:font-normal future:text-foreground future:focus-visible:ring-offset-2 future:focus-visible:ring-offset-background',
                  selected.length > 0 ? 'h-auto min-h-10' : 'h-10'
                )}
              >
                {triggerContent}
              </Button>
            )}
          </PopoverTrigger>
          {/* After the trigger: Radix records the anchor in effects, which run in tree order, so
              an anchor placed first is replaced by the trigger's own. */}
          {groupAnchor && (
            <PopoverAnchor virtualRef={groupAnchor as React.RefObject<HTMLElement>} />
          )}
          <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
            <Command>
              <CommandInput placeholder={searchPlaceholder} />
              <CommandList>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => {
                    const isSelected = selected.includes(option.value);
                    const isDisabled =
                      maxSelected !== undefined && selected.length >= maxSelected && !isSelected;

                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => {
                          if (!isDisabled) {
                            handleSelect(option.value);
                          }
                        }}
                        disabled={isDisabled}
                        className={cn('group', isDisabled && 'opacity-50 cursor-not-allowed')}
                      >
                        <Checkbox
                          checked={isSelected}
                          className="mr-2 pointer-events-none group-hover:border-muted-foreground"
                          tabIndex={-1}
                        />
                        <span>{option.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
            {selected.length > 0 && (
              <div className="border-t p-2">
                <Button variant="ghost" size="sm" className="w-full" onClick={handleClearAll}>
                  {typeof clearAllText === 'function'
                    ? clearAllText(selected.length)
                    : clearAllText || `Clear all (${selected.length})`}
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        {/* Inside a group, the group renders the message below its box. */}
        {validation.ownMessage && <FormFieldError id={validationId}>{error}</FormFieldError>}
      </div>
    );
  }
);
MultiSelect.displayName = 'MultiSelect';

export { MultiSelect };
