import { cn } from '@uipath/apollo-wind';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { ConfigField } from '../NodePropertiesPanel.types';

interface TextFieldProps {
  field: ConfigField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const inputBase =
  'w-full px-3 py-2 text-[13px] font-mono border border-(--canvas-border) rounded bg-(--canvas-background) text-(--canvas-foreground) outline-none transition-colors placeholder:text-(--canvas-foreground-de-emp) focus:border-(--canvas-primary) disabled:opacity-50 disabled:cursor-not-allowed';

export const TextField = memo(function TextField({
  field,
  value,
  onChange,
  error,
}: TextFieldProps) {
  const [localValue, setLocalValue] = useState(value || '');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }

      const debounceDelay = field.debounce || 0;
      if (debounceDelay > 0) {
        debounceTimer.current = setTimeout(() => {
          onChange(newValue);
          debounceTimer.current = null;
        }, debounceDelay);
      } else {
        onChange(newValue);
      }
    },
    [field.debounce, onChange]
  );

  const inputId = `field-${field.key}`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-[13px] text-(--canvas-foreground-de-emp)">
        {field.label}
      </label>
      {field.type === 'textarea' ? (
        <textarea
          id={inputId}
          className={cn('nodrag resize-y', inputBase, error && 'border-(--canvas-error)')}
          value={localValue}
          onChange={handleChange}
          placeholder={field.placeholder}
          disabled={field.disabled}
          rows={field.rows || 3}
        />
      ) : (
        <div className="flex items-center gap-2">
          <input
            id={inputId}
            className={cn('nodrag flex-1', inputBase, error && 'border-(--canvas-error)')}
            type="text"
            value={localValue}
            onChange={handleChange}
            placeholder={field.placeholder}
            disabled={field.disabled}
          />
          {field.suffix && (
            <span className="shrink-0 text-[13px] text-(--canvas-foreground-de-emp) whitespace-nowrap">
              {field.suffix}
            </span>
          )}
        </div>
      )}
      {field.helpText && (
        <span className="text-[12px] text-(--canvas-foreground-de-emp) block">
          {field.helpText}
        </span>
      )}
      {error && <span className="text-[12px] text-(--canvas-error-text) block">{error}</span>}
    </div>
  );
});
