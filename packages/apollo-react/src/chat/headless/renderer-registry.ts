import React from 'react';

import type { AutopilotChatConfiguration, AutopilotChatRenderer } from '../service';

/**
 * Props every chat renderer receives from `ChatRoot`, plus whatever the host forwards through
 * `ChatRoot`'s `rendererProps`. Chat state comes from the headless providers, not props.
 */
export type ChatRendererProps = Record<string, unknown>;

/**
 * A chat renderer. Its props must all be optional, since the host may not forward any.
 */
export type ChatRendererComponent = React.ComponentType<ChatRendererProps>;

export type ChatRendererLoader = () => Promise<{ default: ChatRendererComponent }>;

const renderers = new Map<string, ChatRendererComponent>();

/**
 * Registers a renderer that is already loaded. Registering a name again replaces it.
 */
export function registerChatRenderer(
  name: AutopilotChatRenderer,
  component: ChatRendererComponent
) {
  renderers.set(name, component);
}

/**
 * Registers a renderer that is code-split and loaded on first use, e.g.
 * `registerLazyChatRenderer('material', () => import('./MaterialChatRenderer'))`.
 * Render it inside `Suspense` (`ChatRoot` does).
 */
export function registerLazyChatRenderer(name: AutopilotChatRenderer, load: ChatRendererLoader) {
  // Wrapped once here so every resolve returns the same component and React does not remount it.
  renderers.set(name, React.lazy(load));
}

/**
 * Resolves `config.renderer`, falling back to `defaultRenderer`.
 *
 * @returns The registered component, or `undefined` when that name was never registered
 */
export function resolveChatRenderer(
  config: Pick<AutopilotChatConfiguration, 'renderer'> | undefined,
  defaultRenderer: AutopilotChatRenderer
): ChatRendererComponent | undefined {
  return renderers.get(config?.renderer ?? defaultRenderer);
}
