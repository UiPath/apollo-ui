/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import React from 'react';

import { AutopilotDropzone } from './components/dropzone/dropzone.react';
import { AutopilotChatHeader } from './components/header/header.react';
import { AutopilotChatInput } from './components/input/chat-input.react';
import { AutopilotAttachmentsProvider } from './providers/attachements-provider.react';
import { AutopilotErrorProvider } from './providers/error-provider.react';

export function ApAutopilotChatReact() {
    return (
        <AutopilotErrorProvider>
            <AutopilotAttachmentsProvider>
                <AutopilotDropzone>
                    <AutopilotChatHeader />
                    <AutopilotChatInput />
                </AutopilotDropzone>
            </AutopilotAttachmentsProvider>
        </AutopilotErrorProvider>
    );
}
