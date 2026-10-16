import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import React from 'react';

import { DEFAULT_LOADING_MESSAGE_KEY, useLoading } from '../providers/loading-provider';

export {
  DEFAULT_LOADING_MESSAGE_DURATION,
  DEFAULT_LOADING_MESSAGE_KEY,
} from '../providers/loading-provider';

/**
 * The loading messages to rotate while a reply is pending, how long each shows, and how to
 * display one (the default key becomes the localized "Generating response...").
 */
export function useLoadingMessages() {
  const { _ } = useLingui();
  const { loadingMessages, loadingMessageDuration } = useLoading();

  const translate = React.useCallback(
    (message: string) =>
      message === DEFAULT_LOADING_MESSAGE_KEY
        ? _(
            msg({
              id: 'autopilot-chat.message.generating-response',
              message: `Generating response...`,
            })
          )
        : message,
    [_]
  );

  return { messages: loadingMessages, duration: loadingMessageDuration, translate };
}
