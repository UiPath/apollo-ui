import React from 'react';

import { useAttachments } from '../../../../../chat/headless/providers/attachments-provider';
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
