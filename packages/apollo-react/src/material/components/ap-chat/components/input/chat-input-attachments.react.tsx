/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import React from 'react';

import { useAttachments } from '../../providers/attachements-provider.react';
import { Attachments } from '../common/attachments.react';

function AutopilotChatInputAttachmentsComponent() {
    const {
        attachments, removeAttachment, attachmentsLoading,
    } = useAttachments();

    return (
        <Attachments
            attachments={attachments}
            attachmentsLoading={attachmentsLoading}
            onRemove={removeAttachment}
        />
    );
}

export const AutopilotChatInputAttachments = React.memo(AutopilotChatInputAttachmentsComponent);
