/**
 * The service-driven chat playground behind the Apollo React/Chat stories. Each chat on the page
 * keeps one `AutopilotChatService` for its whole life; args are applied to it through the service
 * setters, so changing a control never starts a new chat.
 */
import React from 'react';

import type { SupportedLocale } from '../../i18n';
// The package entry, so the Wind and lazy Material renderers are registered as for consumers.
import { ApChat } from '../index';
import {
  type ApChatTheme,
  type AutopilotChatCustomHeaderAction,
  type AutopilotChatDisabledFeatures,
  AutopilotChatEvent,
  type AutopilotChatMessage,
  AutopilotChatMode,
  AutopilotChatPreHookAction,
  type AutopilotChatRenderer,
  AutopilotChatService,
} from '../service';
import {
  createStoryResourceManager,
  createStorySettingsRenderer,
  customHeaderActionReply,
  MATERIAL_CUSTOM_HEADER_ACTIONS,
  STORY_AGENT_MODES,
  STORY_FIRST_RUN_EXPERIENCE,
  STORY_LOADING_MESSAGES,
  STORY_MODELS,
  STREAMING_REPLY,
  storyHistoryItems,
  WIND_CUSTOM_HEADER_ACTIONS,
} from './chat-story-fixtures';
import {
  embeddedLauncherStyle,
  embeddedPanelLabelStyle,
  embeddedPanelStyle,
} from './chat-story-frame';
import {
  CHAT_STORY_SCENARIOS,
  type ChatStoryScenario,
  type ChatStoryScenarioId,
  patchConfigInPlace,
  type ScenarioContext,
  splitWords,
  streamChunks,
} from './chat-story-scenarios';

export type PlaygroundRenderer = AutopilotChatRenderer | 'both';
export type PlaygroundMode = AutopilotChatMode.Embedded | AutopilotChatMode.FullScreen;
export type PlaygroundAutoReply = 'off' | 'echo' | 'stream';
/** `unset` leaves `close` undefined: Embedded then hides close, other modes show it. */
export type PlaygroundCloseFlag = 'unset' | 'disabled' | 'enabled';

/** `disabledFeatures` flags exposed as boolean args (`close` has its own three-way arg). */
export const PLAYGROUND_FEATURE_FLAGS = [
  'header',
  'headerSeparator',
  'preview',
  'newChat',
  'history',
  'settings',
  'fullScreen',
  'feedback',
  'copy',
  'htmlPreview',
  'attachments',
  'stopResponse',
  'footer',
  'audio',
  'audioStreaming',
  'renameChat',
  'resize',
  'fullHeight',
] as const satisfies ReadonlyArray<keyof AutopilotChatDisabledFeatures>;

type FeatureFlag = (typeof PLAYGROUND_FEATURE_FLAGS)[number];
export type FeatureFlagArgs = { [F in FeatureFlag as `disable${Capitalize<F>}`]: boolean };

export const featureArgName = (flag: FeatureFlag) =>
  `disable${flag.charAt(0).toUpperCase()}${flag.slice(1)}` as keyof FeatureFlagArgs;

export interface PlaygroundArgs extends FeatureFlagArgs {
  renderer: PlaygroundRenderer;
  mode: PlaygroundMode;
  locale: SupportedLocale;
  compactMode: boolean;
  readOnly: boolean;
  disableClose: PlaygroundCloseFlag;
  title: string;
  inputPlaceholder: string;
  footerDisclaimer: string;
  firstRunExperience: boolean;
  customHeaderActions: boolean;
  preHooks: boolean;
  scenario: ChatStoryScenarioId;
  autoReply: PlaygroundAutoReply;
  streamDelayMs: number;
  onChatEvent?: (event: string, data?: unknown) => void;
}

export interface ChatPlaygroundProps extends PlaygroundArgs {
  /** Mapped from the Storybook theme toolbar. */
  theme: ApChatTheme;
  /** Names this story's service instances (the story id), so they are reused across remounts. */
  instanceKey: string;
}

const PRE_HOOK_ACTIONS = Object.values(AutopilotChatPreHookAction);

const NO_FIRST_RUN_EXPERIENCE = { title: '', description: '', suggestions: [] };

const firstRunExperienceFor = (enabled: boolean) =>
  enabled ? STORY_FIRST_RUN_EXPERIENCE : NO_FIRST_RUN_EXPERIENCE;

const overrideLabelsFrom = (args: PlaygroundArgs) => ({
  title: args.title || undefined,
  inputPlaceholder: args.inputPlaceholder || undefined,
  footerDisclaimer: args.footerDisclaimer || undefined,
});

/** `setTimeout` with one call that cancels everything still pending. */
function createTimers() {
  const pending = new Set<ReturnType<typeof setTimeout>>();

  return {
    schedule: (run: () => void, delay: number) => {
      const timer = setTimeout(() => {
        pending.delete(timer);
        run();
      }, delay);
      pending.add(timer);
    },
    clear: () => {
      for (const timer of pending) clearTimeout(timer);
      pending.clear();
    },
  };
}

function disabledFeaturesFrom(args: PlaygroundArgs): AutopilotChatDisabledFeatures {
  const features: AutopilotChatDisabledFeatures = {
    close: args.disableClose === 'unset' ? undefined : args.disableClose === 'disabled',
  };

  for (const flag of PLAYGROUND_FEATURE_FLAGS) {
    features[flag] = args[featureArgName(flag)];
  }

  return features;
}

const confirmPreHook = (action: AutopilotChatPreHookAction) => () =>
  Promise.resolve(window.confirm(`Pre-hook "${action}". Continue?`));
const allowPreHook = () => Promise.resolve(true);

const preHooksFrom = (enabled: boolean) =>
  enabled
    ? Object.fromEntries(PRE_HOOK_ACTIONS.map((action) => [action, confirmPreHook(action)]))
    : {};

const customActionsFor = (
  renderer: AutopilotChatRenderer,
  enabled: boolean
): AutopilotChatCustomHeaderAction[] =>
  enabled
    ? renderer === 'wind'
      ? WIND_CUSTOM_HEADER_ACTIONS
      : MATERIAL_CUSTOM_HEADER_ACTIONS
    : [];

interface SlotHandle {
  service: AutopilotChatService;
  // Tracked by message id because the service publishes Request asynchronously once it has
  // interceptors, so a flag around `sendRequest` would be reset before the handler runs.
  /** Scenario turns: no auto reply, no mirroring. */
  quietIds: Set<string>;
  /** Turns mirrored from the other chat: auto reply, no mirroring back. */
  mirroredIds: Set<string>;
}

type SlotRegistry = Map<string, SlotHandle>;

/** Runs effects only when `value` changes after the first commit; the first commit is the config. */
function useOnChange<T>(value: T, effect: (value: T) => void) {
  const previous = React.useRef(value);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `effect` is a fresh closure each render; only `value` re-runs it
  React.useEffect(() => {
    if (Object.is(previous.current, value)) {
      return;
    }
    previous.current = value;
    effect(value);
  }, [value]);
}

/**
 * The slot's service, named per story and slot so a remount reuses the instance instead of adding
 * one to the service's registry each time; it is reset to the story's configuration here.
 */
function createSlotService(
  instanceName: string,
  renderer: AutopilotChatRenderer,
  args: PlaygroundArgs,
  embeddedContainer: HTMLElement,
  seedFrom?: AutopilotChatService
) {
  const service = AutopilotChatService.Instantiate({
    instanceName,
    config: {
      mode: args.mode,
      renderer,
      embeddedContainer,
      readOnly: args.readOnly,
      disabledFeatures: disabledFeaturesFrom(args),
      overrideLabels: overrideLabelsFrom(args),
      firstRunExperience: firstRunExperienceFor(args.firstRunExperience),
      spacing: { compactMode: args.compactMode },
      preHooks: preHooksFrom(args.preHooks),
      models: STORY_MODELS,
      selectedModel: STORY_MODELS[0],
      agentModes: STORY_AGENT_MODES,
      selectedAgentMode: STORY_AGENT_MODES[0],
      settingsRenderer: createStorySettingsRenderer(),
      resourceManager: createStoryResourceManager(),
    },
  });

  service.newChat();
  service.clearError();
  service.setLoadingMessage('');
  service.setCustomHeaderActions(customActionsFor(renderer, args.customHeaderActions));
  service.setDefaultLoadingMessages(STORY_LOADING_MESSAGES);
  service.setHistory(storyHistoryItems());

  if (seedFrom) {
    service.setConversation(seedFrom.getConversation().map((message) => ({ ...message })));
  }

  return service;
}

interface ChatSlotProps {
  id: string;
  /** Prefix for the service instance name, unique per story. */
  instanceKey: string;
  label: string;
  renderer: AutopilotChatRenderer;
  args: PlaygroundArgs;
  theme: ApChatTheme;
  registry: SlotRegistry;
  /** Slots added after the story mounted copy this chat's transcript instead of running the scenario. */
  seedFrom?: AutopilotChatService;
  /** Docking position in Embedded: 0 is bottom right, 1 sits to its left. */
  slot: number;
  showLabel: boolean;
}

function ChatSlot({
  id,
  instanceKey,
  label,
  renderer,
  args,
  theme,
  registry,
  seedFrom,
  slot,
  showLabel,
}: ChatSlotProps) {
  // The embedded container is created once and adopted by the slot, so the service can be
  // configured with it before the first render and it never changes identity.
  const [embeddedHost] = React.useState(() => {
    const element = document.createElement('div');
    element.style.position = 'relative';
    element.style.width = '100%';
    element.style.height = '100%';
    return element;
  });
  const [service] = React.useState(() =>
    createSlotService(
      `storybook-chat-playground-${instanceKey}-${id}`,
      renderer,
      args,
      embeddedHost,
      seedFrom
    )
  );
  const [closed, setClosed] = React.useState(
    () => service.getConfig().mode === AutopilotChatMode.Closed
  );
  const argsRef = React.useRef(args);
  argsRef.current = args;
  const labelRef = React.useRef(label);
  labelRef.current = label;

  const adoptHost = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (node && embeddedHost.parentElement !== node) {
        node.appendChild(embeddedHost);
      }
    },
    [embeddedHost]
  );

  const log = React.useCallback((event: string, data?: unknown) => {
    argsRef.current.onChatEvent?.(`[${labelRef.current}] ${event}`, data);
  }, []);

  // Registration, event logging, mirroring, auto reply and header action replies.
  React.useEffect(() => {
    const handle: SlotHandle = { service, quietIds: new Set(), mirroredIds: new Set() };
    registry.set(id, handle);
    const timers = createTimers();

    const unsubscribes = Object.values(AutopilotChatEvent).map((event) =>
      service.on(event, (data) => log(event, data))
    );
    unsubscribes.push(
      service.on(AutopilotChatEvent.ModeChange, (mode: AutopilotChatMode) =>
        setClosed(mode === AutopilotChatMode.Closed)
      )
    );

    unsubscribes.push(
      service.on(AutopilotChatEvent.Request, (message: AutopilotChatMessage) => {
        if (handle.quietIds.delete(message.id)) {
          return;
        }

        if (!handle.mirroredIds.delete(message.id)) {
          for (const [otherId, other] of registry) {
            if (otherId === id) continue;
            const mirrorId = crypto.randomUUID();
            other.mirroredIds.add(mirrorId);
            other.service.sendRequest({
              id: mirrorId,
              content: message.content,
              attachments: message.attachments,
            });
          }
        }

        const { autoReply, streamDelayMs } = argsRef.current;
        if (autoReply === 'echo') {
          timers.schedule(
            () =>
              service.sendResponse({
                content: `You said: ${message.content}`,
                widget: 'apollo-markdown-renderer',
                created_at: new Date().toISOString(),
              }),
            streamDelayMs * 4
          );
        } else if (autoReply === 'stream') {
          streamChunks(
            {
              service,
              delayMs: streamDelayMs,
              schedule: timers.schedule,
              sendScriptedRequest: () => {},
              onCleanup: () => {},
              log,
            },
            splitWords(STREAMING_REPLY),
            streamDelayMs * 4
          );
        }
      }),
      service.on(
        AutopilotChatEvent.CustomHeaderActionClicked,
        (action: AutopilotChatCustomHeaderAction) =>
          service.sendResponse({
            content: customHeaderActionReply(action),
            groupId: `custom-action-${action.id}`,
            widget: 'apollo-markdown-renderer',
            created_at: new Date().toISOString(),
          })
      )
    );

    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe();
      timers.clear();
      registry.delete(id);
      service.close();
    };
  }, [id, registry, service, log]);

  // In-place arg updates, through the same setters a host application uses.
  useOnChange(args.mode, (mode) => service.setChatMode(mode));
  useOnChange(renderer, (next) => {
    service.setRenderer(next);
    service.setCustomHeaderActions(customActionsFor(next, argsRef.current.customHeaderActions));
  });
  useOnChange(args.readOnly, (readOnly) => service.setReadOnly(readOnly));
  useOnChange(JSON.stringify(disabledFeaturesFrom(args)), () =>
    service.setDisabledFeatures(disabledFeaturesFrom(argsRef.current))
  );
  useOnChange(`${args.title}\n${args.inputPlaceholder}\n${args.footerDisclaimer}`, () =>
    service.setOverrideLabels(overrideLabelsFrom(argsRef.current))
  );
  useOnChange(args.compactMode, (compactMode) =>
    patchConfigInPlace(service, { spacing: { compactMode } })
  );
  useOnChange(args.firstRunExperience, (enabled) =>
    service.setFirstRunExperience(firstRunExperienceFor(enabled))
  );
  useOnChange(args.customHeaderActions, (enabled) =>
    service.setCustomHeaderActions(customActionsFor(renderer, enabled))
  );
  useOnChange(args.preHooks, (enabled) => {
    for (const action of PRE_HOOK_ACTIONS) {
      service.setPreHook(action, enabled ? confirmPreHook(action) : allowPreHook);
    }
  });

  // Scenarios append; the one active at mount runs unless this chat was seeded from another.
  const skipInitialScenario = React.useRef(!!seedFrom);
  React.useEffect(() => {
    if (skipInitialScenario.current) {
      skipInitialScenario.current = false;
      return;
    }

    const handle = registry.get(id);
    const scenario: ChatStoryScenario = CHAT_STORY_SCENARIOS[args.scenario];
    const timers = createTimers();
    const cleanups: Array<() => void> = [];
    const context: ScenarioContext = {
      service,
      delayMs: argsRef.current.streamDelayMs,
      sendScriptedRequest: (request) => {
        const requestId = crypto.randomUUID();
        handle?.quietIds.add(requestId);
        service.sendRequest({ ...request, id: requestId });
      },
      schedule: timers.schedule,
      onCleanup: (cleanup) => cleanups.push(cleanup),
      log,
    };

    if (scenario.emptyTranscript) {
      service.newChat();
    }
    scenario.run(context);

    return () => {
      timers.clear();
      for (const cleanup of cleanups) cleanup();
    };
  }, [args.scenario, id, registry, service, log]);

  const fullScreen = args.mode === AutopilotChatMode.FullScreen;

  return (
    <section
      aria-label={`${label} chat`}
      className={
        fullScreen
          ? `${theme} flex h-screen w-full flex-col overflow-hidden bg-background`
          : `${theme} contents`
      }
    >
      {showLabel &&
        !closed &&
        (fullScreen ? (
          <div className="flex h-12 shrink-0 items-center border-b border-border-de-emp px-4 text-sm font-semibold text-foreground">
            {label}
          </div>
        ) : (
          <div
            style={embeddedPanelLabelStyle(slot)}
            className="text-sm font-semibold text-foreground"
          >
            {label}
          </div>
        ))}
      <div
        ref={adoptHost}
        style={fullScreen ? undefined : embeddedPanelStyle(slot)}
        className={fullScreen || closed ? 'hidden' : undefined}
      />
      {closed && (
        // Host-side reopen, as an application's launcher would; reopens in the selected mode.
        <button
          type="button"
          style={fullScreen ? undefined : embeddedLauncherStyle(slot)}
          className="m-auto rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg"
          onClick={() => service.setChatMode(argsRef.current.mode)}
        >
          Open chat
        </button>
      )}
      <div className={fullScreen ? 'min-h-0 flex-1' : 'contents'}>
        <ApChat
          chatServiceInstance={service}
          theme={theme}
          locale={args.locale}
          enableInternalThemeProvider={renderer === 'material'}
        />
      </div>
    </section>
  );
}

/**
 * One chat, or Wind and Material docked side by side (Embedded) or stacked (FullScreen), each on its own
 * service with every arg applied to both.
 */
export function ChatPlayground({ theme, instanceKey, ...args }: ChatPlaygroundProps) {
  const [registry] = React.useState<SlotRegistry>(() => new Map());
  const both = args.renderer === 'both';
  const primaryRenderer: AutopilotChatRenderer = args.renderer === 'both' ? 'wind' : args.renderer;
  const fullScreen = args.mode === AutopilotChatMode.FullScreen;

  return (
    <div
      className={
        fullScreen
          ? 'flex min-h-screen w-full flex-col bg-muted'
          : 'flex min-h-screen w-full items-center justify-center bg-muted text-sm text-muted-foreground'
      }
    >
      {!fullScreen && <span>Host application</span>}
      <ChatSlot
        id="primary"
        instanceKey={instanceKey}
        label={primaryRenderer === 'wind' ? 'Wind' : 'Material'}
        renderer={primaryRenderer}
        args={args}
        theme={theme}
        registry={registry}
        slot={0}
        showLabel={both}
      />
      {both && (
        <ChatSlot
          id="compare"
          instanceKey={instanceKey}
          label="Material"
          renderer="material"
          args={args}
          theme={theme}
          registry={registry}
          // Empty on the first render; set when Material is added to a running story.
          seedFrom={registry.get('primary')?.service}
          slot={1}
          showLabel
        />
      )}
    </div>
  );
}
