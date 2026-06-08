import { cn } from '@uipath/apollo-wind';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { ConfigField } from '../NodePropertiesPanel.types';

interface NumberFieldProps {
  field: ConfigField;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  error?: string;
}

export const NumberField = memo(function NumberField({
  field,
  value,
  onChange,
  error,
}: NumberFieldProps) {
  const [localValue, setLocalValue] = useState<string | number>(
    value ?? (field.defaultValue as number | undefined) ?? ''
  );
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value ?? (field.defaultValue as number | undefined) ?? '');
  }, [value, field.defaultValue]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }

      const debounceDelay = field.debounce || 0;
      if (debounceDelay > 0) {
        debounceTimer.current = setTimeout(() => {
          const numValue = newValue === '' ? undefined : Number(newValue);
          onChange(numValue);
          debounceTimer.current = null;
        }, debounceDelay);
      } else {
        const numValue = newValue === '' ? undefined : Number(newValue);
        onChange(numValue);
      }
    },
    [field.debounce, onChange]
  );

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`field-${field.key}`} className="text-[13px] text-foreground-subtle">
        {field.label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={`field-${field.key}`}
          className={cn(
            'nodrag flex-1 px-3 py-2 text-[13px] font-mono border border-(--canvas-border) rounded bg-transparent text-foreground outline-none transition-colors',
            'focus:border-(--canvas-primary)',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            '[appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden',
            error && 'border-red-500'
          )}
          type="number"
          value={localValue}
          onChange={handleChange}
          placeholder={field.placeholder}
          disabled={field.disabled}
          min={field.min}
          max={field.max}
          step={field.step}
        />
        {field.suffix && (
          <span className="shrink-0 text-[13px] text-foreground-subtle whitespace-nowrap">
            {field.suffix}
          </span>
        )}
      </div>
      {field.helpText && (
        <span className="text-[12px] text-foreground-subtle block">{field.helpText}</span>
      )}
      {error && <span className="text-[12px] text-red-500 block">{error}</span>}
    </div>
  );
});
