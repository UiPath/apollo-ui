import { act, render, screen } from '@testing-library/react';
import { AutopilotChatServiceProvider } from '@uipath/apollo-react/chat/headless/providers/chat-service.provider';
import { AutopilotChatStateProvider } from '@uipath/apollo-react/chat/headless/providers/chat-state-provider';
import { AutopilotLoadingProvider } from '@uipath/apollo-react/chat/headless/providers/loading-provider';
import { LocaleProvider } from '@uipath/apollo-react/chat/headless/providers/locale-provider';
import { AutopilotChatService } from '@uipath/apollo-react/chat/service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApI18nProvider } from '../../../../../../i18n';
import { LoadingMessage } from './chat-loading-text';

let instanceCount = 0;

function setup() {
  const service = AutopilotChatService.Instantiate({
    instanceName: `chat-loading-text-${instanceCount++}`,
  });
  service.setDefaultLoadingMessages(['Thinking...', 'Reading...'], 3000);
  const view = render(
    <AutopilotChatServiceProvider chatServiceInstance={service}>
      <LocaleProvider>
        <ApI18nProvider component="material/components/ap-chat">
          <AutopilotChatStateProvider>
            <AutopilotLoadingProvider>
              <LoadingMessage />
            </AutopilotLoadingProvider>
          </AutopilotChatStateProvider>
        </ApI18nProvider>
      </LocaleProvider>
    </AutopilotChatServiceProvider>
  );
  return { service, view };
}

describe('<LoadingMessage>', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('rotates the default messages every duration', () => {
    setup();
    expect(screen.getByText('Thinking...')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3000 + 500));

    expect(screen.getByText('Reading...')).toBeInTheDocument();
  });

  it('fades out, then swaps to a set message', () => {
    const { service } = setup();

    act(() => service.setLoadingMessage('Searching the knowledge base...'));
    expect(screen.getByText('Thinking...')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText('Searching the knowledge base...')).toBeInTheDocument();
  });

  it('keeps nothing running once it unmounts', () => {
    const { service, view } = setup();
    act(() => service.setLoadingMessage('Searching'));
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

    view.unmount();
    // Material UI's own transition timers are pending too; none may reschedule or touch state.
    vi.advanceTimersByTime(20_000);

    expect(vi.getTimerCount()).toBe(0);
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });
});
