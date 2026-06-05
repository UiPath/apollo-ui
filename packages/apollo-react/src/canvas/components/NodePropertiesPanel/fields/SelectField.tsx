import { cn } from '@uipath/apollo-wind';
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
      onChange(e.target.value);
    },
    [onChange]
  );

  const selectId = `field-${field.key}`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-[13px] text-foreground-subtle">
        {field.label}
      </label>
      <select
        id={selectId}
        className={cn(
          'nodrag w-full px-3 py-2 text-[13px] border rounded bg-transparent text-foreground outline-none transition-colors appearance-none cursor-pointer',
          'focus:border-[var(--canvas-primary,theme(colors.blue.500))]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500'
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
      {field.helpText && (
        <span className="text-[12px] text-foreground-subtle block">{field.helpText}</span>
      )}
      {error && <span className="text-[12px] text-red-500 block">{error}</span>}
    </div>
  );
});
