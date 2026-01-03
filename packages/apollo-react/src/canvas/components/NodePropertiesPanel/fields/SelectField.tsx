import { Column } from '@uipath/apollo-react/canvas/layouts';
import { memo, useCallback } from 'react';
import { FieldError, FieldHelpText, FieldLabel, SelectInput } from '../NodePropertiesPanel.styles';
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

  return (
    <Column gap={4}>
      <FieldLabel>{field.label}</FieldLabel>
      <SelectInput
        className="nodrag"
        value={value || (field.defaultValue as string | undefined) || ''}
        onChange={handleChange}
        disabled={field.disabled}
        hasError={!!error}
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
      </SelectInput>
      {field.helpText && <FieldHelpText>{field.helpText}</FieldHelpText>}
      {error && <FieldError>{error}</FieldError>}
    </Column>
  );
});
