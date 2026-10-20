import { beforeEach, describe, expect, it, vi } from 'vitest';

// Each test loads the two ApChat entries into a fresh module registry, in one order or the other.
beforeEach(() => {
  vi.resetModules();
});

async function registry() {
  return import('@uipath/apollo-react/chat/headless/renderer-registry');
}

describe('ApChat entry registration order', () => {
  it('keeps the ap-chat entry registrations when /chat loads later', async () => {
    await import('./ap-chat');
    const { resolveChatRenderer } = await registry();
    const { MaterialChatRenderer } = await import('./MaterialChatRenderer');
    const lazyWind = resolveChatRenderer(undefined, 'wind');
    expect(resolveChatRenderer(undefined, 'material')).toBe(MaterialChatRenderer);

    await import('@uipath/apollo-react/chat/root/ApChat');

    // A mounted chat keeps its component type: no remount, and Material stays loaded.
    expect(resolveChatRenderer(undefined, 'material')).toBe(MaterialChatRenderer);
    expect(resolveChatRenderer(undefined, 'wind')).toBe(lazyWind);
  }, 30_000);

  it('keeps the /chat entry registrations when ap-chat loads later', async () => {
    await import('@uipath/apollo-react/chat/root/ApChat');
    const { resolveChatRenderer } = await registry();
    const { WindChatRenderer } = await import('@uipath/apollo-react/chat/wind/WindChatRenderer');
    const lazyMaterial = resolveChatRenderer(undefined, 'material');
    expect(resolveChatRenderer(undefined, 'wind')).toBe(WindChatRenderer);

    await import('./ap-chat');

    expect(resolveChatRenderer(undefined, 'wind')).toBe(WindChatRenderer);
    expect(resolveChatRenderer(undefined, 'material')).toBe(lazyMaterial);
  }, 30_000);
});
