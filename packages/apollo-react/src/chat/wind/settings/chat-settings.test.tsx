import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  ApChat,
  type AutopilotChatConfiguration,
  AutopilotChatMode,
  AutopilotChatPreHookAction,
  AutopilotChatService,
} from '../../index';

let instanceCounter = 0;

function setup(config: Partial<AutopilotChatConfiguration> = {}) {
  const embeddedContainer = document.createElement('div');
  document.body.append(embeddedContainer);
  const settingsRenderer = vi.fn((container: HTMLElement) => {
    const form = document.createElement('form');
    form.textContent = 'Host settings';
    container.append(form);
  });
  const service = AutopilotChatService.Instantiate({
    instanceName: `wind-settings-${++instanceCounter}`,
    config: {
      mode: AutopilotChatMode.Embedded,
      embeddedContainer,
      disabledFeatures: { settings: false },
      settingsRenderer,
      ...config,
    },
  });
  render(<ApChat chatServiceInstance={service} />);
  return { service, settingsRenderer };
}

const settings = () =>
  document.querySelector('[data-slot="wind-chat-settings"]') as HTMLElement | null;
const content = () =>
  document.querySelector('[data-slot="wind-chat-settings-content"]') as HTMLElement;
const settingsButton = () => screen.getByTestId('autopilot-chat-settings');
const inertAncestor = (element: Element | null) => element?.closest('[inert]') ?? null;

describe('Wind chat settings', () => {
  it('keeps one container for the chat, rendered into on each opening and emptied on close', () => {
    const { service, settingsRenderer } = setup();
    const container = content();
    expect(settings()).toHaveAttribute('data-state', 'closed');
    expect(settingsRenderer).not.toHaveBeenCalled();

    act(() => service.toggleSettings(true));
    expect(settings()).toHaveAttribute('data-state', 'open');
    expect(settingsRenderer).toHaveBeenLastCalledWith(container);
    expect(container).toHaveTextContent('Host settings');

    act(() => service.toggleSettings(false));
    expect(content()).toBe(container);
    expect(container).toBeEmptyDOMElement();

    act(() => service.toggleSettings(true));
    expect(settingsRenderer).toHaveBeenCalledTimes(2);
    expect(settingsRenderer.mock.calls[1]![0]).toBe(container);
  });

  it('slides in over the conversation in Embedded, trapping focus as Material does', async () => {
    const { service } = setup();
    await userEvent.click(settingsButton());

    expect(service.settingsOpen).toBe(true);
    expect(settingsButton()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: 'Chat settings' })).toBe(settings());
    expect(screen.getByTestId('autopilot-chat-settings-close')).toHaveFocus();
    // The conversation is inert; the header and the panel are not.
    expect(inertAncestor(screen.getByRole('log'))).not.toBeNull();
    expect(inertAncestor(settingsButton())).toBeNull();
    expect(inertAncestor(settings())).toBeNull();
    // The slide respects reduced motion.
    expect(settings()).toHaveClass('motion-reduce:transition-none');

    await userEvent.click(screen.getByTestId('autopilot-chat-settings-close'));
    await waitFor(() => expect(service.settingsOpen).toBe(false));
    expect(settings()).toHaveAttribute('data-state', 'closed');
    expect(settingsButton()).toHaveFocus();
    expect(inertAncestor(screen.getByRole('log'))).toBeNull();
  });

  it('closes through the ToggleSettings pre-hook from the X and the header button', async () => {
    const preHook = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
    const { service } = setup({
      preHooks: { [AutopilotChatPreHookAction.ToggleSettings]: preHook },
    });
    act(() => service.toggleSettings(true));

    await userEvent.click(screen.getByTestId('autopilot-chat-settings-close'));
    expect(preHook).toHaveBeenCalledWith({ settingsOpen: true });
    expect(service.settingsOpen).toBe(true);

    await userEvent.click(settingsButton());
    await waitFor(() => expect(service.settingsOpen).toBe(false));
    expect(preHook).toHaveBeenCalledTimes(2);
  });

  it('sits beside the conversation in FullScreen, which makes room, without trapping focus', async () => {
    const { service } = setup({ mode: AutopilotChatMode.FullScreen });
    const place = () =>
      document.querySelector('[data-slot="wind-chat-settings-place"]') as HTMLElement;
    expect(place()).toHaveClass('w-0');

    act(() => service.toggleSettings(true));

    expect(place()).not.toHaveClass('w-0');
    expect(place()).toContainElement(settings());
    expect(screen.getByTestId('autopilot-chat-settings-close')).toHaveFocus();
    expect(inertAncestor(screen.getByRole('log'))).toBeNull();
  });

  it('closes on Escape in the chat through the pre-hook, returning focus to the header button', async () => {
    const preHook = vi.fn().mockResolvedValue(true);
    const { service } = setup({
      preHooks: { [AutopilotChatPreHookAction.ToggleSettings]: preHook },
    });
    const outside = document.createElement('button');
    document.body.append(outside);
    act(() => service.toggleSettings(true));

    // Escape elsewhere on the page is left alone.
    outside.focus();
    await userEvent.keyboard('{Escape}');
    expect(service.settingsOpen).toBe(true);

    screen.getByTestId('autopilot-chat-settings-close').focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(service.settingsOpen).toBe(false));
    expect(preHook).toHaveBeenCalledWith({ settingsOpen: true });
    expect(settingsButton()).toHaveFocus();

    // Closed, Escape in the chat does nothing.
    await userEvent.keyboard('{Escape}');
    expect(preHook).toHaveBeenCalledTimes(1);
    outside.remove();
  });

  it('closes once for a held or repeated Escape while the pre-hook runs', async () => {
    let resolve: (proceed: boolean) => void = () => {};
    const preHook = vi.fn(() => new Promise<boolean>((done) => (resolve = done)));
    const { service } = setup({
      preHooks: { [AutopilotChatPreHookAction.ToggleSettings]: preHook },
    });
    act(() => service.toggleSettings(true));
    const close = screen.getByTestId('autopilot-chat-settings-close');

    fireEvent.keyDown(close, { key: 'Escape' });
    fireEvent.keyDown(close, { key: 'Escape', repeat: true });
    fireEvent.keyDown(close, { key: 'Escape' });
    expect(preHook).toHaveBeenCalledTimes(1);

    await act(async () => resolve(true));
    expect(service.settingsOpen).toBe(false);

    // Composing text (an IME) keeps its Escape.
    act(() => service.toggleSettings(true));
    fireEvent.keyDown(close, { key: 'Escape', isComposing: true });
    expect(preHook).toHaveBeenCalledTimes(1);
  });

  it('is not rendered when settings are disabled', () => {
    setup({ disabledFeatures: { settings: true } });

    expect(settings()).toBeNull();
  });
});
