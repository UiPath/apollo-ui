import { Search as SearchIcon, X } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/index';

export interface SearchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  showClearButton?: boolean;
}

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  ({ className, value, onChange, onClear, showClearButton = true, ...props }, ref) => {
    const handleClear = () => {
      onChange?.('');
      onClear?.();
    };

    return (
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={ref}
          type="search"
          className={cn('pl-8 pr-8', className)}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          {...props}
        />
        {showClearButton && value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full w-8 px-0 hover:bg-transparent"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear</span>
          </Button>
        )}
      </div>
    );
  },
);
Search.displayName = 'Search';

export interface SearchWithSuggestionsProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  onSelect?: (value: string) => void;
  emptyMessage?: string;
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
      className,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState(value || '');

    React.useEffect(() => {
      if (value !== undefined) {
        setSearchValue(value);
      }
    }, [value]);

    const filteredSuggestions = suggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(searchValue.toLowerCase()),
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

    return (
      <div ref={ref} className={cn('relative', className)}>
        <Popover open={open && filteredSuggestions.length > 0} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div>
              <Search
                value={searchValue}
                onChange={handleInputChange}
                onClear={() => {
                  setSearchValue('');
                  onChange?.('');
                  setOpen(false);
                }}
                placeholder={placeholder}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
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
  },
);
SearchWithSuggestions.displayName = 'SearchWithSuggestions';

export { Search, SearchWithSuggestions };
