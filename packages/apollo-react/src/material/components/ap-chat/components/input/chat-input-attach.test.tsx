import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApChat } from '@uipath/apollo-react/ap-chat';
import {
  AutopilotChatEvent,
  AutopilotChatMode,
  AutopilotChatService,
} from '@uipath/apollo-react/chat/service';
import { describe, expect, it } from 'vitest';

let instanceCounter = 0;

describe('Material attach button', () => {
  it('reads maxCount 0 as no limit for picked files', async () => {
    const service = AutopilotChatService.Instantiate({
      instanceName: `material-attach-${++instanceCounter}`,
      config: {
        mode: AutopilotChatMode.FullScreen,
        allowedAttachments: {
          multiple: true,
          types: { 'text/plain': ['.txt'] },
          maxSize: 1024,
          maxCount: 0,
        },
      },
    });
    const added: string[] = [];
    service.on(AutopilotChatEvent.SetAttachments, ({ added: files }: { added: File[] }) =>
      added.push(...files.map(({ name }) => name))
    );
    render(<ApChat chatServiceInstance={service} />);
    await screen.findByRole('button', { name: /Attach file/ }, { timeout: 25_000 });
    // The attach button's input, not the dropzone's.
    const input = document
      .querySelector('[data-testid="autopilot-chat-attach-file-button"]')
      ?.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent
      .setup({ applyAccept: false })
      .upload(input, [
        new File(['a'], 'a.txt', { type: 'text/plain' }),
        new File(['b'], 'b.txt', { type: 'text/plain' }),
      ]);

    await waitFor(() => expect(added).toEqual(['a.txt', 'b.txt']));
    expect(screen.queryByRole('alert')).toBeNull();
  }, 30_000);
});
