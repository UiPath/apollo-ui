import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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
