import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import type { ChatComposerStrings } from '@uipath/apollo-wind';
import React from 'react';

/** The composer's strings, with Material's ids where Material has the same text. */
export function useComposerStrings(placeholder: string): Partial<ChatComposerStrings> {
  const { _ } = useLingui();

  return React.useMemo(
    () => ({
      label: _(msg({ id: 'autopilot-chat.input.label', message: `Message` })),
      placeholder,
      send: _(msg({ id: 'autopilot-chat.input.actions.send', message: `Send` })),
      stop: _(msg({ id: 'autopilot-chat.input.actions.stop', message: `Stop` })),
      attach: _(msg({ id: 'autopilot-chat.input.actions.attach-file', message: `Attach file` })),
      // Named `name` to match the catalog's placeholder.
      removeAttachment: (name) =>
        _(
          msg({
            id: 'autopilot-chat.common.attachments.remove-file-name',
            message: `Remove ${name}`,
          })
        ),
      dismissError: _(msg({ id: 'autopilot-chat.input.error.dismiss', message: `Dismiss` })),
    }),
    [_, placeholder]
  );
}
