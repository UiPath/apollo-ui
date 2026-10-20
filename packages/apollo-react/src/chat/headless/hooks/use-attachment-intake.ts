import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import React from 'react';

import type { AutopilotChatAllowedAttachments, AutopilotChatFileInfo } from '../../service';
import { useAttachments } from '../providers/attachments-provider';
import { useChatState } from '../providers/chat-state-provider';
import { useError } from '../providers/error-provider';
import { parseFiles } from '../utils/file-reader';

/**
 * Why a dropped, pasted or picked file was turned away, whatever library checked it. `other`
 * counts as a rejection but has no message of its own.
 */
export type ChatAttachmentRejectionReason = 'type' | 'size' | 'count' | 'other';

export interface ChatAttachmentRejection {
  file: File;
  reason: ChatAttachmentRejectionReason;
}

/**
 * The `accept` entries for `allowedAttachments.types` (MIME type to extensions): every MIME type
 * and every extension, so a file a browser mislabels still matches by its extension.
 */
export function getAcceptedFileTypes(types: AutopilotChatAllowedAttachments['types']): string[] {
  return [...Object.keys(types), ...Object.values(types).flat()];
}

/**
 * Checks picked files against `allowedAttachments` the way the drop targets do: a type matches by
 * MIME type or extension, then size, then the count left after `existingCount`. `maxCount: 0`
 * or unset means no limit.
 */
export function checkAttachmentFiles(
  files: readonly File[],
  allowed: AutopilotChatAllowedAttachments,
  existingCount = 0
): { accepted: File[]; rejected: ChatAttachmentRejection[] } {
  const accept = getAcceptedFileTypes(allowed.types).map((entry) => entry.toLowerCase());
  const remaining = allowed.maxCount ? allowed.maxCount - existingCount : Number.POSITIVE_INFINITY;
  const accepted: File[] = [];
  const rejected: ChatAttachmentRejection[] = [];

  for (const file of files) {
    const name = file.name.toLowerCase();
    const typeAccepted =
      accept.length === 0 ||
      accept.some((entry) =>
        entry.startsWith('.') ? name.endsWith(entry) : entry === file.type.toLowerCase()
      );
    if (!typeAccepted) {
      rejected.push({ file, reason: 'type' });
    } else if (file.size > allowed.maxSize) {
      rejected.push({ file, reason: 'size' });
    } else if (accepted.length >= remaining) {
      rejected.push({ file, reason: 'count' });
    } else {
      accepted.push(file);
    }
  }
  return { accepted, rejected };
}

const sameFile = (a: { name: string; size: number }, b: { name: string; size: number }) =>
  a.name === b.name && a.size === b.size;

/**
 * Leaves out files already in the draft (same name and size) or earlier in the batch, then
 * applies `maxCount` to what is left. The checks before the intake counted those duplicates
 * against the free slots, so they are counted again here; `maxCount: 0` means no limit.
 */
export function dropAttachedFiles(
  accepted: readonly File[],
  rejected: readonly ChatAttachmentRejection[],
  draft: readonly { name: string; size: number }[],
  maxCount: number | undefined
): { accepted: File[]; rejected: ChatAttachmentRejection[] } {
  const seen = [...draft];
  const isNew = (file: File) => {
    if (seen.some((other) => sameFile(other, file))) return false;
    seen.push(file);
    return true;
  };
  // Accepted files come before the ones turned away for count, as the checks saw them.
  const candidates = [
    ...accepted,
    ...rejected.filter(({ reason }) => reason === 'count').map(({ file }) => file),
  ].filter(isNew);
  const free = maxCount ? Math.max(0, maxCount - draft.length) : Number.POSITIVE_INFINITY;
  return {
    accepted: candidates.slice(0, free),
    rejected: [
      ...rejected.filter(
        ({ reason, file }) => reason !== 'count' && !draft.some((other) => sameFile(other, file))
      ),
      ...candidates.slice(free).map((file) => ({ file, reason: 'count' as const })),
    ],
  };
}

/**
 * Takes files checked against `allowedAttachments` into the draft, as Material's dropzone does:
 * a second file when only one is allowed, or more than `maxCount`, rejects the whole batch with
 * one message; oversized and wrongly typed files are named in the error and the rest are
 * attached. A file already in the draft is left out silently. Clears the error when nothing was
 * rejected.
 */
export function useAttachmentIntake() {
  const { _ } = useLingui();
  const { addAttachments, getAttachments } = useAttachments();
  const { setError } = useError();
  const { allowedAttachments } = useChatState();

  const handleRejections = React.useCallback(
    (parsedFiles: AutopilotChatFileInfo[], rejections: ChatAttachmentRejection[]) => {
      if (
        !allowedAttachments.multiple &&
        (parsedFiles.length > 1 ||
          (parsedFiles.length > 0 && getAttachments().length > 0) ||
          rejections.length > 1)
      ) {
        setError(
          _(
            msg({
              id: 'autopilot-chat.error.multiple-files',
              message: `Only one file can be attached at a time`,
            })
          )
        );
        return true;
      }

      if (rejections.some(({ reason }) => reason === 'count')) {
        const maxCount = allowedAttachments.maxCount;
        setError(
          _(
            msg({
              id: 'autopilot-chat.error.too-many-files',
              message: `Maximum ${maxCount} files allowed`,
            })
          )
        );
        return true;
      }

      const errorMessages: string[] = [];
      for (const { reason, file } of rejections) {
        const fileName = file.name;
        if (reason === 'size') {
          const fileSizeMB = Math.round(file.size / 1024 / 1024);
          const maxSize = allowedAttachments.maxSize / 1024 / 1024;
          errorMessages.push(
            _(
              msg({
                id: 'autopilot-chat.error.file-too-large',
                message: `${fileName} (${fileSizeMB}MB) exceeds maximum size of ${maxSize}MB`,
              })
            )
          );
        } else if (reason === 'type') {
          errorMessages.push(
            _(
              msg({
                id: 'autopilot-chat.error.file-invalid-type',
                message: `${fileName} has an invalid file type`,
              })
            )
          );
        }
      }
      if (errorMessages.length > 0) {
        setError(errorMessages.join('\n'));
      }
      return false;
    },
    [
      _,
      setError,
      getAttachments,
      allowedAttachments.maxCount,
      allowedAttachments.maxSize,
      allowedAttachments.multiple,
    ]
  );

  return React.useCallback(
    async (checked: File[], checkRejected: ChatAttachmentRejection[]) => {
      try {
        const { accepted, rejected } = dropAttachedFiles(
          checked,
          checkRejected,
          getAttachments(),
          allowedAttachments.maxCount
        );
        const parsedFiles = await parseFiles(accepted);
        if (handleRejections(parsedFiles, rejected)) {
          return;
        }
        if (rejected.length === 0) {
          setError(undefined);
        }
        if (allowedAttachments.multiple) {
          addAttachments(parsedFiles);
        } else if (parsedFiles.length === 1) {
          addAttachments([parsedFiles[0] as AutopilotChatFileInfo]);
        }
      } catch (error) {
        setError(error as string);
      }
    },
    [
      addAttachments,
      getAttachments,
      setError,
      allowedAttachments.maxCount,
      allowedAttachments.multiple,
      handleRejections,
    ]
  );
}
