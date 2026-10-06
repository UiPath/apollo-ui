import { describe, expect, it, vi } from 'vitest';

import {
  AutopilotChatEvent,
  AutopilotChatInterceptableEvent,
  AutopilotChatInternalEvent,
} from './ChatModel';
import { AutopilotChatService } from './ChatService';

// Instances are cached by name on a static map, so each test asks for fresh names.
let instanceCounter = 0;
const createService = () =>
  AutopilotChatService.Instantiate({ instanceName: `chat-service-test-${++instanceCounter}` });

describe('AutopilotChatService', () => {
  describe('Instantiate', () => {
    it('returns the cached instance for a repeated name', () => {
      const name = `chat-service-test-${++instanceCounter}`;
      const first = AutopilotChatService.Instantiate({ instanceName: name });

      expect(AutopilotChatService.Instantiate({ instanceName: name })).toBe(first);
      expect(AutopilotChatService.getInstance(name)).toBe(first);
    });

    it('creates separate instances for different names', () => {
      expect(createService()).not.toBe(createService());
    });

    it('applies the config passed on instantiation', () => {
      const name = `chat-service-test-${++instanceCounter}`;
      const service = AutopilotChatService.Instantiate({
        instanceName: name,
        config: { locale: 'fr', theme: 'dark' },
      });

      expect(service.getLocale()).toBe('fr');
      expect(service.getTheme()).toBe('dark');
    });
  });

  describe('instance isolation', () => {
    it('gives each instance its own internal service', () => {
      expect(createService().__internalService__).not.toBe(createService().__internalService__);
    });

    it.each([
      [
        'theme',
        AutopilotChatInternalEvent.SetTheme,
        (s: AutopilotChatService) => s.setTheme('dark'),
      ],
      [
        'locale',
        AutopilotChatInternalEvent.SetLocale,
        (s: AutopilotChatService) => s.setLocale('de'),
      ],
      [
        'history toggle',
        AutopilotChatInternalEvent.ToggleHistory,
        (s: AutopilotChatService) => s.toggleHistory(true),
      ],
    ])('does not leak %s events to other instances', (_label, event, act) => {
      const a = createService();
      const b = createService();
      const onA = vi.fn();
      const onB = vi.fn();
      a.__internalService__.on(event, onA);
      b.__internalService__.on(event, onB);

      act(a);

      expect(onA).toHaveBeenCalledTimes(1);
      expect(onB).not.toHaveBeenCalled();
    });

    it('does not leak public events to other instances', async () => {
      const a = createService();
      const b = createService();
      const onB = vi.fn();
      b.on(AutopilotChatEvent.NewChat, onB);

      a.newChat();
      await Promise.resolve();

      expect(onB).not.toHaveBeenCalled();
    });
  });

  describe('intercept', () => {
    it('lets a Request interceptor hijack the request', async () => {
      const service = createService();
      const handler = vi.fn();
      service.intercept(AutopilotChatInterceptableEvent.Request, () => true);
      service.on(AutopilotChatEvent.Request, handler);

      service.sendRequest({ content: 'hi' });

      await vi.waitFor(() =>
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({ content: 'hi', hijacked: true })
        )
      );
    });

    it('ignores interceptors for events that are not interceptable', async () => {
      const service = createService();
      const interceptor = vi.fn(() => true);
      const handler = vi.fn();
      const remove = service.intercept(
        AutopilotChatEvent.NewChat as unknown as AutopilotChatInterceptableEvent,
        interceptor
      );
      service.on(AutopilotChatEvent.NewChat, handler);

      service.newChat();

      await vi.waitFor(() => expect(handler).toHaveBeenCalled());
      expect(interceptor).not.toHaveBeenCalled();
      expect(remove).toBeTypeOf('function');
    });
  });
});
