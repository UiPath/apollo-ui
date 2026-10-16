import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AutopilotChatService } from '../../service';
import { AutopilotChatServiceProvider } from './chat-service.provider';
import {
  AutopilotLoadingProvider,
  DEFAULT_LOADING_MESSAGE_KEY,
  useLoading,
} from './loading-provider';

let instanceCounter = 0;
let loading: ReturnType<typeof useLoading> | undefined;

function Probe() {
  loading = useLoading();
  return null;
}

function setup() {
  const service = AutopilotChatService.Instantiate({
    instanceName: `loading-${++instanceCounter}`,
  });
  render(
    <AutopilotChatServiceProvider chatServiceInstance={service}>
      <AutopilotLoadingProvider>
        <Probe />
      </AutopilotLoadingProvider>
    </AutopilotChatServiceProvider>
  );
  return service;
}

describe('loading messages', () => {
  it('rotates the defaults, takes a set message, and starts each turn from the defaults', () => {
    const service = setup();
    expect(loading?.loadingMessages).toEqual([DEFAULT_LOADING_MESSAGE_KEY]);

    act(() => service.setDefaultLoadingMessages(['Thinking', 'Reading'], 2000));
    expect(loading?.loadingMessages).toEqual(['Thinking', 'Reading']);
    expect(loading?.loadingMessageDuration).toBe(2000);

    act(() => service.setLoadingMessage('Searching'));
    expect(loading?.loadingMessages).toEqual(['Searching']);

    act(() => service.sendRequest({ content: 'next' }));
    expect(loading?.loadingMessages).toEqual(['Thinking', 'Reading']);
    expect(loading?.showLoading).toBe(true);
  });

  it('keeps an earlier duration when new defaults come without one', () => {
    const service = setup();

    act(() => service.setDefaultLoadingMessages(['Thinking'], 2000));
    act(() => service.setDefaultLoadingMessages(['Reading']));

    expect(loading?.loadingMessages).toEqual(['Reading']);
    expect(loading?.loadingMessageDuration).toBe(2000);
  });

  it('starts from the defaults again when the host shows loading', () => {
    const service = setup();
    act(() => service.setDefaultLoadingMessages(['Thinking']));
    act(() => service.setShowLoading(true));
    act(() => service.setLoadingMessage('Searching'));

    act(() => service.setShowLoading(false));
    act(() => service.setShowLoading(true));

    expect(loading?.loadingMessages).toEqual(['Thinking']);
  });
});
