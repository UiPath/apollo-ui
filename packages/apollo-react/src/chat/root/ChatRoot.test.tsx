import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useAttachments } from '../headless/providers/attachments-provider';
import { useChatService } from '../headless/providers/chat-service.provider';
import { useChatState } from '../headless/providers/chat-state-provider';
import { useTheme } from '../headless/providers/theme-provider';
import { registerChatRenderer, registerLazyChatRenderer } from '../headless/renderer-registry';
import { AutopilotChatMode, type AutopilotChatRenderer, AutopilotChatService } from '../service';
import { ChatRoot } from './ChatRoot';

let instanceCounter = 0;
const createService = () =>
  AutopilotChatService.Instantiate({ instanceName: `chat-root-test-${++instanceCounter}` });

// Reads from several headless providers to prove ChatRoot mounted the whole stack.
const ProbeRenderer = ({ label = 'material' }: { label?: string }) => {
  const service = useChatService();
  const { chatMode } = useChatState();
  const { theme } = useTheme();

  return (
    <div data-testid="renderer">
      {label}:{service ? 'service' : 'none'}:{chatMode}:{theme}
    </div>
  );
};

const WindRenderer = () => <div data-testid="renderer">wind</div>;

describe('ChatRoot', () => {
  it('mounts the default renderer inside the headless providers', () => {
    registerChatRenderer('material', ProbeRenderer);

    render(
      <ChatRoot chatServiceInstance={createService()} defaultRenderer="material" theme="dark" />
    );

    expect(screen.getByTestId('renderer')).toHaveTextContent(
      `material:service:${AutopilotChatMode.Closed}:dark`
    );
  });

  it('prefers config.renderer over the default', () => {
    registerChatRenderer('material', ProbeRenderer);
    registerChatRenderer('wind', WindRenderer);
    const service = AutopilotChatService.Instantiate({
      instanceName: `chat-root-test-${++instanceCounter}`,
      config: { mode: AutopilotChatMode.SideBySide, renderer: 'wind' },
    });

    render(<ChatRoot chatServiceInstance={service} defaultRenderer="material" />);

    expect(screen.getByTestId('renderer')).toHaveTextContent('wind');
  });

  it('renders a pinned renderer whatever the config says, warning once', () => {
    registerChatRenderer('material', ProbeRenderer);
    registerChatRenderer('wind', WindRenderer);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const service = AutopilotChatService.Instantiate({
      instanceName: `chat-root-test-${++instanceCounter}`,
      config: { mode: AutopilotChatMode.SideBySide, renderer: 'wind' },
    });

    const first = render(
      <ChatRoot chatServiceInstance={service} defaultRenderer="material" renderer="material" />
    );
    first.unmount();
    render(
      <ChatRoot chatServiceInstance={service} defaultRenderer="material" renderer="material" />
    );

    expect(screen.getByTestId('renderer')).toHaveTextContent('material');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain('renderer "wind" is ignored');
    warn.mockRestore();
  });

  it('switches renderer when the service renderer changes', async () => {
    registerChatRenderer('material', ProbeRenderer);
    registerChatRenderer('wind', WindRenderer);
    const service = createService();
    render(<ChatRoot chatServiceInstance={service} defaultRenderer="material" />);

    act(() => service.setRenderer('wind'));

    await waitFor(() => expect(screen.getByTestId('renderer')).toHaveTextContent('wind'));
  });

  it('loads a lazy renderer behind Suspense', async () => {
    registerLazyChatRenderer('wind', () => Promise.resolve({ default: WindRenderer }));

    render(<ChatRoot chatServiceInstance={createService()} defaultRenderer="wind" />);

    expect(await screen.findByTestId('renderer')).toHaveTextContent('wind');
  });

  it('forwards rendererProps to the renderer', () => {
    registerChatRenderer('material', ProbeRenderer);

    render(
      <ChatRoot
        chatServiceInstance={createService()}
        defaultRenderer="material"
        rendererProps={{ label: 'custom' }}
      />
    );

    expect(screen.getByTestId('renderer')).toHaveTextContent(/^custom:/);
  });

  it('syncs locale and theme props to the service', () => {
    registerChatRenderer('material', ProbeRenderer);
    const service = createService();

    const { rerender } = render(
      <ChatRoot chatServiceInstance={service} defaultRenderer="material" locale="fr" theme="dark" />
    );
    expect(service.getLocale()).toBe('fr');
    expect(service.getTheme()).toBe('dark');

    rerender(
      <ChatRoot
        chatServiceInstance={service}
        defaultRenderer="material"
        locale="de"
        theme="light"
      />
    );
    expect(service.getLocale()).toBe('de');
    expect(service.getTheme()).toBe('light');
  });

  it('renders the theme prop on the first render, before it reaches the service', () => {
    const firstThemes: string[] = [];
    const FirstThemeRenderer = () => {
      const { theme } = useTheme();
      if (firstThemes.length === 0) {
        firstThemes.push(theme);
      }
      return null;
    };
    registerChatRenderer('material', FirstThemeRenderer);

    render(
      <ChatRoot chatServiceInstance={createService()} defaultRenderer="material" theme="dark" />
    );

    expect(firstThemes).toEqual(['dark']);
  });

  it('falls back to the default renderer when config.renderer is not registered', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerChatRenderer('material', ProbeRenderer);
    const service = createService();
    service.setRenderer('missing' as AutopilotChatRenderer);

    render(<ChatRoot chatServiceInstance={service} defaultRenderer="material" />);

    expect(screen.getByTestId('renderer')).toHaveTextContent(/^material:/);
    expect(warn).toHaveBeenCalledWith(
      'No chat renderer registered for "missing"; using "material".'
    );
    warn.mockRestore();
  });

  it('logs and renders nothing when the renderer is not registered', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ChatRoot
        chatServiceInstance={createService()}
        defaultRenderer={'missing' as AutopilotChatRenderer}
      />
    );

    expect(screen.queryByTestId('renderer')).toBeNull();
    expect(error).toHaveBeenCalledWith('No chat renderer registered for "missing".');
    error.mockRestore();
  });

  describe('embedded mode', () => {
    const createEmbeddedService = (embeddedContainer: HTMLElement) =>
      AutopilotChatService.Instantiate({
        instanceName: `chat-root-test-${++instanceCounter}`,
        config: { mode: AutopilotChatMode.Embedded, embeddedContainer },
      });

    it('portals into the embedded container', () => {
      registerChatRenderer('material', ProbeRenderer);
      const embeddedContainer = document.createElement('div');
      document.body.appendChild(embeddedContainer);

      const { container } = render(
        <ChatRoot
          chatServiceInstance={createEmbeddedService(embeddedContainer)}
          defaultRenderer="material"
        />
      );

      expect(embeddedContainer.querySelector('[data-testid="renderer"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="renderer"]')).toBeNull();
      embeddedContainer.remove();
    });

    it('keeps the providers mounted when the renderer moves in or out of the container', () => {
      const mounts = vi.fn();
      // The draft lives only in a provider, so it would be lost if the stack remounted.
      let addAttachments: ReturnType<typeof useAttachments>['addAttachments'] = () => {};
      const MountCounter = () => {
        React.useEffect(() => mounts(), []);
        const attachments = useAttachments();
        addAttachments = attachments.addAttachments;
        return <div data-testid="renderer">{attachments.attachments.length}</div>;
      };
      registerChatRenderer('material', MountCounter);
      const embeddedContainer = document.createElement('div');
      document.body.appendChild(embeddedContainer);
      const service = createEmbeddedService(embeddedContainer);
      render(<ChatRoot chatServiceInstance={service} defaultRenderer="material" />);
      // The container is read after mount, so the first render is in place, as before.
      mounts.mockClear();
      act(() =>
        addAttachments([
          { name: 'draft.txt', type: 'text/plain', size: 1, lastModified: 1 } as never,
        ])
      );
      const where = () =>
        embeddedContainer.contains(screen.getByTestId('renderer')) ? 'container' : 'in place';

      expect([where(), screen.getByTestId('renderer').textContent]).toEqual(['container', '1']);
      act(() => service.setChatMode(AutopilotChatMode.FullScreen));
      expect([where(), screen.getByTestId('renderer').textContent]).toEqual(['in place', '1']);
      act(() => service.setChatMode(AutopilotChatMode.Embedded));
      expect([where(), screen.getByTestId('renderer').textContent]).toEqual(['container', '1']);
      // The renderer itself still remounts when it moves, as before.
      expect(mounts).toHaveBeenCalledTimes(2);
      embeddedContainer.remove();
    });

    it('leaves the renderer in the container while the embedded chat is closed', () => {
      const mounts = vi.fn();
      const MountCounter = () => {
        React.useEffect(() => mounts(), []);
        return <div data-testid="renderer" />;
      };
      registerChatRenderer('material', MountCounter);
      const embeddedContainer = document.createElement('div');
      document.body.appendChild(embeddedContainer);
      const service = createEmbeddedService(embeddedContainer);
      render(<ChatRoot chatServiceInstance={service} defaultRenderer="material" />);
      mounts.mockClear();

      act(() => service.setChatMode(AutopilotChatMode.Closed));
      expect(embeddedContainer.querySelector('[data-testid="renderer"]')).not.toBeNull();
      act(() => service.setChatMode(AutopilotChatMode.Embedded));
      expect(embeddedContainer.querySelector('[data-testid="renderer"]')).not.toBeNull();
      expect(mounts).not.toHaveBeenCalled();

      // Opened in another mode, it leaves the container.
      act(() => service.setChatMode(AutopilotChatMode.Closed));
      act(() => service.setChatMode(AutopilotChatMode.FullScreen));
      expect(embeddedContainer.querySelector('[data-testid="renderer"]')).toBeNull();
      embeddedContainer.remove();
    });

    it('leaves the container for another service, or once the closed service stops naming it', () => {
      registerChatRenderer('material', ProbeRenderer);
      const embeddedContainer = document.createElement('div');
      document.body.appendChild(embeddedContainer);
      const inContainer = () => !!embeddedContainer.querySelector('[data-testid="renderer"]');
      const first = createEmbeddedService(embeddedContainer);
      const view = render(<ChatRoot chatServiceInstance={first} defaultRenderer="material" />);
      act(() => first.setChatMode(AutopilotChatMode.Closed));
      expect(inContainer()).toBe(true);

      // Another closed service is not portalled into the first one's container.
      const second = AutopilotChatService.Instantiate({
        instanceName: `chat-root-test-${++instanceCounter}`,
        config: { mode: AutopilotChatMode.Closed },
      });
      view.rerender(<ChatRoot chatServiceInstance={second} defaultRenderer="material" />);
      expect(inContainer()).toBe(false);

      view.rerender(<ChatRoot chatServiceInstance={first} defaultRenderer="material" />);
      act(() => first.setChatMode(AutopilotChatMode.Embedded));
      act(() => first.setChatMode(AutopilotChatMode.Closed));
      expect(inContainer()).toBe(true);
      act(() => first.patchConfig({ embeddedContainer: undefined }));
      expect(inContainer()).toBe(false);
      embeddedContainer.remove();
    });

    it('keeps the providers mounted across modes under StrictMode too', () => {
      let addAttachments: ReturnType<typeof useAttachments>['addAttachments'] = () => {};
      const DraftCount = () => {
        const attachments = useAttachments();
        addAttachments = attachments.addAttachments;
        return <div data-testid="renderer">{attachments.attachments.length}</div>;
      };
      registerChatRenderer('material', DraftCount);
      const embeddedContainer = document.createElement('div');
      document.body.appendChild(embeddedContainer);
      const service = createEmbeddedService(embeddedContainer);
      render(
        <React.StrictMode>
          <ChatRoot chatServiceInstance={service} defaultRenderer="material" />
        </React.StrictMode>
      );
      act(() =>
        addAttachments([
          { name: 'draft.txt', type: 'text/plain', size: 1, lastModified: 1 } as never,
        ])
      );

      act(() => service.setChatMode(AutopilotChatMode.FullScreen));
      act(() => service.setChatMode(AutopilotChatMode.Closed));
      act(() => service.setChatMode(AutopilotChatMode.Embedded));

      expect(embeddedContainer.querySelector('[data-testid="renderer"]')).toHaveTextContent('1');
      embeddedContainer.remove();
    });

    it('renders in place when disableEmbeddedPortal is set', () => {
      registerChatRenderer('material', ProbeRenderer);
      const embeddedContainer = document.createElement('div');
      document.body.appendChild(embeddedContainer);

      const { container } = render(
        <ChatRoot
          chatServiceInstance={createEmbeddedService(embeddedContainer)}
          defaultRenderer="material"
          disableEmbeddedPortal
        />
      );

      expect(container.querySelector('[data-testid="renderer"]')).not.toBeNull();
      expect(embeddedContainer.querySelector('[data-testid="renderer"]')).toBeNull();
      embeddedContainer.remove();
    });
  });
});
