import * as React from "react";
import type { CellContext } from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib";
import { Input } from "./input";
import { Checkbox } from "./checkbox";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

export type EditableCellType = "text" | "number" | "select" | "date" | "checkbox";

export interface SelectOption {
  value: string;
  label: string;
}

export interface EditableCellMeta {
  type?: EditableCellType;
  options?: SelectOption[];
  placeholder?: string;
  min?: number;
  max?: number;
}

interface EditableCellProps<TData, TValue> {
  cell: CellContext<TData, TValue>;
  onUpdate: (value: TValue) => void;
}

export function EditableCell<TData, TValue>({
  cell,
  onUpdate,
}: EditableCellProps<TData, TValue>) {
  const initialValue = cell.getValue();
  const meta = cell.column.columnDef.meta as EditableCellMeta | undefined;
  const type = meta?.type ?? "text";

  const [isEditing, setIsEditing] = React.useState(false);
  const [value, setValue] = React.useState(initialValue);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync with external value changes
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Focus input when entering edit mode
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = React.useCallback(() => {
    if (value !== initialValue) {
      onUpdate(value as TValue);
    }
    setIsEditing(false);
  }, [value, initialValue, onUpdate]);

  const handleCancel = React.useCallback(() => {
    setValue(initialValue);
    setIsEditing(false);
  }, [initialValue]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel],
  );

  // Checkbox doesn't need edit mode - just toggle
  if (type === "checkbox") {
    return (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={Boolean(value)}
          onCheckedChange={(checked) => {
            setValue(checked as TValue);
            onUpdate(checked as TValue);
          }}
          aria-label="Toggle"
        />
      </div>
    );
  }

  // Wrapper to maintain consistent cell sizing
  const cellContent = isEditing ? (
    renderEditMode()
  ) : (
    <div
      className={cn(
        "min-h-[32px] px-2 py-1.5 -mx-2 rounded cursor-pointer",
        "hover:bg-muted/50 transition-colors",
        "flex items-center w-full",
      )}
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Edit ${cell.column.id}`}
    >
      <span className={cn("truncate", !value && "text-muted-foreground")}>
        {formatDisplayValue(value, type, meta?.options)}
      </span>
    </div>
  );

  return cellContent;

  function renderEditMode() {
    switch (type) {
      case "select":
        return (
          <Select
            value={String(value ?? "")}
            onValueChange={(newValue) => {
              setValue(newValue as TValue);
              onUpdate(newValue as TValue);
              setIsEditing(false);
            }}
            open={true}
            onOpenChange={(open) => {
              if (!open) setIsEditing(false);
            }}
          >
            <SelectTrigger className="h-8 -mx-2 w-full">
              <SelectValue placeholder={meta?.placeholder ?? "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {meta?.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "date":
        return (
          <DatePickerCell
            value={value instanceof Date ? value : value ? new Date(value as string) : undefined}
            onValueChange={(date: Date | undefined) => {
              setValue(date as TValue);
              onUpdate(date as TValue);
            }}
            onClose={() => setIsEditing(false)}
            placeholder={meta?.placeholder ?? "Pick date"}
          />
        );

      case "number":
        return (
          <Input
            ref={inputRef}
            type="number"
            value={value as string | number}
            onChange={(e) => setValue(e.target.valueAsNumber as TValue)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            min={meta?.min}
            max={meta?.max}
            className="h-8 -mx-2 w-full"
          />
        );

      case "text":
      default:
        return (
          <Input
            ref={inputRef}
            type="text"
            value={String(value ?? "")}
            onChange={(e) => setValue(e.target.value as TValue)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={meta?.placeholder}
            className="h-8 -mx-2 w-full"
          />
        );
    }
  }
}

function formatDisplayValue(
  value: unknown,
  type: EditableCellType,
  options?: SelectOption[],
): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  switch (type) {
    case "select": {
      const option = options?.find((o) => o.value === value);
      return option?.label ?? String(value);
    }

    case "date":
      if (value instanceof Date) {
        return format(value, "PP");
      }
      return format(new Date(value as string), "PP");

    case "checkbox":
      return value ? "Yes" : "No";

    default:
      return String(value);
  }
}

// Helper to create editable column definition
export function createEditableColumn<TData>(
  accessorKey: keyof TData & string,
  header: string,
  meta?: EditableCellMeta,
) {
  return {
    accessorKey,
    header,
    meta,
  };
}

// Internal DatePicker for editable cells with proper close handling
function DatePickerCell({
  value,
  onValueChange,
  onClose,
  placeholder,
}: {
  value?: Date;
  onValueChange: (date: Date | undefined) => void;
  onClose: () => void;
  placeholder: string;
}) {
  const [open, setOpen] = React.useState(true);

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) onClose();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-8 -mx-2 w-full justify-start text-left font-normal text-sm",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{value ? format(value, "PP") : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onValueChange(date);
            setOpen(false);
            onClose();
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
