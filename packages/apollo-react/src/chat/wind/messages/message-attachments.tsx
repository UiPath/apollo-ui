import {
  Attachment,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  cn,
} from '@uipath/apollo-wind';
import { File, FileText, type LucideIcon, Presentation } from 'lucide-react';
import type React from 'react';

import { getAttachmentFileType } from '../../headless/utils/file-type';
import { type AutopilotChatFileInfo, AutopilotChatFileType } from '../../service';

// As in Material, the type shows as an icon only; the enum values are not display copy.
const FILE_TYPE_ICONS: Record<AutopilotChatFileType, LucideIcon> = {
  [AutopilotChatFileType.Word]: FileText,
  [AutopilotChatFileType.PowerPoint]: Presentation,
  [AutopilotChatFileType.File]: File,
};

/** The icon for a file's type, by its name. */
export function AttachmentTypeIcon({ name }: { name: string }) {
  const Icon = FILE_TYPE_ICONS[getAttachmentFileType(name)];
  return <Icon />;
}

// Material's chip size: 30px tall and at most half the message, with the name truncated. Half
// the message (the `@container` around it), not half the row: an end-aligned row sizes itself to
// its chips, so a percentage of it would shrink a lone chip to half its own width. The xs chip's
// 28px media square shrinks to a 20px icon; `!` because the primitive sizes it per size.
export const CHIP_CLASSES = 'min-w-0 max-w-[calc(50cqw-4px)] gap-1.5 rounded-lg';
export const CHIP_MEDIA_CLASSES = 'w-5! rounded-sm bg-transparent';

/**
 * Shows a chip's full name as its tooltip only while the name is cut off. Delegated, so it also
 * covers chips a primitive renders.
 */
export function titleTruncatedChip(event: React.PointerEvent<HTMLElement>) {
  const chip = (event.target as HTMLElement).closest<HTMLElement>('[data-slot="attachment"]');
  const title = chip?.querySelector<HTMLElement>('[data-slot="attachment-title"]');
  if (!chip || !title) {
    return;
  }
  if (title.scrollWidth > title.clientWidth) {
    chip.title = title.textContent ?? '';
  } else {
    chip.removeAttribute('title');
  }
}

/**
 * The files sent with a message. With `align="end"` (a user message) the row sits at the
 * message's trailing edge while the chips fit.
 */
export function MessageAttachments({
  attachments,
  align = 'start',
}: {
  attachments: AutopilotChatFileInfo[];
  align?: 'start' | 'end';
}) {
  return (
    <AttachmentGroup
      data-slot="wind-chat-message-attachments"
      // Material's 8px gap, so two capped chips fill the message exactly. `safe`: end-justified
      // while the chips fit, start-justified once they overflow, so the overflow stays scrollable
      // instead of spilling out of reach past the start.
      className={cn('gap-2', align === 'end' && 'justify-end-safe')}
      onPointerOver={titleTruncatedChip}
    >
      {attachments.map((attachment) => (
        <Attachment
          key={`${attachment.name}-${attachment.size}`}
          size="xs"
          className={CHIP_CLASSES}
        >
          <AttachmentMedia className={CHIP_MEDIA_CLASSES}>
            <AttachmentTypeIcon name={attachment.name} />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{attachment.name}</AttachmentTitle>
          </AttachmentContent>
        </Attachment>
      ))}
    </AttachmentGroup>
  );
}
