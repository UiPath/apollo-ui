import { useAttachments } from '@uipath/apollo-react/chat/headless/providers/attachments-provider';
import React from 'react';
import { Attachments } from '../common/attachments';

function AutopilotChatInputAttachmentsComponent() {
  const { attachments, removeAttachment, attachmentsLoading } = useAttachments();

  return (
    <Attachments
      attachments={attachments}
      attachmentsLoading={attachmentsLoading}
      onRemove={removeAttachment}
    />
  );
}

export const AutopilotChatInputAttachments = React.memo(AutopilotChatInputAttachmentsComponent);
