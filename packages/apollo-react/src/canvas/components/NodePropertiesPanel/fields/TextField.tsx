import { memo, useCallback, useState, useEffect, useRef } from "react";
import { Column } from "@uipath/uix/core";
import { TextInput, TextArea, FieldLabel, FieldHelpText, FieldError, InputWrapper, InputSuffix } from "../NodePropertiesPanel.styles";
import type { ConfigField } from "../NodePropertiesPanel.types";

interface TextFieldProps {
  field: ConfigField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const TextField = memo(function TextField({ field, value, onChange, error }: TextFieldProps) {
  const [localValue, setLocalValue] = useState(value || "");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  // Cleanup debounce timer on unmount or when debounce changes
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

      // Clear existing timer
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

  return (
    <Column gap={4}>
      <FieldLabel>{field.label}</FieldLabel>
      {field.type === "textarea" ? (
        <TextArea
          className="nodrag"
          value={localValue}
          onChange={handleChange}
          placeholder={field.placeholder}
          disabled={field.disabled}
          rows={field.rows || 3}
          hasError={!!error}
        />
      ) : (
        <InputWrapper>
          <TextInput
            className="nodrag"
            type="text"
            value={localValue}
            onChange={handleChange}
            placeholder={field.placeholder}
            disabled={field.disabled}
            hasError={!!error}
            style={{ flex: 1 }}
          />
          {field.suffix && <InputSuffix>{field.suffix}</InputSuffix>}
        </InputWrapper>
      )}
      {field.helpText && <FieldHelpText>{field.helpText}</FieldHelpText>}
      {error && <FieldError>{error}</FieldError>}
    </Column>
  );
});
