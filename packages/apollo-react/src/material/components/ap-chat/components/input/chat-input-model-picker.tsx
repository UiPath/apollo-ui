import React from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useChatService } from '../../providers/chat-service.provider';
import { usePicker } from '../../providers/picker-provider';
import { DropdownOption, DropdownPicker } from '../common/dropdown-picker';

function AutopilotChatInputModelPickerComponent({ useIcon }: { useIcon: boolean }) {
  const { _ } = useLingui();
  const chatService = useChatService();
  const { models, selectedModel } = usePicker();

  const handleModelSelect = React.useCallback(
    (option: DropdownOption) => {
      chatService?.setSelectedModel(option.id);
    },
    [chatService]
  );

  if (!models || models?.length === 0 || !selectedModel) {
    return null;
  }

  return (
    <DropdownPicker
      options={models as DropdownOption[]}
      selectedOption={
        {
          ...selectedModel,
          icon: useIcon ? 'model' : selectedModel.icon,
        } as DropdownOption
      }
      onSelect={handleModelSelect}
      useIcon={useIcon}
      ariaLabel={_(
        msg({ id: 'autopilot-chat.input.model-selection-label', message: `Model selection` })
      )}
      chatServiceInstance={chatService}
      iconVariant="custom"
    />
  );
}

export const AutopilotChatInputModelPicker = React.memo(AutopilotChatInputModelPickerComponent);
