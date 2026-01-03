import { Column } from '@uipath/apollo-react/canvas/layouts';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  FieldError,
  FieldHelpText,
  FieldLabel,
  InputSuffix,
  InputWrapper,
  NumberInput,
} from '../NodePropertiesPanel.styles';
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

  // Cleanup debounce timer on unmount
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
    <Column gap={4}>
      <FieldLabel>{field.label}</FieldLabel>
      <InputWrapper>
        <NumberInput
          className="nodrag"
          type="number"
          value={localValue}
          onChange={handleChange}
          placeholder={field.placeholder}
          disabled={field.disabled}
          min={field.min}
          max={field.max}
          step={field.step}
          hasError={!!error}
          style={{ flex: 1 }}
        />
        {field.suffix && <InputSuffix>{field.suffix}</InputSuffix>}
      </InputWrapper>
      {field.helpText && <FieldHelpText>{field.helpText}</FieldHelpText>}
      {error && <FieldError>{error}</FieldError>}
    </Column>
  );
});
