import { render, screen, waitFor } from '@testing-library/react';
import { AutopilotChatMode, AutopilotChatService } from '@uipath/apollo-react/chat/service';
import { describe, expect, it } from 'vitest';

import { ApChat } from './ap-chat';

let instanceCount = 0;

describe('ApChat from the ap-chat entry', () => {
  it('renders Material by default and Wind when the host opts in', async () => {
    const material = AutopilotChatService.Instantiate({
      instanceName: `ap-chat-entry-material-${instanceCount++}`,
      config: { mode: AutopilotChatMode.FullScreen },
    });
    const wind = AutopilotChatService.Instantiate({
      instanceName: `ap-chat-entry-wind-${instanceCount++}`,
      config: { mode: AutopilotChatMode.FullScreen, renderer: 'wind' },
    });

    render(<ApChat chatServiceInstance={material} />);
    render(<ApChat chatServiceInstance={wind} />);

    // Material renders its header; Wind loads on first use from this entry.
    expect(
      await screen.findByTestId('autopilot-chat-new-chat', {}, { timeout: 25_000 })
    ).toBeInTheDocument();
    await waitFor(
      () => expect(document.querySelectorAll('[data-slot="wind-chat"]')).toHaveLength(1),
      { timeout: 25_000 }
    );
    expect(screen.getAllByTestId('autopilot-chat-new-chat')).toHaveLength(2);
  }, 30_000);
});
