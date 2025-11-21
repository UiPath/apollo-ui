import styled from 'styled-components';

export const ThemeControls = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const ToggleButton = styled.button`
  background: transparent;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: var(--color-background-hover);
    border-color: var(--color-primary);
  }

  &:active {
    background: var(--color-background-pressed);
  }
`;

export const HighContrastCheckbox = styled.div`
  display: flex;
  align-items: center;
`;

export const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
`;

export const CheckboxInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

export const CheckboxBox = styled.div<{ $checked: boolean }>`
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => (props.$checked ? 'var(--color-primary)' : 'transparent')};
  border-color: ${(props) => (props.$checked ? 'var(--color-primary)' : 'var(--color-border)')};
  color: var(--color-foreground-inverse);
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s ease;

  ${CheckboxLabel}:hover & {
    border-color: var(--color-primary);
    background: ${(props) =>
      props.$checked ? 'var(--color-primary-hover)' : 'var(--color-background-hover)'};
  }
`;

export const CheckboxText = styled.span`
  color: var(--color-foreground-emp);
  font-size: 14px;
  font-weight: 500;
`;
