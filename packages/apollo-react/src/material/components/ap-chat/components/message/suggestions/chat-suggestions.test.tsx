import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApChat } from '@uipath/apollo-react/chat/root/ApChat';
import {
  AutopilotChatInterceptableEvent,
  type AutopilotChatMessage,
  AutopilotChatMode,
  AutopilotChatService,
} from '@uipath/apollo-react/chat/service';
import { describe, expect, it } from 'vitest';

let instanceCount = 0;
const reply = (content: string) => ({
  content,
  widget: 'apollo-markdown-renderer',
  created_at: '',
});
const FIRST_RUN = {
  title: 'Welcome',
  description: 'Ask anything.',
  suggestions: [{ label: 'Start', prompt: 'How do I start?' }],
};

async function setup(firstRunExperience: typeof FIRST_RUN & { sendOnClick?: boolean }) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `material-suggestions-${instanceCount++}`,
    config: { mode: AutopilotChatMode.FullScreen, renderer: 'material', firstRunExperience },
  });
  const requests: AutopilotChatMessage[] = [];
  service.intercept(AutopilotChatInterceptableEvent.Request, (message: AutopilotChatMessage) => {
    requests.push(message);
  });
  render(<ApChat chatServiceInstance={service} />);
  await screen.findByText('Welcome', {}, { timeout: 25_000 });
  return { service, requests };
}

describe('Material suggestions and first run on the shared state', () => {
  it('shows the first run only while the conversation is empty', async () => {
    const { service } = await setup(FIRST_RUN);

    act(() => service.sendResponse(reply('Hello')));

    expect(screen.queryByText('Welcome')).toBeNull();
  }, 30_000);

  it('falls back to the first-run sendOnClick and keeps suggestions after a later message', async () => {
    const { service, requests } = await setup({ ...FIRST_RUN, sendOnClick: true });
    act(() => service.sendResponse(reply('Twelve invoices.')));
    act(() => service.setSuggestions([{ label: 'Overdue', prompt: 'Which are overdue?' }]));

    act(() => service.sendResponse(reply('And one more thing.')));
    const chip = screen.getByRole('button', { name: 'Overdue' });
    await userEvent.click(chip);

    await waitFor(() => expect(requests).toHaveLength(1));
    expect(requests[0]?.content).toBe('Which are overdue?');
  }, 30_000);

  it('never shows the first run beside a conversation set before it mounts', async () => {
    const service = AutopilotChatService.Instantiate({
      instanceName: `material-suggestions-${instanceCount++}`,
      config: {
        mode: AutopilotChatMode.FullScreen,
        renderer: 'material',
        firstRunExperience: FIRST_RUN,
      },
    });
    service.setConversation([{ ...reply('Earlier answer'), id: 'e1', role: 'assistant' } as never]);
    const seen: boolean[] = [];
    const observer = new MutationObserver(() =>
      seen.push(document.body.textContent?.includes('Welcome') ?? false)
    );
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });

    render(<ApChat chatServiceInstance={service} />);
    await screen.findByText('Earlier answer', {}, { timeout: 25_000 });
    observer.disconnect();

    expect(seen).not.toContain(true);
  }, 30_000);
});
