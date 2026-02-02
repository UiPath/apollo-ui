import styled from '@emotion/styled';

export const AddInstructionsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  padding: 6px 12px;
  background: transparent;
  border: 1px dashed var(--uix-canvas-border-de-emp);
  border-radius: 8px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  color: var(--uix-canvas-foreground-de-emp);
  line-height: 16px;
  transition:
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    border-color: var(--uix-canvas-selection-indicator);
    color: var(--uix-canvas-selection-indicator);
  }
`;

export const InstructionsLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: var(--uix-canvas-foreground);
  line-height: 16px;
`;

export const InstructionsPreview = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  font-size: 9px;
  line-height: 13px;
  color: var(--uix-canvas-foreground-de-emp);
  cursor: pointer;
`;

export const InstructionsLine = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  > strong {
    font-weight: 600;
  }
`;

export const SettingsPreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 20px;
  min-width: 280px;
  max-width: 320px;
`;

export const SettingsPreviewHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--uix-canvas-border-de-emp);
`;

export const SettingsPreviewTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--uix-canvas-foreground-emp);
`;

export const SettingsPreviewSubtitle = styled.div`
  font-size: 12px;
  color: var(--uix-canvas-foreground-de-emp);
`;

export const SettingsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const SettingsSectionLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: var(--uix-canvas-foreground-de-emp);
`;

export const SettingsSectionValue = styled.div`
  font-size: 14px;
  color: var(--uix-canvas-foreground-emp);
`;

export const SettingsPromptBox = styled.div<{ isEmpty?: boolean }>`
  font-size: 13px;
  color: ${({ isEmpty }) =>
    isEmpty ? 'var(--uix-canvas-foreground-de-emp)' : 'var(--uix-canvas-foreground)'};
  font-style: ${({ isEmpty }) => (isEmpty ? 'italic' : 'normal')};
  background: var(--uix-canvas-background-secondary);
  border-radius: 6px;
  padding: 8px 10px;
  max-height: 80px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--uix-canvas-border-de-emp);
    border-radius: 2px;
  }
`;

export const SettingsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
`;

export const SettingsRowLabel = styled.span`
  color: var(--uix-canvas-foreground-de-emp);
`;

export const SettingsRowValue = styled.span`
  color: var(--uix-canvas-foreground-emp);
  font-weight: 500;
`;

export const SubLabelContainer = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

export const HealthScoreBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background-color: var(--uix-canvas-background-secondary);
  border-radius: 16px;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  color: var(--uix-canvas-foreground-de-emp);
  cursor: pointer;
`;
