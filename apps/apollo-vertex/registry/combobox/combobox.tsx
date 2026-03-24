"use client";

import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ComboboxContextValue {
  open: boolean;
  multiple: boolean;
  value: string[];
  onValueChange: (values: string[]) => void;
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null);

function useComboboxContext() {
  const context = React.use(ComboboxContext);
  if (!context) {
    throw new Error("Combobox components must be used within a <Combobox />");
  }
  return context;
}

interface ComboboxProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  multiple?: boolean;
  value?: string[];
  onValueChange?: (values: string[]) => void;
  children: React.ReactNode;
}

function Combobox({
  open: controlledOpen,
  onOpenChange,
  multiple = false,
  value: controlledValue,
  onValueChange,
  children,
}: ComboboxProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string[]>(
    [],
  );

  const isValueControlled = controlledValue != null;
  const open = controlledOpen ?? uncontrolledOpen;
  const value = controlledValue ?? uncontrolledValue;

  function setOpen(next: boolean) {
    (controlledOpen == null ? setUncontrolledOpen : onOpenChange)?.(next);
  }

  function handleValueChange(next: string[]) {
    const handler = isValueControlled ? onValueChange : setUncontrolledValue;
    handler?.(next);
    if (!multiple) {
      setOpen(false);
    }
  }

  const contextValue: ComboboxContextValue = {
    open,
    multiple,
    value,
    onValueChange: handleValueChange,
  };

  return (
    <ComboboxContext value={contextValue}>
      <Popover open={open} onOpenChange={setOpen}>
        {children}
      </Popover>
    </ComboboxContext>
  );
}

interface ComboboxTriggerProps extends React.ComponentProps<"div"> {
  placeholder?: string;
}

function ComboboxTrigger({
  className,
  placeholder,
  children,
  ...props
}: ComboboxTriggerProps) {
  const { open } = useComboboxContext();

  return (
    <PopoverTrigger asChild>
      <div
        data-slot="combobox-trigger"
        role="combobox"
        tabIndex={0}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-between font-normal",
          !children && "text-muted-foreground",
          className,
        )}
        {...props}
      >
        {children ?? <span className="truncate">{placeholder}</span>}
        <ChevronsUpDownIcon className="ml-auto size-4 shrink-0 opacity-50" />
      </div>
    </PopoverTrigger>
  );
}

interface ComboboxContentProps
  extends React.ComponentProps<typeof PopoverContent> {
  filter?: (value: string, search: string, keywords?: string[]) => number;
}

function ComboboxContent({
  className,
  children,
  filter,
  ...props
}: ComboboxContentProps) {
  return (
    <PopoverContent
      data-slot="combobox-content"
      className={cn("w-(--radix-popover-trigger-width) p-0", className)}
      {...props}
    >
      <Command filter={filter}>{children}</Command>
    </PopoverContent>
  );
}

type ComboboxInputProps = React.ComponentProps<typeof CommandInput>;

function ComboboxInput({ ...props }: ComboboxInputProps) {
  return <CommandInput data-slot="combobox-input" {...props} />;
}

type ComboboxListProps = React.ComponentProps<typeof CommandList>;

function ComboboxList({ className, ...props }: ComboboxListProps) {
  return (
    <CommandList
      data-slot="combobox-list"
      className={cn("max-h-[300px]", className)}
      {...props}
    />
  );
}

type ComboboxEmptyProps = React.ComponentProps<typeof CommandEmpty>;

function ComboboxEmpty({ ...props }: ComboboxEmptyProps) {
  return <CommandEmpty data-slot="combobox-empty" {...props} />;
}

type ComboboxGroupProps = React.ComponentProps<typeof CommandGroup>;

function ComboboxGroup({ ...props }: ComboboxGroupProps) {
  return <CommandGroup data-slot="combobox-group" {...props} />;
}

interface ComboboxItemProps
  extends Omit<React.ComponentProps<typeof CommandItem>, "onSelect"> {
  value: string;
}

function ComboboxItem({
  className,
  value: itemValue,
  children,
  ...props
}: ComboboxItemProps) {
  const {
    value: selectedValues,
    multiple,
    onValueChange,
  } = useComboboxContext();
  const isSelected = selectedValues.includes(itemValue);

  function handleSelect() {
    const next = isSelected
      ? selectedValues.filter((v) => v !== itemValue)
      : multiple
        ? [...selectedValues, itemValue]
        : [itemValue];
    onValueChange(next);
  }

  return (
    <CommandItem
      data-slot="combobox-item"
      data-selected={isSelected}
      value={itemValue}
      onSelect={handleSelect}
      className={cn(className)}
      {...props}
    >
      <CheckIcon
        className={cn(
          "size-4 shrink-0",
          isSelected ? "opacity-100" : "opacity-0",
        )}
      />
      {children}
    </CommandItem>
  );
}

type ComboboxBadgeListProps = React.ComponentProps<"div">;

function ComboboxBadgeList({ className, ...props }: ComboboxBadgeListProps) {
  return (
    <div
      data-slot="combobox-badge-list"
      className={cn("flex flex-wrap gap-1", className)}
      {...props}
    />
  );
}

interface ComboboxBadgeProps extends React.ComponentProps<typeof Badge> {
  value: string;
  onRemove?: () => void;
}

function ComboboxBadge({
  className,
  value: itemValue,
  onRemove,
  children,
  ...props
}: ComboboxBadgeProps) {
  const { value: selectedValues, onValueChange } = useComboboxContext();

  function handleRemove(e: React.MouseEvent | React.KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
    const handler =
      onRemove ??
      (() => onValueChange(selectedValues.filter((v) => v !== itemValue)));
    handler();
  }

  return (
    <Badge
      data-slot="combobox-badge"
      variant="secondary"
      className={cn("gap-1 pr-1", className)}
      {...props}
    >
      {children}
      <button
        type="button"
        data-slot="combobox-badge-remove"
        className="rounded-full p-0.5 hover:bg-foreground/20"
        onClick={handleRemove}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && handleRemove(e)
        }
      >
        <XIcon className="size-3" />
        <span className="sr-only">{"Remove"}</span>
      </button>
    </Badge>
  );
}

export {
  Combobox,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxInput,
  ComboboxList,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxBadgeList,
  ComboboxBadge,
};

export type {
  ComboboxProps,
  ComboboxTriggerProps,
  ComboboxContentProps,
  ComboboxInputProps,
  ComboboxListProps,
  ComboboxEmptyProps,
  ComboboxGroupProps,
  ComboboxItemProps,
  ComboboxBadgeListProps,
  ComboboxBadgeProps,
};
