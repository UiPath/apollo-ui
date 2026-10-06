import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AutopilotAttachmentsProvider } from '../../../../../chat/headless/providers/attachments-provider';
import { AutopilotChatServiceProvider } from '../../../../../chat/headless/providers/chat-service.provider';
import { AutopilotChatStateProvider } from '../../../../../chat/headless/providers/chat-state-provider';
import { AutopilotErrorProvider } from '../../../../../chat/headless/providers/error-provider';
import { AutopilotLoadingProvider } from '../../../../../chat/headless/providers/loading-provider';
import { LocaleProvider } from '../../../../../chat/headless/providers/locale-provider';
import { AutopilotPickerProvider } from '../../../../../chat/headless/providers/picker-provider';
import { AutopilotResourceDataProvider } from '../../../../../chat/headless/providers/resource-data-provider';
import { AutopilotStreamingProvider } from '../../../../../chat/headless/providers/streaming-provider';
import {
  type AutopilotChatDisabledFeatures,
  AutopilotChatEvent,
  AutopilotChatMode,
  AutopilotChatService,
  DEFAULT_MESSAGE_RENDERER,
} from '../../../../../chat/service';
import { ApI18nProvider } from '../../../../../i18n';
import { AutopilotChatInput } from './chat-input';

let instanceCount = 0;

type InFlight = 'waiting' | 'streaming';

const renderInput = (
  disabledFeatures?: AutopilotChatDisabledFeatures,
  inFlight: InFlight = 'waiting'
) => {
  const chatService = AutopilotChatService.Instantiate({
    instanceName: `chat-input-test-${instanceCount++}`,
    config: disabledFeatures ? { mode: AutopilotChatMode.Closed, disabledFeatures } : undefined,
  });

  const tree: React.ReactElement = (
    <AutopilotChatServiceProvider chatServiceInstance={chatService}>
      <LocaleProvider>
        <ApI18nProvider component="material/components/ap-chat">
          <AutopilotStreamingProvider>
            <AutopilotChatStateProvider>
              <AutopilotErrorProvider>
                <AutopilotLoadingProvider>
                  <AutopilotAttachmentsProvider>
                    <AutopilotPickerProvider>
                      <AutopilotResourceDataProvider>
                        <AutopilotChatInput />
                      </AutopilotResourceDataProvider>
                    </AutopilotPickerProvider>
                  </AutopilotAttachmentsProvider>
                </AutopilotLoadingProvider>
              </AutopilotErrorProvider>
            </AutopilotChatStateProvider>
          </AutopilotStreamingProvider>
        </ApI18nProvider>
      </LocaleProvider>
    </AutopilotChatServiceProvider>
  );

  render(tree);

  const onStop = vi.fn();
  chatService.on(AutopilotChatEvent.StopResponse, onStop);

  act(() => {
    if (inFlight === 'streaming') {
      chatService.sendResponse({
        content: 'Partial',
        created_at: new Date().toISOString(),
        widget: DEFAULT_MESSAGE_RENDERER,
        stream: true,
        done: false,
      });
    } else {
      chatService.setWaiting(true);
    }
  });

  return { chatService, onStop };
};

const submitButton = () => screen.getByTestId('autopilot-chat-submit-button');

describe('<AutopilotChatInput> stop response', () => {
  it('turns the submit button into a stop button while a response is in flight', async () => {
    const user = userEvent.setup();
    const { onStop } = renderInput();

    expect(submitButton()).toHaveAccessibleName('Stop');
    expect(submitButton()).toBeEnabled();

    await user.click(submitButton());

    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('keeps a disabled send button when stopResponse is disabled', () => {
    renderInput({ stopResponse: true });

    expect(submitButton()).toHaveAccessibleName('Send');
    expect(submitButton()).toBeDisabled();
  });

  it('turns the submit button into a stop button while streaming', () => {
    renderInput(undefined, 'streaming');

    expect(submitButton()).toHaveAccessibleName('Stop');
    expect(submitButton()).toBeEnabled();
  });

  it('keeps a disabled send button while streaming when stopResponse is disabled', () => {
    renderInput({ stopResponse: true }, 'streaming');

    expect(submitButton()).toHaveAccessibleName('Send');
    expect(submitButton()).toBeDisabled();
  });

  it('goes back to an enabled stop button when stopResponse is re-enabled', () => {
    const { chatService } = renderInput({ stopResponse: true });

    act(() => {
      chatService.setDisabledFeatures({ stopResponse: false });
    });

    expect(submitButton()).toHaveAccessibleName('Stop');
    expect(submitButton()).toBeEnabled();
  });

  it('picks up stopResponse set after the chat was created', () => {
    const { chatService } = renderInput();

    act(() => {
      chatService.setDisabledFeatures({ stopResponse: true });
    });

    expect(submitButton()).toHaveAccessibleName('Send');
    expect(submitButton()).toBeDisabled();
  });
});
