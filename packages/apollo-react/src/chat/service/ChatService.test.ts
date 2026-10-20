import { describe, expect, it, vi } from 'vitest';

import {
  AutopilotChatEvent,
  AutopilotChatInterceptableEvent,
  AutopilotChatInternalEvent,
  AutopilotChatMode,
  AutopilotChatRole,
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

  describe('renderer', () => {
    it('stores the renderer and emits RendererChange', () => {
      const service = createService();
      const handler = vi.fn();
      service.on(AutopilotChatEvent.RendererChange, handler);

      service.setRenderer('wind');

      expect(service.getConfig().renderer).toBe('wind');
      expect(handler).toHaveBeenCalledWith('wind');
    });

    it('applies config.renderer on initialize', () => {
      const service = createService();
      const handler = vi.fn();
      service.on(AutopilotChatEvent.RendererChange, handler);

      service.initialize({ mode: AutopilotChatMode.SideBySide, renderer: 'material' });

      expect(service.getConfig().renderer).toBe('material');
      expect(handler).toHaveBeenCalledWith('material');
    });
  });

  describe('history', () => {
    it('forgets the open conversation on a new chat', () => {
      const service = createService();
      service.openConversation('c1');

      service.newChat();

      expect(service.activeConversationId).toBeNull();
    });

    it('stops the load-more indicator when an empty page is appended', () => {
      const service = createService();
      const loading = vi.fn();
      const hasMore = vi.fn();
      service.__internalService__.on(AutopilotChatInternalEvent.SetIsLoadingMoreHistory, loading);
      service.__internalService__.on(
        AutopilotChatInternalEvent.ShouldShowLoadingMoreHistory,
        hasMore
      );

      service.appendOlderHistoryItems([], true);

      expect(hasMore).toHaveBeenCalledWith(false);
      expect(loading).toHaveBeenCalledWith(false);
    });
  });

  describe('suggestions', () => {
    const suggestion = { label: 'Overdue', prompt: 'Which are overdue?' };
    const message = (id: string, role: AutopilotChatRole) =>
      ({ id, role, content: id, created_at: '', widget: 'apollo-markdown-renderer' }) as never;

    it('stores the suggestions with sendOnClick and the user turn, and emits them', () => {
      const service = createService();
      const published = vi.fn();
      service.__internalService__.on(AutopilotChatInternalEvent.SetSuggestions, published);
      service.setConversation([
        message('u1', AutopilotChatRole.User),
        message('a1', AutopilotChatRole.Assistant),
      ]);

      service.setSuggestions([suggestion], true);

      expect(service.getSuggestions()).toEqual([suggestion]);
      expect(service.__suggestions__).toEqual({
        suggestions: [suggestion],
        sendOnClick: true,
        userTurns: 1,
      });
      expect(published).toHaveBeenLastCalledWith(service.__suggestions__);
    });

    it('hands out and keeps copies, so neither side changes the other', () => {
      const service = createService();
      const mine = [suggestion];
      service.setSuggestions(mine);

      mine.push({ label: 'Later', prompt: 'later' });
      service.getSuggestions().push({ label: 'Mutated', prompt: 'mutated' });

      expect(service.getSuggestions()).toEqual([suggestion]);
      // What the chat reads is frozen.
      expect(Object.isFrozen(service.__suggestions__)).toBe(true);
      expect(Object.isFrozen(service.__suggestions__.suggestions)).toBe(true);
    });

    it('clears them when the host sets an empty list', () => {
      const service = createService();
      service.setSuggestions([suggestion], true);

      service.setSuggestions([]);

      expect(service.getSuggestions()).toEqual([]);
      expect(service.__suggestions__.sendOnClick).toBeUndefined();
    });

    it('clears them before the request, so ones set while it is handled belong to the new turn', async () => {
      const service = createService();
      service.setSuggestions([suggestion]);
      service.on(AutopilotChatEvent.Request, () => {
        expect(service.getSuggestions()).toEqual([]);
        service.setSuggestions([suggestion]);
      });

      service.sendRequest({ content: 'q1' });
      await vi.waitFor(() => expect(service.getSuggestions()).toEqual([suggestion]));

      expect(service.__suggestions__.userTurns).toBe(1);
    });

    it('clears them on a new chat and when another conversation opens', () => {
      const service = createService();
      service.setSuggestions([suggestion]);
      service.newChat();
      expect(service.getSuggestions()).toEqual([]);

      service.setSuggestions([suggestion]);
      service.openConversation('c2');
      expect(service.getSuggestions()).toEqual([]);

      // Opening the open one again is not another conversation.
      service.setSuggestions([suggestion]);
      service.openConversation('c2');
      expect(service.getSuggestions()).toEqual([suggestion]);
    });

    it('keeps them when the conversation is set again', () => {
      const service = createService();
      service.setSuggestions([suggestion]);

      service.setConversation([message('u1', AutopilotChatRole.User)]);

      expect(service.getSuggestions()).toEqual([suggestion]);
    });

    it('moves their user turn past older user turns that are prepended', () => {
      const service = createService();
      service.setConversation([
        message('u2', AutopilotChatRole.User),
        message('a2', AutopilotChatRole.Assistant),
      ]);
      service.setSuggestions([suggestion]);
      const published = vi.fn();
      service.__internalService__.on(AutopilotChatInternalEvent.SetSuggestions, published);

      service.prependOlderMessages([
        message('u0', AutopilotChatRole.User),
        message('a0', AutopilotChatRole.Assistant),
        message('u1', AutopilotChatRole.User),
      ]);
      expect(service.__suggestions__.userTurns).toBe(3);
      expect(published).toHaveBeenCalledTimes(1);

      // Nothing to move: no user turns among them, or no suggestions.
      service.prependOlderMessages([message('s0', AutopilotChatRole.Assistant)]);
      service.setSuggestions([]);
      service.prependOlderMessages([message('u-1', AutopilotChatRole.User)]);
      expect(published).toHaveBeenCalledTimes(2);
      expect(service.__suggestions__.suggestions).toEqual([]);
    });
  });
});
