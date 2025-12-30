import { memo, useCallback } from 'react';
import { Column } from '@uipath/apollo-react/canvas/layouts';
import {
  CheckboxContainer,
  CheckboxLabel,
  CheckboxInput,
  CheckboxHelpText,
  FieldError,
} from '../NodePropertiesPanel.styles';
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
    <Column gap={4}>
      <CheckboxContainer>
        <CheckboxLabel>
          <CheckboxInput
            className="nodrag"
            type="checkbox"
            checked={!!value}
            onChange={handleChange}
            disabled={field.disabled}
          />
          <span>{field.label}</span>
          {field.icon && <span style={{ marginLeft: '8px' }}>{field.icon}</span>}
        </CheckboxLabel>
      </CheckboxContainer>
      {field.helpText && <CheckboxHelpText>{field.helpText}</CheckboxHelpText>}
      {error && <FieldError style={{ marginLeft: '26px' }}>{error}</FieldError>}
    </Column>
  );
});
