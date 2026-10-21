import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import React from 'react';

import type { AutopilotChatAllowedAttachments } from '../../service';

/**
 * The attach limits as both renderers list them by the attach button: the most files (when more
 * than one is allowed), the largest size, and the allowed extensions.
 */
export function useAttachmentLimits(allowed: AutopilotChatAllowedAttachments): string[] {
  const { _ } = useLingui();

  return React.useMemo(() => {
    const lines: string[] = [];
    const maxCount = allowed.maxCount;
    const maxSize = allowed.maxSize / 1024 / 1024;
    const fileTypes = Object.values(allowed.types).flat().join(', ');
    if (maxCount && maxCount > 1 && allowed.multiple) {
      lines.push(
        _(
          msg({
            id: 'autopilot-chat.input.actions.attachments.max-count',
            message: `Maximum ${maxCount} files`,
          })
        )
      );
    }
    lines.push(
      _(
        msg({
          id: 'autopilot-chat.input.actions.attachments.max-size',
          message: `Maximum ${maxSize}MB per file`,
        })
      ),
      _(
        msg({
          id: 'autopilot-chat.input.actions.attachments.allowed-types',
          message: `Allowed types: ${fileTypes}`,
        })
      )
    );
    return lines;
  }, [_, allowed]);
}

export interface DropzoneLimitHints {
  /** Empty unless more than one file is allowed. */
  countHint: string;
  sizeHint: string;
  typesHint: string;
}

/** The limit lines for a drop overlay, worded as Material's dropzone words them. */
export function useDropzoneLimitHints(
  allowed: AutopilotChatAllowedAttachments
): DropzoneLimitHints {
  const { _ } = useLingui();

  return React.useMemo(() => {
    const maxCount = allowed.maxCount;
    const maxSize = allowed.maxSize / 1024 / 1024;
    const fileTypes = Object.values(allowed.types).flat().join(', ');
    return {
      countHint:
        maxCount && maxCount > 1 && allowed.multiple
          ? _(
              msg({
                id: 'autopilot-chat.dropzone.overlay-max-count',
                message: `Maximum ${maxCount} files`,
              })
            )
          : '',
      sizeHint: _(
        msg({
          id: 'autopilot-chat.dropzone.overlay-max-size',
          message: `Maximum file size: ${maxSize}MB`,
        })
      ),
      typesHint: _(
        msg({
          id: 'autopilot-chat.dropzone.allowed-file-types',
          message: `Allowed file types: ${fileTypes}`,
        })
      ),
    };
  }, [_, allowed]);
}
