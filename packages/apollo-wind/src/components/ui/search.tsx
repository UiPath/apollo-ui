import { Search as SearchIcon, X } from 'lucide-react';
import * as React from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  type InputGroupInputProps,
  type InputGroupProps,
} from '@/components/ui/input-group';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { cn, composeRefs } from '@/lib/index';

interface SearchBaseProps extends Omit<InputGroupInputProps, 'onChange'> {
  value?: string;
  onClear?: () => void;
  showClearButton?: boolean;
  clearLabel?: string;
  variant?: InputGroupProps['variant'];
  size?: InputGroupProps['size'];
  /** Field-specific feedback rendered immediately below the search field. */
  error?: React.ReactNode;
  /** Optional id for the inline validation message. */
  errorId?: string;
}

/**
 * Two modes:
 * - Standard (new integrations; required with `asChild` wrappers like
 *   cmdk `Command.Input` or Radix Slot): pass `onValueChange` for the
 *   string value; `onChange` receives the native event.
 * - Legacy (existing consumers): omit `onValueChange`;
 *   `onChange` receives the string value.
 */
export type SearchProps = SearchBaseProps &
  (
    | {
        onValueChange: (value: string) => void;
        onChange?: React.ChangeEventHandler<HTMLInputElement>;
      }
    | {
        onValueChange?: undefined;
        /** @deprecated Pass `onValueChange` instead; `onChange` will receive the native event. */
        onChange?: (value: string) => void;
      }
  );

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  (
    {
      className,
      value,
      onChange,
      onValueChange,
      onClear,
      showClearButton = true,
      clearLabel = 'Clear',
      variant,
      size,
      error,
      errorId,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const setRef = React.useMemo(() => composeRefs(ref, inputRef), [ref]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onValueChange) {
        onChange?.(e);
        onValueChange(e.target.value);
      } else {
        onChange?.(e.target.value);
      }
    };

    // Clear through a real input event so every onChange listener (incl. asChild wrappers) sees it.
    const handleClear = () => {
      const input = inputRef.current;
      if (input) {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, '');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
      }
      onClear?.();
    };

    return (
      <InputGroup data-slot="search" variant={variant} size={size} error={error} errorId={errorId}>
        <InputGroupAddon align="inline-start">
          <SearchIcon className="text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupInput
          ref={setRef}
          type="search"
          className={cn(
            '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
            className
          )}
          value={value}
          onChange={handleChange}
          {...props}
        />
        {showClearButton && value && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton icon size="3xs" aria-label={clearLabel} onClick={handleClear}>
              <X />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    );
  }
);
Search.displayName = 'Search';

export interface SearchWithSuggestionsProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  onSelect?: (value: string) => void;
  emptyMessage?: string;
  /** Accessible label for the clear button. Pass a translated string. */
  clearLabel?: string;
  className?: string;
}

const SearchWithSuggestions = React.forwardRef<HTMLDivElement, SearchWithSuggestionsProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Search...',
      suggestions = [],
      onSelect,
      emptyMessage = 'No results found.',
      clearLabel,
      className,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const popupId = React.useId();
    const [searchValue, setSearchValue] = React.useState(value || '');

    React.useEffect(() => {
      if (value !== undefined) {
        setSearchValue(value);
      }
    }, [value]);

    const filteredSuggestions = suggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(searchValue.toLowerCase())
    );

    const handleSelect = (selectedValue: string) => {
      setSearchValue(selectedValue);
      onChange?.(selectedValue);
      onSelect?.(selectedValue);
      setOpen(false);
    };

    const handleInputChange = (newValue: string) => {
      setSearchValue(newValue);
      onChange?.(newValue);
      setOpen(newValue.length > 0);
    };

    const isOpen = open && filteredSuggestions.length > 0;

    return (
      <div ref={ref} data-slot="search-with-suggestions" className={cn('relative', className)}>
        <Popover open={isOpen} onOpenChange={setOpen}>
          <PopoverAnchor asChild>
            <div ref={anchorRef}>
              <Search
                value={searchValue}
                onValueChange={handleInputChange}
                onClick={() => setOpen(true)}
                clearLabel={clearLabel}
                placeholder={placeholder}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-controls={isOpen ? popupId : undefined}
              />
            </div>
          </PopoverAnchor>
          <PopoverContent
            id={popupId}
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
            // Keep focus in the input so typing continues while suggestions show.
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
            }}
          >
            <Command>
              <CommandList>
                {filteredSuggestions.length === 0 ? (
                  <CommandEmpty>{emptyMessage}</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {filteredSuggestions.map((suggestion) => (
                      <CommandItem key={suggestion} onSelect={() => handleSelect(suggestion)}>
                        <SearchIcon className="mr-2 h-4 w-4" />
                        {suggestion}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);
SearchWithSuggestions.displayName = 'SearchWithSuggestions';

export { Search, SearchWithSuggestions };
