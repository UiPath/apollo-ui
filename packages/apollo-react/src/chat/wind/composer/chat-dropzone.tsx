import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { DropzoneOverlay, validateFiles } from '@uipath/apollo-wind';
import type React from 'react';

import {
  getAcceptedFileTypes,
  useAttachmentIntake,
} from '../../headless/hooks/use-attachment-intake';
import { useAttachments } from '../../headless/providers/attachments-provider';
import { useChatState } from '../../headless/providers/chat-state-provider';

const carriesFiles = (data: DataTransfer | null) => Array.from(data?.types ?? []).includes('Files');

function filesFrom(data: DataTransfer | null): File[] {
  const files = Array.from(data?.files ?? []);
  if (files.length > 0) {
    return files;
  }
  // Some browsers only expose pasted images through `items`.
  return Array.from(data?.items ?? [])
    .filter((item) => item.kind === 'file')
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
}

/**
 * The whole panel as a drop and paste target for attachments, checked against
 * `allowedAttachments` and taken in as Material's dropzone takes them. While it cannot take files
 * (attachments disabled, no composer, chat closing) a file dropped on the panel is still caught,
 * so the browser does not open it in the tab.
 */
export function WindChatDropzone({
  disabled,
  children,
}: {
  disabled: boolean;
  children: React.ReactNode;
}) {
  const { _ } = useLingui();
  const { disabledFeatures, allowedAttachments } = useChatState();
  const { attachments } = useAttachments();
  const takeFiles = useAttachmentIntake();
  const inactive = disabled || !!disabledFeatures.attachments;
  const accept = getAcceptedFileTypes(allowedAttachments.types);
  // `maxCount: 0` means no limit, as in Material; apollo-wind would read it as "none allowed".
  // The overlay also counts each drop on its own, so pass what is left of the total.
  const maxCount = allowedAttachments.maxCount || undefined;
  const remaining = maxCount === undefined ? undefined : Math.max(0, maxCount - attachments.length);

  const swallowDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (inactive && carriesFiles(event.dataTransfer)) {
      event.preventDefault();
    }
  };

  // Handled here rather than by the overlay, which would block the paste before checking it and
  // so lose the text pasted along with a file it then refuses.
  const paste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    if (inactive) {
      return;
    }
    const files = filesFrom(event.clipboardData);
    if (files.length === 0) {
      return;
    }
    const { accepted, rejected } = validateFiles(files, {
      accept,
      maxSize: allowedAttachments.maxSize,
      maxFiles: remaining,
    });
    if (accepted.length > 0) {
      // Keeps the browser from also pasting the file's name as text.
      event.preventDefault();
    }
    void takeFiles(accepted, rejected);
  };

  return (
    <DropzoneOverlay
      data-slot="wind-chat-dropzone"
      className="flex min-h-0 flex-1 flex-col"
      disabled={inactive}
      accept={accept}
      maxSize={allowedAttachments.maxSize}
      maxFiles={remaining}
      onDragOver={swallowDrop}
      onDrop={swallowDrop}
      onPaste={paste}
      onFiles={(accepted, rejected) => {
        void takeFiles(accepted, rejected);
      }}
      strings={{
        dropHint: _(
          msg({ id: 'autopilot-chat.dropzone.overlay-title', message: `Drop files here` })
        ),
      }}
    >
      {children}
    </DropzoneOverlay>
  );
}
