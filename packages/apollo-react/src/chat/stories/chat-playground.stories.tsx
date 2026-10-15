import type { Meta, StoryObj } from '@storybook/react';

import { AutopilotChatMode } from '../service';
import {
  ChatPlayground,
  featureArgName,
  PLAYGROUND_FEATURE_FLAGS,
  type PlaygroundArgs,
} from './chat-playground';
import { CHAT_LOCALES, mapToChatTheme } from './chat-story-fixtures';
import { CHAT_STORY_SCENARIOS, type ChatStoryScenarioId } from './chat-story-scenarios';

const scenarioIds = Object.keys(CHAT_STORY_SCENARIOS) as ChatStoryScenarioId[];

// Service defaults, so the playground starts where a host that sets nothing starts.
const SERVICE_DISABLED_BY_DEFAULT = new Set<string>([
  'settings',
  'headerSeparator',
  'audio',
  'audioStreaming',
  'fullHeight',
  'htmlPreview',
  'renameChat',
]);

const featureArgs = Object.fromEntries(
  PLAYGROUND_FEATURE_FLAGS.map((flag) => [
    featureArgName(flag),
    SERVICE_DISABLED_BY_DEFAULT.has(flag),
  ])
) as Pick<PlaygroundArgs, ReturnType<typeof featureArgName>>;

const featureArgTypes = Object.fromEntries(
  PLAYGROUND_FEATURE_FLAGS.map((flag) => [
    featureArgName(flag),
    {
      control: 'boolean',
      description: `disabledFeatures.${flag}`,
      table: { category: 'Flags' },
    },
  ])
);

const ARG_BEHAVIOUR = `
Controls apply to the running chat through the service setters, without a new chat or a remount:

- **In place**: \`mode\` (setChatMode), \`readOnly\` (setReadOnly), Flags (setDisabledFeatures), \`title\`, \`inputPlaceholder\` and \`footerDisclaimer\` (setOverrideLabels), \`compactMode\` (patchConfig spacing), \`firstRunExperience\` (setFirstRunExperience, visible while the transcript is empty), \`customHeaderActions\` (setCustomHeaderActions), \`preHooks\` (setPreHook), \`autoScroll\` (toggleAutoScroll), \`locale\` (prop), \`autoReply\` and \`streamDelayMs\` (read on the next turn). The theme follows the Storybook theme toolbar and is passed to each chat as its \`theme\` prop. Switching between Embedded and FullScreen rebuilds the chat's DOM, because ChatRoot portals only in Embedded, but the service and transcript stay.
- **In place, with a chat added or removed**: \`renderer\`. Switching between wind and material calls setRenderer on the same service and keeps the transcript. Choosing both adds a Material chat on its own service that copies the current transcript; leaving both removes it.
- **Appends**: \`scenario\` scripts its traffic into the current transcript. Scenarios that need an empty transcript start a new chat first and say so: First-run experience, Long history with pagination. Changing scenario stops whatever the previous one still had scheduled (for example the rest of a stream).
- **Remounts**: nothing driven by a control. Storybook's Remount button and the locale toolbar (which remounts every story) are the full reset: the chat keeps its service instance and starts it over from the story's controls.

Closing a chat leaves an **Open chat** button where the host would put its launcher; it reopens in the selected \`mode\`.

**Clear chat** is a host-side button beside the panels (in the host bar in FullScreen). It stops the running scenario (what it still has scheduled, and its cleanup: listeners, loading message, error, config it changed) and calls \`newChat()\` on every chat in the story, without a remount. It is a button because args cannot trigger an action.

Icons on custom header actions and message actions come from the consumer: the Material renderer takes Material Icons names (\`picture_as_pdf\`), the Wind renderer takes lucide names, kebab-case (\`file-text\`) or the PascalCase export name (\`FileText\`). Names Wind cannot resolve show a neutral box. The playground gives each renderer its own action set for that reason.

With both renderers, every control applies to both chats, scenarios replay into both on the same timers, and a message sent from either composer is mirrored to the other. Service events from each chat appear in the Actions panel, prefixed with the renderer.
`;

/**
 * `ApChat` driven by an `AutopilotChatService`, with the configuration exposed as controls.
 * `renderer: both` shows Wind and Material on separate services under identical input.
 */
const meta = {
  title: 'Playground',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: { component: ARG_BEHAVIOUR },
      story: { inline: false, iframeHeight: 760 },
    },
  },
  argTypes: {
    renderer: {
      control: 'inline-radio',
      options: ['wind', 'material', 'both'],
      description: 'Renderer. Both shows Wind and Material on separate services.',
      table: { category: 'Renderer' },
    },
    mode: {
      control: 'inline-radio',
      options: [AutopilotChatMode.Embedded, AutopilotChatMode.FullScreen],
      description:
        'Chat mode. With both renderers, Embedded is side by side and FullScreen is stacked.',
      table: { category: 'Renderer' },
    },
    locale: {
      control: 'select',
      options: CHAT_LOCALES,
      table: { category: 'Renderer' },
    },
    compactMode: {
      control: 'boolean',
      description: 'spacing.compactMode',
      table: { category: 'Configuration' },
    },
    readOnly: { control: 'boolean', table: { category: 'Configuration' } },
    firstRunExperience: {
      control: 'boolean',
      description: 'Sets a first-run experience; it shows while the transcript is empty.',
      table: { category: 'Configuration' },
    },
    customHeaderActions: {
      control: 'boolean',
      description:
        'Nested custom header actions: lucide icon names for Wind, Material Icons names for Material.',
      table: { category: 'Configuration' },
    },
    autoScroll: {
      control: 'boolean',
      description:
        'chatService.toggleAutoScroll: follow new content while the reader is at the end.',
      table: { category: 'Configuration' },
    },
    preHooks: {
      control: 'boolean',
      description: 'Every pre-hook asks for confirmation before the action runs.',
      table: { category: 'Configuration' },
    },
    disableClose: {
      control: 'inline-radio',
      options: ['unset', 'disabled', 'enabled'],
      description:
        'disabledFeatures.close. Unset hides close in Embedded and shows it elsewhere; enabled (false) shows it in Embedded too.',
      table: { category: 'Flags' },
    },
    ...featureArgTypes,
    title: { control: 'text', table: { category: 'Labels' } },
    inputPlaceholder: { control: 'text', table: { category: 'Labels' } },
    footerDisclaimer: { control: 'text', table: { category: 'Labels' } },
    scenario: {
      control: {
        type: 'select',
        labels: Object.fromEntries(scenarioIds.map((id) => [id, CHAT_STORY_SCENARIOS[id].label])),
      },
      options: scenarioIds,
      description: scenarioIds
        .map(
          (id) => `**${CHAT_STORY_SCENARIOS[id].label}**: ${CHAT_STORY_SCENARIOS[id].description}`
        )
        .join('<br />'),
      table: { category: 'Traffic' },
    },
    autoReply: {
      control: 'inline-radio',
      options: ['off', 'echo', 'stream'],
      description: 'How the playground answers a message sent from the composer.',
      table: { category: 'Traffic' },
    },
    streamDelayMs: {
      control: { type: 'range', min: 20, max: 500, step: 10 },
      description: 'Delay between streamed chunks and scripted turns.',
      table: { category: 'Traffic' },
    },
    onChatEvent: { action: 'chat event', table: { disable: true } },
  },
  args: {
    renderer: 'wind',
    mode: AutopilotChatMode.Embedded,
    locale: 'en',
    compactMode: false,
    readOnly: false,
    firstRunExperience: true,
    customHeaderActions: true,
    preHooks: false,
    autoScroll: true,
    disableClose: 'unset',
    ...featureArgs,
    title: '',
    inputPlaceholder: '',
    footerDisclaimer: '',
    scenario: 'conversation',
    autoReply: 'stream',
    streamDelayMs: 80,
  },
  render: (args, context) => (
    <ChatPlayground
      {...args}
      theme={mapToChatTheme(context.globals.theme)}
      instanceKey={context.id}
    />
  ),
} satisfies Meta<PlaygroundArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Wind renderer in Embedded mode, in a host-owned container. */
export const Embedded: Story = {};

/** The Wind renderer in FullScreen mode. */
export const FullScreen: Story = {
  args: { mode: AutopilotChatMode.FullScreen },
};

/** Wind and Material side by side, each on its own service, under identical input. */
export const CompareRenderers: Story = {
  name: 'Compare renderers',
  args: { renderer: 'both' },
};

/** Code blocks with HTML preview turned on, compared across both renderers. */
export const HtmlPreview: Story = {
  name: 'HTML preview',
  args: { renderer: 'both', scenario: 'code', disableHtmlPreview: false },
};
