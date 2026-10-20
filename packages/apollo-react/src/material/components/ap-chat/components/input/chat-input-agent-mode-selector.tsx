import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useChatService } from '@uipath/apollo-react/chat/headless/providers/chat-service.provider';
import { usePicker } from '@uipath/apollo-react/chat/headless/providers/picker-provider';
import React from 'react';
import { type DropdownOption, DropdownPicker } from '../common/dropdown-picker';

interface AutopilotChatAgentModeSelectorProps {
  useIcon: boolean;
}

function AutopilotChatAgentModeSelectorComponent({ useIcon }: AutopilotChatAgentModeSelectorProps) {
  const { _ } = useLingui();
  const chatService = useChatService();
  const { agentModes, selectedAgentMode } = usePicker();

  const handleAgentModeSelect = React.useCallback(
    (option: DropdownOption) => {
      chatService?.setAgentMode(option.id);
    },
    [chatService]
  );

  if (!agentModes || agentModes?.length === 0 || !selectedAgentMode) {
    return null;
  }

  return (
    <DropdownPicker
      options={agentModes}
      selectedOption={selectedAgentMode}
      onSelect={handleAgentModeSelect}
      useIcon={useIcon}
      ariaLabel={_(
        msg({
          id: 'autopilot-chat.input.agent-mode-selection-label',
          message: `Agent mode selection`,
        })
      )}
      chatServiceInstance={chatService}
    />
  );
}

export const AutopilotChatAgentModeSelector = React.memo(AutopilotChatAgentModeSelectorComponent);
