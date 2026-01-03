import styled from "styled-components";

export const ShowcaseContainer = styled.div`
  display: flex;
  width: 100%;
`;

export const ControlPanel = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 8px;
  max-height: calc(100vh - 64px);
  overflow-y: auto;
  padding: 16px 0 0 16px;
  box-sizing: border-box;
`;

export const ChatContainer = styled.div`
  justify-self: flex-end;
  background: var(--color-background);
`;

export const FloatingChatContainer = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 400px;
  height: 600px;
  box-shadow: var(--shadow-xl);
  border-radius: 12px;
  overflow: hidden;
  z-index: 1000;

  /* Needed for absolute positioned chat content in embedded mode */
  & > * {
    position: relative;
  }
`;

export const Section = styled.div`
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

export const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0 0 16px 0;
`;

export const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
`;

export const Button = styled.button`
  padding: 8px 16px;
  background: var(--color-background-subtle);
  color: var(--color-foreground-emp);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: var(--color-background-hover);
    border-color: var(--color-primary);
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const PrimaryButton = styled(Button)`
  background: linear-gradient(
    135deg,
    var(--color-brand-primary) 0%,
    var(--color-secondary) 100%
  );
  color: var(--color-white);
  border: none;

  &:hover {
    box-shadow: var(--shadow-hover-primary);
  }
`;

export const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  background: var(--color-background);
  color: var(--color-foreground-emp);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 12px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 10px 12px;
  background: var(--color-background);
  color: var(--color-foreground-emp);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 12px;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

export const Checkbox = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-foreground-emp);

  input[type="checkbox"] {
    cursor: pointer;
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  background: var(--color-background);
  color: var(--color-foreground-emp);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 12px;
  cursor: pointer;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

export const InfoText = styled.p`
  font-size: 13px;
  color: var(--color-foreground-de-emp);
  margin: 8px 0 0 0;
  line-height: 1.5;
`;
