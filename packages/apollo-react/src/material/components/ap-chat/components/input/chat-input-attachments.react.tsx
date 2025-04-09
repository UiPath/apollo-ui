/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import React from 'react';

import { useAttachments } from '../../providers/attachements-provider.react';
import { Attachments } from '../common/attachments.react';

function AutopilotChatInputAttachmentsComponent() {
    const {
        attachments, removeAttachment,
    } = useAttachments();

    return (
        <Attachments
            attachments={attachments}
            onRemove={removeAttachment}
        />
    );
}

export const AutopilotChatInputAttachments = React.memo(AutopilotChatInputAttachmentsComponent);
