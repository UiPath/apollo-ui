import { cn } from '@uipath/apollo-wind';
import { ChevronDown } from 'lucide-react';
import { memo, useCallback } from 'react';
import type { ConfigField } from '../NodePropertiesPanel.types';

interface SelectFieldProps {
  field: ConfigField;
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  error?: string;
}

export const SelectField = memo(function SelectField({
  field,
  value,
  onChange,
  error,
}: SelectFieldProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const raw = e.target.value;
      // Preserve numeric types — select events always produce strings, but the
      // option value may be a number. Coerce back to number when appropriate.
      const matched = field.options?.find((o) => String(o.value) === raw);
      onChange(matched ? matched.value : raw);
    },
    [field.options, onChange]
  );

  const selectId = `field-${field.key}`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-[13px] text-(--canvas-foreground-de-emp)">
        {field.label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'nodrag w-full px-3 py-2 pr-8 text-[13px] border border-(--canvas-border) rounded bg-(--canvas-background) text-(--canvas-foreground) outline-none transition-colors appearance-none cursor-pointer',
            'focus:border-(--canvas-primary)',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-(--canvas-error)'
          )}
          value={value ?? (field.defaultValue as string | undefined) ?? ''}
          onChange={handleChange}
          disabled={field.disabled}
        >
          {field.placeholder && (
            <option value="" disabled>
              {field.placeholder}
            </option>
          )}
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-(--canvas-foreground-de-emp)"
          aria-hidden
        />
      </div>
      {field.helpText && (
        <span className="text-[12px] text-(--canvas-foreground-de-emp) block">
          {field.helpText}
        </span>
      )}
      {error && <span className="text-[12px] text-(--canvas-error-text) block">{error}</span>}
    </div>
  );
});
