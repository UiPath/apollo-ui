import {
  Attachment,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@uipath/apollo-wind';
import { File, FileText, type LucideIcon, Presentation } from 'lucide-react';

import { getAttachmentFileType } from '../../headless/utils/file-type';
import { type AutopilotChatFileInfo, AutopilotChatFileType } from '../../service';

// As in Material, the type shows as an icon only; the enum values are not display copy.
const FILE_TYPE_ICONS: Record<AutopilotChatFileType, LucideIcon> = {
  [AutopilotChatFileType.Word]: FileText,
  [AutopilotChatFileType.PowerPoint]: Presentation,
  [AutopilotChatFileType.File]: File,
};

/** The files sent with a message. */
export function MessageAttachments({ attachments }: { attachments: AutopilotChatFileInfo[] }) {
  return (
    <AttachmentGroup data-slot="wind-chat-message-attachments">
      {attachments.map((attachment) => {
        const Icon = FILE_TYPE_ICONS[getAttachmentFileType(attachment.name)];

        return (
          <Attachment
            key={`${attachment.name}-${attachment.size}`}
            size="sm"
            title={attachment.name}
          >
            <AttachmentMedia>
              <Icon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{attachment.name}</AttachmentTitle>
            </AttachmentContent>
          </Attachment>
        );
      })}
    </AttachmentGroup>
  );
}
