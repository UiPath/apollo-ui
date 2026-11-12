import * as React from 'react';
import type { CellContext } from '@tanstack/react-table';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib';
import { Input } from './input';
import { Checkbox } from './checkbox';
import { Button } from './button';
import { Calendar } from './calendar';
import { useDateLocale } from './locale-provider';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

export type EditableCellType = 'text' | 'number' | 'select' | 'date' | 'checkbox';

export interface SelectOption {
  value: string;
  label: string;
}

export interface EditableCellMeta {
  type?: EditableCellType;
  options?: SelectOption[];
  placeholder?: string;
  /** Lower bound of a `number` cell. An out-of-range entry is clamped on commit. */
  min?: number;
  /** Upper bound of a `number` cell. An out-of-range entry is clamped on commit. */
  max?: number;
  /**
   * Lets a `number` cell be emptied, which commits `null`. Without it, clearing the
   * field and committing leaves the previous value in place.
   */
  nullable?: boolean;
  /** Human-readable column name, used in accessible names and the DataTable column menu. */
  label?: string;
}

interface EditableCellProps<TData, TValue> {
  cell: CellContext<TData, TValue>;
  onUpdate: (value: TValue) => void;
  /** Accessible name of the button that starts editing. Default: `Edit <column id>`. */
  editLabel?: string;
  /** Accessible name of a `checkbox` cell. Default: `Toggle`. */
  toggleLabel?: string;
}

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

/** A valid Date from a Date, timestamp or date string, else undefined. Never throws. */
function toValidDate(value: unknown): Date | undefined {
  if (isEmptyValue(value)) return undefined;
  // A date-only string ("2024-12-15") is a calendar day, not a UTC instant. `new Date`
  // would read it as UTC midnight and show the previous day west of Greenwich.
  const dateOnly = typeof value === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : value instanceof Date
      ? value
      : new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function EditableCell<TData, TValue>({
  cell,
  onUpdate,
  editLabel,
  toggleLabel,
}: EditableCellProps<TData, TValue>) {
  const initialValue = cell.getValue();
  const meta = cell.column.columnDef.meta as EditableCellMeta | undefined;
  const type = meta?.type ?? 'text';
  const dateLocale = useDateLocale();

  const [isEditing, setIsEditing] = React.useState(false);
  const [value, setValue] = React.useState(initialValue);
  // Number cells edit a text draft so a half-typed entry ("-", "") is never coerced to NaN.
  const [numberDraft, setNumberDraft] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const displayRef = React.useRef<HTMLButtonElement>(null);
  // Set when an edit ends from the keyboard or a picker, so focus returns to the cell
  // instead of falling back to <body>. Left unset when the user clicks elsewhere.
  const restoreFocusRef = React.useRef(false);
  // Guards against a second commit from the blur that can follow Enter or Escape.
  const finishedRef = React.useRef(false);

  // Sync with external value changes
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Focus input when entering edit mode, and hand focus back to the cell when leaving it.
  React.useEffect(() => {
    if (isEditing) {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    } else if (restoreFocusRef.current) {
      restoreFocusRef.current = false;
      displayRef.current?.focus();
    }
  }, [isEditing]);

  const startEditing = React.useCallback(() => {
    finishedRef.current = false;
    if (type === 'number') setNumberDraft(isEmptyValue(value) ? '' : String(value));
    setIsEditing(true);
  }, [type, value]);

  const finishEditing = React.useCallback((restoreFocus: boolean) => {
    finishedRef.current = true;
    restoreFocusRef.current = restoreFocus;
    setIsEditing(false);
  }, []);

  const handleSave = React.useCallback(
    (restoreFocus: boolean) => {
      if (finishedRef.current) return;
      if (type === 'number') {
        const trimmed = numberDraft.trim();
        if (trimmed === '') {
          if (meta?.nullable && !isEmptyValue(initialValue)) {
            setValue(null as TValue);
            onUpdate(null as TValue);
          }
        } else {
          let next = Number(trimmed);
          if (Number.isFinite(next)) {
            if (meta?.min !== undefined) next = Math.max(meta.min, next);
            if (meta?.max !== undefined) next = Math.min(meta.max, next);
            if (next !== initialValue) {
              setValue(next as TValue);
              onUpdate(next as TValue);
            }
          }
        }
      } else if (value !== initialValue) {
        onUpdate(value as TValue);
      }
      finishEditing(restoreFocus);
    },
    [
      type,
      numberDraft,
      meta?.nullable,
      meta?.min,
      meta?.max,
      value,
      initialValue,
      onUpdate,
      finishEditing,
    ]
  );

  const handleCancel = React.useCallback(() => {
    setValue(initialValue);
    finishEditing(true);
  }, [initialValue, finishEditing]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  // Checkbox doesn't need edit mode - just toggle
  if (type === 'checkbox') {
    return (
      <div data-slot="editable-cell" className="flex items-center justify-center">
        <Checkbox
          checked={Boolean(value)}
          onCheckedChange={(checked) => {
            setValue(checked as TValue);
            onUpdate(checked as TValue);
          }}
          aria-label={toggleLabel ?? 'Toggle'}
        />
      </div>
    );
  }

  // Wrapper to maintain consistent cell sizing
  const cellContent = isEditing ? (
    renderEditMode()
  ) : (
    <button
      ref={displayRef}
      type="button"
      data-slot="editable-cell"
      className={cn(
        'min-h-[32px] px-2 py-1.5 -mx-2 rounded cursor-pointer w-full text-left',
        'hover:bg-muted/50 transition-colors',
        'flex items-center bg-transparent border-0'
      )}
      onClick={startEditing}
      aria-label={editLabel ?? `Edit ${cell.column.id}`}
    >
      <span className={cn('truncate', isEmptyValue(value) && 'text-muted-foreground')}>
        {formatDisplayValue(value, type, meta?.options, dateLocale)}
      </span>
    </button>
  );

  return cellContent;

  function renderEditMode() {
    switch (type) {
      case 'select':
        return (
          <Select
            value={String(value ?? '')}
            onValueChange={(newValue) => {
              setValue(newValue as TValue);
              onUpdate(newValue as TValue);
              finishEditing(true);
            }}
            open={true}
            onOpenChange={(open) => {
              if (!open) finishEditing(true);
            }}
          >
            <SelectTrigger className="h-8 -mx-2 w-full">
              <SelectValue placeholder={meta?.placeholder ?? 'Select...'} />
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

      case 'date':
        return (
          <DatePickerCell
            value={toValidDate(value)}
            onValueChange={(date: Date | undefined) => {
              setValue(date as TValue);
              onUpdate(date as TValue);
            }}
            onClose={() => finishEditing(true)}
            placeholder={meta?.placeholder ?? 'Pick date'}
          />
        );

      case 'number':
        return (
          <Input
            ref={inputRef}
            type="number"
            value={numberDraft}
            onChange={(e) => setNumberDraft(e.target.value)}
            onBlur={() => handleSave(false)}
            onKeyDown={handleKeyDown}
            min={meta?.min}
            max={meta?.max}
            className="h-8 -mx-2 w-full"
          />
        );

      case 'text':
      default:
        return (
          <Input
            ref={inputRef}
            type="text"
            value={String(value ?? '')}
            onChange={(e) => setValue(e.target.value as TValue)}
            onBlur={() => handleSave(false)}
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
  locale?: ReturnType<typeof useDateLocale>
): string {
  if (isEmptyValue(value)) {
    return '—';
  }

  switch (type) {
    case 'select': {
      const option = options?.find((o) => o.value === value);
      return option?.label ?? String(value);
    }

    case 'date': {
      // An unparseable value is shown as is rather than throwing from date-fns.
      const date = toValidDate(value);
      return date ? format(date, 'PP', { locale }) : String(value);
    }

    case 'checkbox':
      return value ? 'Yes' : 'No';

    default:
      return String(value);
  }
}

// Helper to create editable column definition
export function createEditableColumn<TData>(
  accessorKey: keyof TData & string,
  header: string,
  meta?: EditableCellMeta
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
  const locale = useDateLocale();

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
            'h-8 -mx-2 w-full justify-start text-left font-normal text-sm',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{value ? format(value, 'PP', { locale }) : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value}
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
