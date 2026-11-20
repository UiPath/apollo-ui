import { describe, expect, it, vi } from 'vitest';

import { AutopilotChatEvent, AutopilotChatInternalEvent, AutopilotChatMode } from './ChatModel';
import { AutopilotChatService } from './ChatService';

let instanceCounter = 0;
const createService = (config?: Parameters<AutopilotChatService['initialize']>[0]) =>
  AutopilotChatService.Instantiate({
    instanceName: `chat-service-composer-lock-${++instanceCounter}`,
    config,
  });

const lockEvents = (service: AutopilotChatService) => {
  const handler = vi.fn();
  service.on(AutopilotChatEvent.SetComposerLocked, handler);
  return handler;
};

describe('AutopilotChatService welcome content', () => {
  it('keeps welcomeContent through initialize, patchConfig and open', () => {
    const welcomeContent = vi.fn();
    const service = createService({ mode: AutopilotChatMode.Embedded, welcomeContent });
    expect(service.getConfig().welcomeContent).toBe(welcomeContent);

    service.patchConfig({ readOnly: false });
    expect(service.getConfig().welcomeContent).toBe(welcomeContent);

    const next = vi.fn();
    service.open({ welcomeContent: next });
    expect(service.getConfig().welcomeContent).toBe(next);
    expect(welcomeContent).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('tells renderers whether welcomeContent is set, on every configuration', () => {
    const service = createService();
    const presence = vi.fn();
    service.__internalService__.on(AutopilotChatInternalEvent.SetWelcomeContent, presence);

    service.initialize({ mode: AutopilotChatMode.Embedded, welcomeContent: () => {} });
    service.patchConfig({ welcomeContent: () => {} });
    service.patchConfig({ welcomeContent: undefined });

    expect(presence.mock.calls).toEqual([[true], [true], [false]]);
  });
});

describe('AutopilotChatService composer lock', () => {
  it('is unlocked by default and locked from the configuration', () => {
    expect(createService().getComposerLocked()).toBe(false);
    expect(
      createService({ mode: AutopilotChatMode.Embedded, composerLocked: true }).getComposerLocked()
    ).toBe(true);
  });

  it('locks through open', () => {
    const service = createService();
    const events = lockEvents(service);

    service.open({ composerLocked: true });

    expect(service.getComposerLocked()).toBe(true);
    expect(events.mock.calls).toEqual([[true]]);
  });

  it('publishes SetComposerLocked on every change, and only on a change', () => {
    const service = createService();
    const events = lockEvents(service);

    service.setComposerLocked(false);
    service.setComposerLocked(true);
    service.setComposerLocked(true);
    service.setComposerLocked(false);

    expect(events.mock.calls).toEqual([[true], [false]]);
    expect(service.getComposerLocked()).toBe(false);
  });

  it('keeps a lock set with the setter across patchConfig and newChat', () => {
    const service = createService({ mode: AutopilotChatMode.Embedded });
    const events = lockEvents(service);
    service.setComposerLocked(true);

    service.patchConfig({ readOnly: false });
    service.newChat();

    expect(service.getComposerLocked()).toBe(true);
    expect(service.getConfig().composerLocked).toBe(true);
    expect(events.mock.calls).toEqual([[true]]);
  });

  it('follows patchConfig', () => {
    const service = createService({ mode: AutopilotChatMode.Embedded, composerLocked: true });
    const events = lockEvents(service);

    service.patchConfig({ composerLocked: false });

    expect(service.getComposerLocked()).toBe(false);
    expect(events.mock.calls).toEqual([[false]]);
  });

  it('unlocks when the chat is initialized again without it', () => {
    const service = createService({ mode: AutopilotChatMode.Embedded });
    service.setComposerLocked(true);
    const events = lockEvents(service);

    service.initialize({ mode: AutopilotChatMode.Embedded });

    expect(service.getComposerLocked()).toBe(false);
    expect(events.mock.calls).toEqual([[false]]);
  });

  it('keeps a lock a listener sets while the configuration is applied', () => {
    const service = createService({ mode: AutopilotChatMode.Embedded });
    const unsubscribe = service.on(AutopilotChatEvent.ModeChange, () => {
      unsubscribe();
      service.setComposerLocked(true);
    });
    const events = lockEvents(service);

    service.patchConfig({ mode: AutopilotChatMode.FullScreen });

    expect(service.getComposerLocked()).toBe(true);
    expect(service.getConfig().composerLocked).toBe(true);
    expect(events.mock.calls).toEqual([[true]]);
  });

  it('does not hold back a request the host sends', () => {
    const service = createService({ mode: AutopilotChatMode.Embedded, composerLocked: true });
    const requests = vi.fn();
    service.on(AutopilotChatEvent.Request, requests);

    service.sendRequest({ content: 'From the host' });

    expect(requests).toHaveBeenCalledTimes(1);
  });
});
