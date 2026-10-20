import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  ApChat,
  AutopilotChatEvent,
  AutopilotChatInternalEvent,
  AutopilotChatMode,
  type AutopilotChatRenderer,
  AutopilotChatService,
} from '../../index';

let instanceCounter = 0;

// Every public event plus the internal panel toggles, in publish order, while `recording.on`.
function recordEvents(service: AutopilotChatService) {
  const events: Array<[string, unknown]> = [];
  const recording = { on: true };
  const record = (event: string) => (data: unknown) => {
    if (recording.on) events.push([event, data]);
  };

  for (const event of Object.values(AutopilotChatEvent)) {
    service.on(event, record(event));
  }
  for (const event of [
    AutopilotChatInternalEvent.ToggleHistory,
    AutopilotChatInternalEvent.ToggleSettings,
  ]) {
    service.__internalService__.on(event, record(event));
  }

  return { events, recording };
}

async function clickHeaderActions(renderer: AutopilotChatRenderer) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `header-parity-${renderer}-${++instanceCounter}`,
    config: {
      mode: AutopilotChatMode.FullScreen,
      renderer,
      disabledFeatures: { settings: false },
    },
  });
  service.setCustomHeaderActions([{ id: 'share', name: 'Share' }]);
  const { unmount } = render(<ApChat chatServiceInstance={service} />);

  // Material loads lazily and its first transform is slow under Vitest.
  await screen.findByTestId('autopilot-chat-new-chat', {}, { timeout: 25_000 });
  const { events, recording } = recordEvents(service);

  for (const testId of [
    'autopilot-chat-new-chat',
    'autopilot-chat-history',
    'autopilot-chat-settings',
  ]) {
    // Each click from closed panels, so each action's events stand alone (Material's history
    // popover is modal and would take the next click).
    recording.on = false;
    act(() => {
      service.toggleHistory(false);
      service.toggleSettings(false);
    });
    recording.on = true;
    await userEvent.click(screen.getByTestId(testId));
  }
  recording.on = false;
  act(() => service.toggleSettings(false));
  recording.on = true;
  await userEvent.click(screen.getByTestId('autopilot-chat-action-menu'));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Share' }));
  await userEvent.click(screen.getByTestId('autopilot-chat-close'));
  unmount();

  return events;
}

describe('header actions parity', () => {
  it('publishes the same service events from the Wind and Material headers', async () => {
    const material = await clickHeaderActions('material');
    const wind = await clickHeaderActions('wind');

    expect(wind.map(([event]) => event)).toEqual([
      AutopilotChatEvent.NewChat,
      AutopilotChatEvent.StopResponse,
      AutopilotChatEvent.SetPrompt,
      // Opening one panel closes the other first.
      AutopilotChatInternalEvent.ToggleSettings,
      AutopilotChatInternalEvent.ToggleHistory,
      AutopilotChatInternalEvent.ToggleHistory,
      AutopilotChatInternalEvent.ToggleSettings,
      AutopilotChatEvent.CustomHeaderActionClicked,
      AutopilotChatEvent.ModeChange,
      AutopilotChatEvent.Close,
    ]);
    expect(wind).toEqual(material);
  }, 40_000);
});
