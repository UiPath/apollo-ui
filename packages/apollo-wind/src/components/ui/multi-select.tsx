import { Check, ChevronsUpDown, X } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/index";

export interface MultiSelectProps {
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
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      options,
      selected,
      onChange,
      placeholder = "Select items...",
      emptyMessage = "No items found.",
      className,
      maxSelected,
      disabled = false,
      searchPlaceholder = "Search...",
      clearAllText,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);

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

    return (
      <div ref={ref} className={cn("relative", className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label={selected.length > 0 ? `${selected.length} items selected` : placeholder}
              className={cn(
                "w-full justify-between",
                selected.length > 0 ? "h-auto min-h-10" : "h-10",
              )}
              disabled={disabled}
            >
              <div className="flex flex-wrap gap-1 flex-1">
                {selected.length === 0 ? (
                  <span className="text-muted-foreground">{placeholder}</span>
                ) : (
                  selected.map((value) => {
                    const option = options.find((opt) => opt.value === value);
                    return (
                      <Badge
                        key={value}
                        variant="secondary"
                        className="mr-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnselect(value);
                        }}
                      >
                        {option?.label}
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`Remove ${option?.label}`}
                          className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleUnselect(value);
                            }
                          }}
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
                        </span>
                      </Badge>
                    );
                  })
                )}
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
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
                        className={cn(isDisabled && "opacity-50 cursor-not-allowed")}
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible",
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </div>
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
                  {typeof clearAllText === "function"
                    ? clearAllText(selected.length)
                    : clearAllText || `Clear all (${selected.length})`}
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    );
  },
);
MultiSelect.displayName = "MultiSelect";

export { MultiSelect };
