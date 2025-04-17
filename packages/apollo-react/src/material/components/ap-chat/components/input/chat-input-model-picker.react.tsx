/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import React from 'react';

import { useModelPicker } from '../../providers/model-picker-provider.react';
import { ModelPicker } from '../common/model-picker';

function AutopilotChatInputModelPickerComponent({ useIcon }: { useIcon: boolean }) {
    const {
        models, selectedModel,
    } = useModelPicker();

    if (!models || !selectedModel) {
        return null;
    }

    return (
        <ModelPicker
            models={models}
            selectedModel={selectedModel}
            useIcon={useIcon}
        />
    );
}

export const AutopilotChatInputModelPicker = React.memo(AutopilotChatInputModelPickerComponent);
