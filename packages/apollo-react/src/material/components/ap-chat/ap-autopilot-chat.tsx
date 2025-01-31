/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Component,
    Element,
} from '@stencil/core';
// eslint-disable-next-line unused-imports/no-unused-imports
import React from 'react';

import { toReactComponentAdapter } from '../../react/PortalShellStencilReactAdapter';
import type { IReactComponentAdapter } from '../../react/stencil-react-adapter';
import { ApAutopilotChatReact } from './ap-autopilot-chat.react';
import { AutopilotChatMode } from './models/chat.model';
import { AutopilotChatService } from './services/chat-service';

@Component({
    tag: 'ap-autopilot-chat',
    styleUrl: 'ap-autopilot-chat.scss',
    shadow: true,
})
export class ApAutopilotChat implements IReactComponentAdapter {
    @Element() hostElement: HTMLApAutopilotChatElement;

    connectedCallback() {
        AutopilotChatService.Instantiate({ mode: AutopilotChatMode.Closed }, []);
    }

    renderReact() {
        return (
            <ApAutopilotChatReact>
            </ApAutopilotChatReact>
        );
    }
}

toReactComponentAdapter(ApAutopilotChat);
