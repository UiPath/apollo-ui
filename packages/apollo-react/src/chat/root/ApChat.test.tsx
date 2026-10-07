import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// The package entry, so the wind and lazy material registrations run as they do for consumers.
import { ApChat, AutopilotChatMode, AutopilotChatService } from '../index';

let instanceCounter = 0;
const createService = (renderer?: 'material' | 'wind') =>
  AutopilotChatService.Instantiate({
    instanceName: `chat-ap-chat-test-${++instanceCounter}`,
    config: { mode: AutopilotChatMode.SideBySide, ...(renderer && { renderer }) },
  });

describe('ApChat from @uipath/apollo-react/chat', () => {
  it('renders the wind placeholder by default', () => {
    render(<ApChat chatServiceInstance={createService()} />);

    expect(screen.getByText(/Wind chat renderer is not available yet/)).toBeInTheDocument();
  });

  it('loads the Material renderer on demand when config.renderer is material', async () => {
    render(<ApChat chatServiceInstance={createService('material')} />);

    // First load transforms the whole Material tree, which is slow under Vitest.
    expect(await screen.findByText('Autopilot', {}, { timeout: 25_000 })).toBeInTheDocument();
    expect(screen.queryByText(/Wind chat renderer is not available yet/)).toBeNull();
  }, 30_000);
});
