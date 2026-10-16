import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AutopilotChatService } from '../../service';
import { AutopilotChatServiceProvider } from '../providers/chat-service.provider';
import { AutopilotChatStateProvider } from '../providers/chat-state-provider';
import { useSettingsRenderer } from './use-settings-renderer';

let instanceCounter = 0;

function Probe({ container }: { container: HTMLElement }) {
  useSettingsRenderer(container);
  return null;
}

function setup(settingsRenderer: (container: HTMLElement) => void) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `use-settings-renderer-${++instanceCounter}`,
    config: { settingsRenderer },
  });
  const container = document.createElement('div');
  render(
    <AutopilotChatServiceProvider chatServiceInstance={service}>
      <AutopilotChatStateProvider>
        <Probe container={container} />
      </AutopilotChatStateProvider>
    </AutopilotChatServiceProvider>
  );
  return { service, container };
}

describe('useSettingsRenderer', () => {
  it('renders into the same container on each opening and empties it on close', () => {
    const settingsRenderer = vi.fn((target: HTMLElement) => {
      target.append(document.createElement('form'));
    });
    const { service, container } = setup(settingsRenderer);
    expect(settingsRenderer).not.toHaveBeenCalled();

    act(() => service.toggleSettings(true));
    expect(settingsRenderer).toHaveBeenLastCalledWith(container);
    expect(container.children).toHaveLength(1);

    act(() => service.toggleSettings(false));
    expect(container.children).toHaveLength(0);

    act(() => service.toggleSettings(true));
    expect(settingsRenderer).toHaveBeenCalledTimes(2);
    expect(settingsRenderer.mock.calls[1]![0]).toBe(container);
    expect(container.children).toHaveLength(1);
  });

  it('survives a failing renderer', () => {
    const { service, container } = setup(() => {
      throw new Error('host failed');
    });

    expect(() => act(() => service.toggleSettings(true))).not.toThrow();
    expect(container.children).toHaveLength(0);
  });
});
