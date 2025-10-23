/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import React from 'react';

import { t } from '../../../../utils/localization/loc';
import { useChatService } from '../../providers/chat-service.provider.react';
import { usePicker } from '../../providers/picker-provider.react';
import {
    DropdownOption,
    DropdownPicker,
} from '../common/dropdown-picker';

function AutopilotChatInputModelPickerComponent({ useIcon }: { useIcon: boolean }) {
    const chatService = useChatService();
    const {
        models, selectedModel,
    } = usePicker();

    const handleModelSelect = React.useCallback((option: DropdownOption) => {
        chatService?.setSelectedModel(option.id);
    }, [ chatService ]);

    if (!models || models?.length === 0 || !selectedModel) {
        return null;
    }

    return (
        <DropdownPicker
            options={models as DropdownOption[]}
            selectedOption={{
                ...selectedModel,
                icon: useIcon ? 'model' : selectedModel.icon,
            } as DropdownOption}
            onSelect={handleModelSelect}
            useIcon={useIcon}
            ariaLabel={t('autopilot-chat-model-selection-label')}
            chatServiceInstance={chatService}
            iconVariant="custom"
        />
    );
}

export const AutopilotChatInputModelPicker = React.memo(AutopilotChatInputModelPickerComponent);
