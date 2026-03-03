import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { Column } from "@tanstack/react-table";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataTableFacetedFilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title: string;
  options: DataTableFacetedFilterOption[];
  className?: string;
  noOptionsMessage?: React.ReactNode;
}

function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  className,
  noOptionsMessage,
}: DataTableFacetedFilterProps<TData, TValue>) {
  "use no memo";
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  if (!column) return null;

  const selectedValues = new Set(
    (column.getFilterValue() as string[] | undefined) ?? [],
  );

  const handleToggle = (value: string) => {
    const next = new Set(selectedValues);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    const arr = Array.from(next);
    column.setFilterValue(arr.length > 0 ? arr : undefined);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    column.setFilterValue(undefined);
  };

  return (
    <div data-slot="data-table-faceted-filter" className={className}>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 justify-between gap-2 font-normal hover:bg-accent",
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="shrink-0 text-sm font-medium">
                {title}
                {selectedValues.size > 0 && ` (${selectedValues.size})`}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {selectedValues.size > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="group flex items-center justify-center rounded-sm p-0.5 transition-colors hover:bg-muted"
                >
                  <XIcon className="h-4 w-4 opacity-50 transition-opacity group-hover:opacity-100" />
                </button>
              )}
              <ChevronDownIcon className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            className={cn(
              "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-[250px] max-h-[400px] overflow-y-auto rounded-md border shadow-md p-1",
            )}
            sideOffset={4}
          >
            {options.length === 0
              ? noOptionsMessage
              : options.map((option) => {
                  const isSelected = selectedValues.has(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleToggle(option.value)}
                      className={cn(
                        "relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground",
                      )}
                    >
                      <span className="absolute left-2 flex size-3.5 items-center justify-center">
                        {isSelected && (
                          <CheckIcon className="size-4 text-primary" />
                        )}
                      </span>
                      {option.icon && (
                        <option.icon className="size-4 text-muted-foreground" />
                      )}
                      <span className="flex-1 text-left">{option.label}</span>
                    </button>
                  );
                })}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}

export { DataTableFacetedFilter };
export type { DataTableFacetedFilterOption };
