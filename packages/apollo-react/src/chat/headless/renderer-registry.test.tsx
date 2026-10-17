import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { describe, expect, it } from 'vitest';

import type { AutopilotChatRenderer } from '../service';
import {
  registerChatRenderer,
  registerChatRendererIfAbsent,
  registerLazyChatRenderer,
  resolveChatRenderer,
} from './renderer-registry';

const Material = () => <div>material</div>;
const Wind = () => <div>wind</div>;

describe('renderer registry', () => {
  it('resolves config.renderer when set', () => {
    registerChatRenderer('material', Material);
    registerChatRenderer('wind', Wind);

    expect(resolveChatRenderer({ renderer: 'wind' }, 'material')).toBe(Wind);
  });

  it('falls back to the default renderer when config.renderer is unset', () => {
    registerChatRenderer('material', Material);

    expect(resolveChatRenderer({}, 'material')).toBe(Material);
    expect(resolveChatRenderer(undefined, 'material')).toBe(Material);
  });

  it('returns undefined for a name that was never registered', () => {
    expect(resolveChatRenderer({ renderer: 'missing' as AutopilotChatRenderer }, 'material')).toBe(
      undefined
    );
  });

  it('replaces a renderer registered under the same name', () => {
    const Replacement = () => <div>replacement</div>;
    registerChatRenderer('material', Material);
    registerChatRenderer('material', Replacement);

    expect(resolveChatRenderer({}, 'material')).toBe(Replacement);
  });

  it('returns the same lazy component on every resolve', () => {
    registerLazyChatRenderer('wind', () => Promise.resolve({ default: Wind }));

    expect(resolveChatRenderer({}, 'wind')).toBe(resolveChatRenderer({}, 'wind'));
  });

  it('loads a lazy renderer on first render', async () => {
    let loads = 0;
    registerLazyChatRenderer('wind', () => {
      loads++;
      return Promise.resolve({ default: Wind });
    });
    const Renderer = resolveChatRenderer({}, 'wind')!;

    expect(loads).toBe(0);
    render(
      <Suspense fallback={<div>loading</div>}>
        <Renderer />
      </Suspense>
    );

    expect(await screen.findByText('wind')).toBeInTheDocument();
    expect(loads).toBe(1);
  });

  it('forwards props to the renderer', () => {
    const WithProps = ({ label }: { label?: string }) => <div>{label}</div>;
    registerChatRenderer('material', WithProps);
    const Renderer = resolveChatRenderer({}, 'material')!;

    render(<Renderer label="forwarded" />);

    expect(screen.getByText('forwarded')).toBeInTheDocument();
  });

  it('registers a built-in renderer only when the name has none, never downgrading it', () => {
    const Eager = () => <div>eager</div>;
    const Other = () => <div>other</div>;
    registerChatRendererIfAbsent('tree-test' as AutopilotChatRenderer, { component: Eager });
    registerChatRendererIfAbsent('tree-test' as AutopilotChatRenderer, {
      load: () => Promise.resolve({ default: Other }),
    });
    registerChatRendererIfAbsent('tree-test' as AutopilotChatRenderer, { component: Other });

    expect(resolveChatRenderer({}, 'tree-test' as AutopilotChatRenderer)).toBe(Eager);
  });

  it('keeps a lazy built-in renderer rather than swapping its component type', () => {
    const Eager = () => <div>eager</div>;
    registerChatRendererIfAbsent('lazy-test' as AutopilotChatRenderer, {
      load: () => Promise.resolve({ default: Eager }),
    });
    const lazy = resolveChatRenderer({}, 'lazy-test' as AutopilotChatRenderer);

    registerChatRendererIfAbsent('lazy-test' as AutopilotChatRenderer, { component: Eager });

    expect(resolveChatRenderer({}, 'lazy-test' as AutopilotChatRenderer)).toBe(lazy);
  });
});
