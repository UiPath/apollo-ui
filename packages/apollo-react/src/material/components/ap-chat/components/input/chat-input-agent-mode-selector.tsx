import React from 'react';

import { t } from '../../../../utils/localization/loc';
import { useChatService } from '../../providers/chat-service.provider';
import { usePicker } from '../../providers/picker-provider';
import {
    DropdownOption,
    DropdownPicker,
} from '../common/dropdown-picker';

interface AutopilotChatAgentModeSelectorProps {
    useIcon: boolean;
}

function AutopilotChatAgentModeSelectorComponent({ useIcon }: AutopilotChatAgentModeSelectorProps) {
    const chatService = useChatService();
    const {
        agentModes, selectedAgentMode,
    } = usePicker();

    const handleAgentModeSelect = React.useCallback((option: DropdownOption) => {
        chatService?.setAgentMode(option.id);
    }, [ chatService ]);

    if (!agentModes || agentModes?.length === 0 || !selectedAgentMode) {
        return null;
    }

    return (
        <DropdownPicker
            options={agentModes}
            selectedOption={selectedAgentMode}
            onSelect={handleAgentModeSelect}
            useIcon={useIcon}
            ariaLabel={t('autopilot-chat-agent-mode-selection-label')}
            chatServiceInstance={chatService}
        />
    );
}

export const AutopilotChatAgentModeSelector = React.memo(AutopilotChatAgentModeSelectorComponent);
