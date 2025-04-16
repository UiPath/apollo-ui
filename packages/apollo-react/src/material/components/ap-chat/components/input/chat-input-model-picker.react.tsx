/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import React from 'react';

import { useModelPicker } from '../../providers/model-picker-provider.react';
import { ModelPicker } from '../common/model-picker';

function AutopilotChatInputModelPickerComponent() {
    const {
        models, selectedModel, setSelectedModel,
    } = useModelPicker();

    return (
        <ModelPicker
            models={models}
            selectedModel={selectedModel}
            onModelChange={(model) => setSelectedModel(model)}
        />
    );
}

export const AutopilotChatInputModelPicker = React.memo(AutopilotChatInputModelPickerComponent);
