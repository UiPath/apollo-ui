/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import React from 'react';

import { useModelPicker } from '../../providers/model-picker-provider.react';
import { ModelPicker } from '../common/model-picker';

function AutopilotChatInputModelPickerComponent({ useIcon }: { useIcon: boolean }) {
    const {
        models, selectedModel, setSelectedModel,
    } = useModelPicker();

    return (
        <ModelPicker
            models={models}
            selectedModel={selectedModel}
            onModelChange={(model) => setSelectedModel(model)}
            useIcon={useIcon}
        />
    );
}

export const AutopilotChatInputModelPicker = React.memo(AutopilotChatInputModelPickerComponent);
