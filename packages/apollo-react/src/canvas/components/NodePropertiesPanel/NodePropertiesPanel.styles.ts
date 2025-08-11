import styled from "@emotion/styled";

export const ConfigSection = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--color-border-de-emp);

  &:last-child {
    border-bottom: none;
  }
`;

export const SectionTitle = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: var(--color-foreground);
  margin-bottom: 8px;
`;

export const FieldContainer = styled.div`
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const FieldLabel = styled.label`
  font-size: 14px;
  color: var(--color-foreground-de-emp);
  display: block;
  margin-bottom: 4px;
`;

export const FieldHelpText = styled.span`
  font-size: 12px;
  color: var(--color-foreground-de-emp);
  display: block;
  margin-top: 4px;
`;

export const FieldError = styled.span`
  font-size: 12px;
  color: var(--color-error);
  display: block;
  margin-top: 4px;
`;

interface InputProps {
  hasError?: boolean;
}

export const TextInput = styled.input<InputProps>`
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
  border: 1px solid ${(props) => (props.hasError ? "var(--color-error)" : "var(--color-border)")};
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-foreground);
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-alpha-20);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const TextArea = styled.textarea<InputProps>`
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
  border: 1px solid ${(props) => (props.hasError ? "var(--color-error)" : "var(--color-border)")};
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-foreground);
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  resize: vertical;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-alpha-20);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const SelectInput = styled.select<InputProps>`
  width: 100%;
  padding: 8px 36px 8px 12px;
  font-size: 14px;
  font-family: inherit;
  border: 1px solid ${(props) => (props.hasError ? "var(--color-error)" : "var(--color-border)")};
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-foreground);
  outline: none;
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 20px;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-alpha-20);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const NumberInput = styled.input<InputProps>`
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
  border: 1px solid ${(props) => (props.hasError ? "var(--color-error)" : "var(--color-border)")};
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-foreground);
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-alpha-20);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Hide spinner buttons in some browsers */
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

export const CheckboxContainer = styled.div`
  padding: 8px 0;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--color-background-hover);
  }
`;

export const CheckboxLabel = styled.label`
  font-size: 14px;
  color: var(--color-foreground);
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
`;

export const CheckboxInput = styled.input`
  width: 18px;
  height: 18px;
  margin-right: 8px;
  cursor: pointer;
  accent-color: var(--color-primary);
`;

export const CheckboxHelpText = styled.span`
  font-size: 12px;
  color: var(--color-foreground-de-emp);
  margin-left: 26px;
  display: block;
`;

export const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const InputSuffix = styled.span`
  color: var(--color-foreground-de-emp);
  font-size: 14px;
  white-space: nowrap;
`;
