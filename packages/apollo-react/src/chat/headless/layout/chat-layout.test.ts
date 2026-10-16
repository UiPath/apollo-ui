import { describe, expect, it } from 'vitest';

import { AutopilotChatMode } from '../../service';
import { resolveChatLayout } from './chat-layout';

describe('resolveChatLayout', () => {
  it('shows everything by default', () => {
    expect(
      resolveChatLayout({
        chatMode: AutopilotChatMode.Embedded,
        disabledFeatures: {},
        readOnly: false,
      })
    ).toEqual({
      mode: AutopilotChatMode.Embedded,
      isOpen: true,
      showHeader: true,
      showHeaderSeparator: true,
      showComposer: true,
      historyAvailable: true,
      settingsAvailable: true,
      fullHeight: false,
    });
  });

  it('hides the header only outside FullScreen', () => {
    const disabledFeatures = { header: true };

    expect(
      resolveChatLayout({ chatMode: AutopilotChatMode.Embedded, disabledFeatures, readOnly: false })
        .showHeader
    ).toBe(false);
    expect(
      resolveChatLayout({
        chatMode: AutopilotChatMode.FullScreen,
        disabledFeatures,
        readOnly: false,
      }).showHeader
    ).toBe(true);
  });

  it('drops the composer when read-only and maps the remaining flags', () => {
    const layout = resolveChatLayout({
      chatMode: AutopilotChatMode.Closed,
      disabledFeatures: { history: true, settings: true, headerSeparator: true, fullHeight: false },
      readOnly: true,
    });

    expect(layout).toMatchObject({
      isOpen: false,
      showComposer: false,
      historyAvailable: false,
      settingsAvailable: false,
      showHeaderSeparator: false,
      fullHeight: true,
    });
  });
});
