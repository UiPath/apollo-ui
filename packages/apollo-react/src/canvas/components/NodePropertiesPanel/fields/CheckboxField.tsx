import { memo, useCallback } from 'react';
import type { ConfigField } from '../NodePropertiesPanel.types';

interface CheckboxFieldProps {
  field: ConfigField;
  value: boolean;
  onChange: (value: boolean) => void;
  error?: string;
}

export const CheckboxField = memo(function CheckboxField({
  field,
  value,
  onChange,
  error,
}: CheckboxFieldProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.checked);
    },
    [onChange]
  );

  return (
    <div className="flex flex-col gap-1">
      <div
        className={`py-2 rounded transition ${field.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-(--canvas-background-hover)'}`}
      >
        <label
          className={`flex items-center text-[13px] text-(--canvas-foreground) select-none ${field.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <input
            className="nodrag size-[18px] mr-2 cursor-pointer disabled:cursor-not-allowed accent-(--canvas-primary)"
            type="checkbox"
            checked={!!value}
            onChange={handleChange}
            disabled={field.disabled}
          />
          <span>{field.label}</span>
          {field.icon && <span className="ml-2">{field.icon}</span>}
        </label>
      </div>
      {field.helpText && (
        <span className="text-[12px] text-(--canvas-foreground-de-emp) block ml-[26px]">
          {field.helpText}
        </span>
      )}
      {error && (
        <span className="text-[12px] text-(--canvas-error-text) block ml-[26px]">{error}</span>
      )}
    </div>
  );
});
