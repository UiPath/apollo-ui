import type { Meta, StoryObj } from '@storybook/react';
import { AutopilotChatMode } from '../components';
import { ChatShowcaseDemo, mapToChatLocale, mapToChatTheme } from './chat-story-support';
import { materialParameters } from './storybook-helpers';

/**
 * `ApChat` is the Autopilot chat surface driven by an `AutopilotChatService`
 * instance (event bus + imperative API). These stories are a full port of the
 * react-playground ApChat showcase: the left panel exposes every service
 * control (modes, models, agent modes, resource manager, streaming,
 * loading/error states, history, feature toggles, pre-hooks, custom header
 * actions, attachments, STT/voice simulation), and all chat events are logged
 * to the browser console.
 *
 * The chat theme follows the Storybook theme toolbar: classic themes map 1:1,
 * future themes fall back to their classic equivalent until the chat adds
 * future-theme support. The chat locale follows the Storybook locale toolbar.
 */
const meta: Meta = {
  title: 'Components/Chat',
  parameters: {
    ...materialParameters,
    layout: 'fullscreen',
    // Locale flows in as a reactive prop (mapToChatLocale below); remounting
    // would tear down the AutopilotChatService harness on every locale switch.
    localeRemount: false,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

/**
 * The full showcase harness starting in side-by-side mode — the chat docks to
 * the right of the host page. Use "Open Chat" if the panel starts closed, and
 * switch modes at runtime from "Chat Mode Controls".
 */
export const Showcase: Story = {
  render: (_args, context) => (
    <ChatShowcaseDemo
      theme={mapToChatTheme(context.globals.theme)}
      locale={mapToChatLocale(context.globals.locale)}
      instanceName="storybook-chat-showcase"
      initialMode={AutopilotChatMode.SideBySide}
    />
  ),
};

/**
 * Same harness starting in full-screen mode — the chat takes over the page and
 * the control panel hides (exactly like the playground page). Switch back via
 * the chat's own resize control or by closing the chat.
 */
export const FullScreen: Story = {
  render: (_args, context) => (
    <ChatShowcaseDemo
      theme={mapToChatTheme(context.globals.theme)}
      locale={mapToChatLocale(context.globals.locale)}
      instanceName="storybook-chat-fullscreen"
      initialMode={AutopilotChatMode.FullScreen}
    />
  ),
};

/**
 * Same harness starting in embedded mode — the chat renders into a floating
 * fixed-position container (bottom-right), demonstrating
 * `embeddedContainer`-based embedding into an arbitrary host element.
 */
export const Embedded: Story = {
  render: (_args, context) => (
    <ChatShowcaseDemo
      theme={mapToChatTheme(context.globals.theme)}
      locale={mapToChatLocale(context.globals.locale)}
      instanceName="storybook-chat-embedded"
      initialMode={AutopilotChatMode.Embedded}
    />
  ),
};
