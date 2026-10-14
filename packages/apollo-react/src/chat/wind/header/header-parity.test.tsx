import { render, screen } from '@testing-library/react';
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

// Every public event plus the internal panel toggles, in publish order.
function recordEvents(service: AutopilotChatService) {
  const events: Array<[string, unknown]> = [];

  for (const event of Object.values(AutopilotChatEvent)) {
    service.on(event, (data) => events.push([event, data]));
  }
  for (const event of [
    AutopilotChatInternalEvent.ToggleHistory,
    AutopilotChatInternalEvent.ToggleSettings,
  ]) {
    service.__internalService__.on(event, (data) => events.push([event, data]));
  }

  return events;
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
  const events = recordEvents(service);

  for (const testId of [
    'autopilot-chat-new-chat',
    'autopilot-chat-history',
    'autopilot-chat-settings',
  ]) {
    await userEvent.click(screen.getByTestId(testId));
  }
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
