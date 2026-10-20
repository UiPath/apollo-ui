import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { DropzoneOverlay } from '@uipath/apollo-wind';
import React from 'react';

import {
  getAcceptedFileTypes,
  useAttachmentIntake,
} from '../../headless/hooks/use-attachment-intake';
import { useDropzoneLimitHints } from '../../headless/hooks/use-attachment-limits';
import { useAttachments } from '../../headless/providers/attachments-provider';
import { useChatState } from '../../headless/providers/chat-state-provider';

const carriesFiles = (data: DataTransfer | null) => Array.from(data?.types ?? []).includes('Files');

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
  const accept = React.useMemo(
    () => getAcceptedFileTypes(allowedAttachments.types),
    [allowedAttachments.types]
  );
  const limitHints = useDropzoneLimitHints(allowedAttachments);
  const dropHint = _(
    msg({ id: 'autopilot-chat.dropzone.overlay-title', message: `Drop files here` })
  );
  const strings = React.useMemo(() => ({ dropHint, ...limitHints }), [dropHint, limitHints]);
  // `maxCount: 0` means no limit, as in Material; apollo-wind would read it as "none allowed".
  // The overlay also counts each drop on its own, so pass what is left of the total.
  const maxCount = allowedAttachments.maxCount || undefined;
  const remaining = maxCount === undefined ? undefined : Math.max(0, maxCount - attachments.length);

  const swallowDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (inactive && carriesFiles(event.dataTransfer)) {
      event.preventDefault();
    }
  };

  return (
    <DropzoneOverlay
      data-slot="wind-chat-dropzone"
      // The overlay has no inset of its own, and the types line wraps in a narrow panel.
      className="flex min-h-0 flex-1 flex-col [&_[data-slot=dropzone-overlay]]:px-6 [&_[data-slot=dropzone-overlay]]:text-center"
      disabled={inactive}
      accept={accept}
      maxSize={allowedAttachments.maxSize}
      maxFiles={remaining}
      onDragOver={swallowDrop}
      onDrop={swallowDrop}
      // A paste of refused files keeps its text; one that attaches a file does not paste its name.
      enablePaste
      onFiles={(accepted, rejected) => {
        void takeFiles(accepted, rejected);
      }}
      strings={strings}
    >
      {children}
    </DropzoneOverlay>
  );
}
