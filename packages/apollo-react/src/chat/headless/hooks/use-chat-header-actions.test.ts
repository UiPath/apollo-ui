import { describe, expect, it } from 'vitest';

import { AutopilotChatMode } from '../../service';
import { getChatHeaderActionVisibility } from './use-chat-header-actions';

const visibility = (
  chatMode: AutopilotChatMode,
  disabledFeatures = {},
  readOnly = false,
  customActionCount = 0
) => getChatHeaderActionVisibility({ chatMode, disabledFeatures, readOnly, customActionCount });

describe('getChatHeaderActionVisibility', () => {
  it('shows the built-ins outside Embedded', () => {
    expect(visibility(AutopilotChatMode.FullScreen, {}, false, 1)).toEqual({
      newChat: true,
      settings: true,
      history: true,
      fullScreenToggle: true,
      customActions: true,
      close: true,
    });
  });

  it('makes close opt-in and hides the full-screen toggle in Embedded', () => {
    expect(visibility(AutopilotChatMode.Embedded)).toMatchObject({
      close: false,
      fullScreenToggle: false,
    });
    expect(visibility(AutopilotChatMode.Embedded, { close: false }).close).toBe(true);
  });

  it('hides editing actions when read-only but keeps close', () => {
    expect(visibility(AutopilotChatMode.SideBySide, {}, true, 2)).toEqual({
      newChat: false,
      settings: false,
      history: false,
      fullScreenToggle: true,
      customActions: false,
      close: true,
    });
  });

  it('honours each disabled feature', () => {
    expect(
      visibility(AutopilotChatMode.FullScreen, {
        newChat: true,
        settings: true,
        history: true,
        fullScreen: true,
        close: true,
      })
    ).toEqual({
      newChat: false,
      settings: false,
      history: false,
      fullScreenToggle: false,
      customActions: false,
      close: false,
    });
  });
});
