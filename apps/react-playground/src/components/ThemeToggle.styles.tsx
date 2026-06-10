import styled from "styled-components";

export const ThemeControls = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const ThemeSelect = styled.select`
  background: var(--color-background);
  color: var(--color-foreground-emp);
  border: 2px solid var(--color-border);
  border-radius: 18px;
  height: 36px;
  padding: 0 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

export const HighContrastCheckbox = styled.div`
  display: flex;
  align-items: center;
`;

export const CheckboxLabel = styled.label<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};
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
  background: ${(props) =>
		props.$checked ? "var(--color-primary)" : "transparent"};
  border-color: ${(props) =>
		props.$checked ? "var(--color-primary)" : "var(--color-border)"};
  color: var(--color-white);
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s ease;

  ${CheckboxLabel}:hover & {
    border-color: var(--color-primary);
    background: ${(props) =>
			props.$checked
				? "var(--color-primary)"
				: "var(--color-background-hover)"};
  }
`;

export const CheckboxText = styled.span`
  color: var(--color-foreground-emp);
  font-size: 14px;
  font-weight: 500;
`;
