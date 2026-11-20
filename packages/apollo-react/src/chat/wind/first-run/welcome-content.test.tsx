import { act, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  ApChat,
  type AutopilotChatConfiguration,
  AutopilotChatMode,
  AutopilotChatService,
} from '../../index';

let instanceCounter = 0;
const FIRST_RUN = {
  title: 'Welcome to Autopilot',
  description: 'Ask about your automations.',
  suggestions: [{ label: 'New process', prompt: 'How do I create a new process?' }],
};

const hostForm = () => {
  const cleanup = vi.fn();
  const welcomeContent = vi.fn((container: HTMLElement) => {
    const form = document.createElement('form');
    form.setAttribute('aria-label', 'Agent inputs');
    container.append(form);
    return cleanup;
  });
  return { welcomeContent, cleanup };
};

function setup(config: Partial<AutopilotChatConfiguration> = {}) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `wind-welcome-content-${++instanceCounter}`,
    config: {
      mode: AutopilotChatMode.FullScreen,
      renderer: 'wind',
      firstRunExperience: FIRST_RUN,
      ...config,
    },
  });
  render(<ApChat chatServiceInstance={service} />);
  return service;
}

const hero = () => document.querySelector('[data-slot="chat-hero"]') as HTMLElement;
const textbox = () => screen.getByRole('textbox', { name: 'Message' });
const form = () => screen.queryByRole('form', { name: 'Agent inputs' });
const follows = (earlier: Element, later: Element) =>
  !!(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING);
const reply = { content: 'Hello', widget: 'apollo-markdown-renderer', created_at: '' };
// The hide runs in a microtask after the commit; an async act waits for it.
const settle = (change: () => void) => act(async () => change());

describe('Wind welcome content', () => {
  it('shows under the welcome text, above the suggestions and the composer, in FullScreen', () => {
    const { welcomeContent } = hostForm();
    setup({ welcomeContent });

    expect(welcomeContent).toHaveBeenCalledTimes(1);
    expect(hero()).toHaveAttribute('data-layout', 'centered');
    expect(hero().contains(form())).toBe(true);
    const heading = within(hero()).getByRole('heading', { name: 'Welcome to Autopilot' });
    const suggestions = within(hero()).getByRole('group', { name: 'Suggestions' });
    expect(follows(heading, form()!)).toBe(true);
    expect(follows(form()!, suggestions)).toBe(true);
    expect(follows(suggestions, textbox())).toBe(true);
  });

  it('shows in the docked first-run experience, above the composer, in Embedded', () => {
    const { welcomeContent } = hostForm();
    setup({ welcomeContent, mode: AutopilotChatMode.Embedded });

    expect(hero()).toHaveAttribute('data-layout', 'docked');
    expect(hero().contains(form())).toBe(true);
    expect(follows(form()!, textbox())).toBe(true);
  });

  it('shows the first-run experience for welcome content alone', () => {
    const { welcomeContent } = hostForm();
    setup({ welcomeContent, firstRunExperience: undefined });

    expect(hero()).toHaveAttribute('data-first-run');
    expect(hero().contains(form())).toBe(true);
  });

  it('is emptied when the conversation starts and filled again in a new chat', async () => {
    const { welcomeContent, cleanup } = hostForm();
    const service = setup({ welcomeContent });
    const container = welcomeContent.mock.calls[0]![0];

    await settle(() => service.sendResponse(reply));
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(container.children).toHaveLength(0);
    expect(form()).toBeNull();

    await settle(() => service.newChat());
    expect(welcomeContent).toHaveBeenCalledTimes(2);
    expect(welcomeContent.mock.calls[1]![0]).toBe(container);
    expect(hero().contains(form())).toBe(true);
  });

  it('keeps the host content when the chat switches layout', async () => {
    const { welcomeContent, cleanup } = hostForm();
    const service = setup({ welcomeContent, mode: AutopilotChatMode.Embedded });
    const rendered = form();

    await settle(() => service.setChatMode(AutopilotChatMode.FullScreen));

    expect(hero()).toHaveAttribute('data-layout', 'centered');
    expect(welcomeContent).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
    expect(form()).toBe(rendered);
    expect(hero().contains(rendered)).toBe(true);
  });

  it('follows welcomeContent being set and removed, but not replaced', async () => {
    const { welcomeContent, cleanup } = hostForm();
    const service = setup();
    expect(form()).toBeNull();

    await settle(() => service.patchConfig({ welcomeContent }));
    expect(hero().contains(form())).toBe(true);

    const replacement = vi.fn();
    await settle(() => service.patchConfig({ welcomeContent: replacement }));
    expect(replacement).not.toHaveBeenCalled();
    expect(cleanup).not.toHaveBeenCalled();
    expect(hero().contains(form())).toBe(true);

    await settle(() => service.patchConfig({ welcomeContent: undefined }));
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(form()).toBeNull();
  });

  it('hides the first-run suggestions while the composer is locked', async () => {
    const { welcomeContent } = hostForm();
    const service = setup({ welcomeContent, composerLocked: true });

    expect(within(hero()).queryByRole('group', { name: 'Suggestions' })).toBeNull();
    expect(hero().contains(form())).toBe(true);

    await settle(() => service.setComposerLocked(false));
    expect(within(hero()).getByRole('group', { name: 'Suggestions' })).toBeInTheDocument();
  });

  it('shows without a composer in read-only mode', () => {
    const { welcomeContent } = hostForm();
    setup({ welcomeContent, readOnly: true });

    expect(hero().contains(form())).toBe(true);
    expect(screen.queryByRole('textbox', { name: 'Message' })).toBeNull();
  });

  it('is not rendered by the Material renderer', async () => {
    const { welcomeContent } = hostForm();
    setup({ welcomeContent, renderer: 'material' });

    // Material loads lazily; its submit button says it is up.
    await screen.findByTestId('autopilot-chat-submit-button', undefined, { timeout: 25_000 });
    expect(welcomeContent).not.toHaveBeenCalled();
  });
});
