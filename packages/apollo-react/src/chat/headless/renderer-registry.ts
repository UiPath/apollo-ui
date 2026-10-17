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
 * Registers one of the package's own renderers unless the name already has one. Both `ApChat`
 * entries call it, so whichever loads first keeps its registration: an entry loaded later (say in
 * a code-split route) never swaps the component type under a mounted chat, which would remount
 * it, and never replaces a loaded renderer with a lazy one.
 */
export function registerChatRendererIfAbsent(
  name: AutopilotChatRenderer,
  renderer: { component: ChatRendererComponent } | { load: ChatRendererLoader }
) {
  if (renderers.has(name)) {
    return;
  }
  if ('component' in renderer) {
    registerChatRenderer(name, renderer.component);
  } else {
    registerLazyChatRenderer(name, renderer.load);
  }
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
