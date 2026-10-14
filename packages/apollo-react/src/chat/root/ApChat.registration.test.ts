import { describe, expect, it } from 'vitest';

// Imports the ApChat module alone, without the package entry, as a bundler does when it skips a
// re-export-only barrel under `sideEffects`.
describe('ApChat module', () => {
  it('registers the Wind and Material renderers on import', async () => {
    const registry = await import('../headless/renderer-registry');
    expect(registry.resolveChatRenderer(undefined, 'wind')).toBeUndefined();

    await import('./ApChat');
    const { WindChatRenderer } = await import('../wind/WindChatRenderer');

    expect(registry.resolveChatRenderer(undefined, 'wind')).toBe(WindChatRenderer);
    expect(registry.resolveChatRenderer(undefined, 'material')).toBeDefined();
  });
});
