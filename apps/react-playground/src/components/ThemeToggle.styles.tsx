import styled from "styled-components";

export const ThemeControls = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const IconButton = styled.button<{ $isActive: boolean }>`
  background: ${(props) => (props.$isActive ? "var(--color-primary)" : "var(--color-background)")};
  border: 2px solid ${(props) => (props.$isActive ? "var(--color-primary)" : "var(--color-border)")};
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  color: ${(props) => (props.$isActive ? "var(--color-white)" : "var(--color-foreground-emp)")};
  box-shadow: ${(props) => (props.$isActive ? "0 2px 8px rgba(250, 70, 22, 0.3)" : "none")};

  svg {
    color: ${(props) => (props.$isActive ? "var(--color-white)" : "var(--color-foreground-emp)")};
    transition: color 0.2s ease;
  }

  &:hover {
    background: ${(props) => (props.$isActive ? "var(--color-primary)" : "var(--color-background-hover)")};
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: ${(props) =>
			props.$isActive
				? "0 4px 12px rgba(250, 70, 22, 0.4)"
				: "0 2px 8px rgba(0, 0, 0, 0.1)"};
  }

  &:active {
    transform: translateY(0);
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
  background: ${(props) => (props.$checked ? "var(--color-primary)" : "transparent")};
  border-color: ${(props) => (props.$checked ? "var(--color-primary)" : "var(--color-border)")};
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
