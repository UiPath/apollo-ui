import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { resolveChatRenderer } from '../headless/renderer-registry';
// The package entry, so the renderer registrations run as they do for consumers.
import {
  ApChat,
  type AutopilotChatConfiguration,
  AutopilotChatEvent,
  AutopilotChatMode,
  AutopilotChatPreHookAction,
  AutopilotChatService,
} from '../index';
import { WindChatRenderer } from './WindChatRenderer';

let instanceCounter = 0;
const createService = (config: Partial<AutopilotChatConfiguration> = {}) =>
  AutopilotChatService.Instantiate({
    instanceName: `wind-renderer-test-${++instanceCounter}`,
    config: { mode: AutopilotChatMode.FullScreen, ...config },
  });

const getRoot = () => document.querySelector<HTMLElement>('[data-slot="wind-chat"]');

describe('WindChatRenderer', () => {
  it('is the renderer registered as wind and the /chat default', () => {
    expect(resolveChatRenderer({ renderer: 'wind' }, 'material')).toBe(WindChatRenderer);
    expect(resolveChatRenderer(undefined, 'wind')).toBe(WindChatRenderer);
  });

  it.each([
    'light',
    'dark',
    'light-hc',
    'dark-hc',
    'future-light',
    'future-dark',
  ] as const)('sets the %s theme class', (theme) => {
    render(<ApChat chatServiceInstance={createService()} theme={theme} />);

    expect(getRoot()).toHaveClass(theme);
  });

  it('follows theme changes without remounting', () => {
    const service = createService();
    const { rerender } = render(<ApChat chatServiceInstance={service} theme="light" />);
    const root = getRoot();

    rerender(<ApChat chatServiceInstance={service} theme="dark-hc" />);

    expect(getRoot()).toBe(root);
    expect(root).toHaveClass('dark-hc');
    expect(root).not.toHaveClass('light');
  });

  it('maps spacing.compactMode to data-density and a shorter header', () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);

    expect(getRoot()).not.toHaveAttribute('data-density');
    expect(screen.getByRole('banner')).toHaveClass('py-4');

    act(() => service.patchConfig({ spacing: { compactMode: true } }));

    expect(getRoot()).toHaveAttribute('data-density', 'compact');
    expect(screen.getByRole('banner')).toHaveClass('py-2');
  });

  it('renders the title, preview badge and override labels', () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Autopilot');
    expect(screen.getByText('Preview')).toBeInTheDocument();

    act(() => {
      service.setOverrideLabels({ title: 'Agent' });
      service.setDisabledFeatures({ preview: true });
    });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Agent');
    expect(screen.queryByText('Preview')).toBeNull();
  });

  it('renders nothing while closed and returns when opened', async () => {
    const service = createService({ mode: AutopilotChatMode.Closed });
    render(<ApChat chatServiceInstance={service} />);

    expect(getRoot()).toBeNull();

    act(() => service.setChatMode(AutopilotChatMode.Embedded));
    // Embedded portals into config.embeddedContainer; without one it renders in place.
    await waitFor(() => expect(getRoot()).toHaveAttribute('data-state', 'open'));

    act(() => service.setChatMode(AutopilotChatMode.Closed));
    expect(getRoot()).toHaveAttribute('data-state', 'closed');
    await waitFor(() => expect(getRoot()).toBeNull());
  });

  it.each([
    [AutopilotChatMode.Embedded, { close: false, logo: false }],
    [AutopilotChatMode.FullScreen, { close: true, logo: true }],
  ])('keeps the %s header unchanged while it fades out', async (mode, expected) => {
    const service = createService({ mode });
    render(<ApChat chatServiceInstance={service} />);
    const header = () => ({
      close: !!screen.queryByTestId('autopilot-chat-close'),
      logo: !!document.querySelector('[data-slot="autopilot-logo"]'),
    });
    expect(header()).toEqual(expected);

    act(() => service.setChatMode(AutopilotChatMode.Closed));

    expect(getRoot()).toHaveAttribute('data-state', 'closed');
    expect(getRoot()).toHaveAttribute('inert');
    expect(header()).toEqual(expected);
    await waitFor(() => expect(getRoot()).toBeNull());
  });

  it('shows an explicit placeholder for SideBySide and no expand action', () => {
    render(<ApChat chatServiceInstance={createService({ mode: AutopilotChatMode.SideBySide })} />);

    expect(document.querySelector('[data-slot="wind-chat-side-by-side"]')).not.toBeNull();
    expect(screen.queryByTestId('autopilot-chat-toggle-fullscreen')).toBeNull();
  });

  it('hides the composer region when read-only', () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);

    expect(document.querySelector('[data-slot="wind-chat-composer"]')).not.toBeNull();

    act(() => service.setReadOnly(true));

    expect(document.querySelector('[data-slot="wind-chat-composer"]')).toBeNull();
    expect(screen.queryByTestId('autopilot-chat-new-chat')).toBeNull();
  });

  it('skips a header action when its pre-hook declines', async () => {
    const service = createService({
      preHooks: { [AutopilotChatPreHookAction.NewChat]: () => Promise.resolve(false) },
    });
    const events: string[] = [];
    service.on(AutopilotChatEvent.NewChat, () => events.push('newChat'));
    render(<ApChat chatServiceInstance={service} />);

    await userEvent.click(screen.getByTestId('autopilot-chat-new-chat'));

    expect(events).toEqual([]);
  });

  it('publishes leaf custom header actions and resolves their lucide icons', async () => {
    const service = createService();
    const clicked: unknown[] = [];
    service.on(AutopilotChatEvent.CustomHeaderActionClicked, (action) => clicked.push(action));
    service.setCustomHeaderActions([
      { id: 'share', name: 'Share', icon: 'Share2' },
      { id: 'pdf', name: 'PDF', icon: 'picture_as_pdf' },
      { id: 'export', name: 'Export', children: [{ id: 'export-pdf', name: 'PDF export' }] },
    ]);
    render(<ApChat chatServiceInstance={service} />);

    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
    const share = await screen.findByRole('menuitem', { name: 'Share' });
    await waitFor(() => expect(share.querySelector('svg.lucide')).not.toBeNull());
    expect(
      screen
        .getByRole('menuitem', { name: 'PDF' })
        .querySelector('[data-slot="service-icon-fallback"]')
    ).not.toBeNull();
    await userEvent.click(share);

    expect(clicked).toEqual([{ id: 'share', name: 'Share', icon: 'Share2' }]);
  });

  it('does not publish a parent with an empty children list, like Material', async () => {
    const service = createService();
    const clicked: unknown[] = [];
    service.on(AutopilotChatEvent.CustomHeaderActionClicked, (action) => clicked.push(action));
    service.setCustomHeaderActions([{ id: 'empty', name: 'Empty parent', children: [] }]);
    render(<ApChat chatServiceInstance={service} />);

    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Empty parent' }));

    expect(clicked).toEqual([]);
  });

  it('shows the configured placeholder and disclaimer in the composer region', () => {
    const service = createService();
    render(<ApChat chatServiceInstance={service} />);

    act(() =>
      service.setOverrideLabels({ inputPlaceholder: 'Ask the agent', footerDisclaimer: 'Be kind' })
    );

    expect(document.querySelector('[data-slot="wind-chat-composer"]')).toHaveTextContent(
      'Ask the agent'
    );
    expect(screen.getByText('Be kind')).toBeInTheDocument();

    act(() => service.setDisabledFeatures({ footer: true }));

    expect(screen.queryByText('Be kind')).toBeNull();
  });
});

describe('Wind overlay placement', () => {
  const codeReply = {
    id: 'code',
    content: '```ts\nconst a = 1;\n```',
    widget: 'apollo-markdown-renderer',
    created_at: '',
  };

  it('portals modal dialogs to a themed node on the body, and keeps menus in the root', async () => {
    const service = createService();
    service.setCustomHeaderActions([{ id: 'share', name: 'Share' }]);
    const { unmount } = render(<ApChat chatServiceInstance={service} theme="dark" />);
    act(() => service.sendResponse(codeReply));

    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
    expect(getRoot()?.contains(await screen.findByRole('menu'))).toBe(true);
    await userEvent.keyboard('{Escape}');

    const expand = screen.getByRole('button', { name: 'Expand' });
    await userEvent.click(expand);
    const dialog = await screen.findByRole('dialog');
    const overlays = dialog.closest('[data-slot="wind-chat-overlays"]');
    expect(overlays?.parentElement).toBe(document.body);
    expect(overlays).toHaveClass('dark');
    expect(getRoot()?.contains(dialog)).toBe(false);
    // Focus moves into the dialog and stays trapped there.
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    await userEvent.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.activeElement).toBe(expand));

    unmount();
    expect(document.querySelector('[data-slot="wind-chat-overlays"]')).toBeNull();
  });

  it('puts every overlay in the host portal container when one is given', async () => {
    const portalContainer = document.createElement('div');
    document.body.appendChild(portalContainer);
    const service = createService();
    service.setCustomHeaderActions([{ id: 'share', name: 'Share' }]);
    render(<ApChat chatServiceInstance={service} portalContainer={portalContainer} />);
    act(() => service.sendResponse(codeReply));

    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
    expect(portalContainer.contains(await screen.findByRole('menu'))).toBe(true);
    await userEvent.keyboard('{Escape}');

    await userEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(portalContainer.contains(await screen.findByRole('dialog'))).toBe(true);
    portalContainer.remove();
  });
});
