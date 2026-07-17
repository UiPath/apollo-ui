import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FontVariantToken } from '../../core';
import {
  ApChat,
  type ApChatTheme,
  ApTypography,
  AutopilotChatEvent,
  AutopilotChatMode,
  type AutopilotChatResourceItem,
  type AutopilotChatResourceManager,
  AutopilotChatRole,
  AutopilotChatService,
  ConversationalDisplayModeTypes,
  type SupportedLocale,
} from '../components';

/**
 * Full-fidelity port of the react-playground ApChat showcase harness
 * (apps/react-playground/src/pages/components/ApChatShowcase.tsx).
 *
 * The playground page's styled-components are replaced with MUI `Box`/plain
 * elements (this folder documents the legacy Material layer, so MUI primitives
 * are the intended building blocks — see storybook-helpers.tsx). All service
 * wiring, event handlers, mock data and interactive controls are kept intact.
 */

/**
 * Maps the Storybook global theme to the closest ApChat theme. ApChat only
 * supports the classic themes — future themes fall back to their classic
 * equivalent (mirrors the playground's `chatBaseTheme`/`chatTheme` logic),
 * and Wind-only demo themes (wireframe/vertex/canvas) fall back to dark.
 */
const CHAT_LOCALES: SupportedLocale[] = [
  'en',
  'de',
  'es',
  'es-MX',
  'fr',
  'ja',
  'ko',
  'pt',
  'pt-BR',
  'ro',
  'ru',
  'tr',
  'zh-CN',
  'zh-TW',
];

/** Maps Storybook's global locale to a chat-supported locale (fallback: en). */
export function mapToChatLocale(globalLocale: unknown): SupportedLocale {
  return CHAT_LOCALES.includes(globalLocale as SupportedLocale)
    ? (globalLocale as SupportedLocale)
    : 'en';
}

export function mapToChatTheme(globalTheme: unknown): ApChatTheme {
  switch (globalTheme) {
    case 'light':
      return 'light';
    case 'light-hc':
      return 'light-hc';
    case 'dark':
      return 'dark';
    case 'dark-hc':
      return 'dark-hc';
    case 'future-light':
      return 'light';
    case 'future-dark':
      return 'dark';
    default:
      return 'dark';
  }
}

/* ------------------------------------------------------------------ */
/* Layout primitives (ports of ApChatShowcase.styles.tsx)             */
/* ------------------------------------------------------------------ */

function Section({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ mb: 3, '&:last-child': { mb: 0, '& > .MuiDivider-root': { display: 'none' } } }}>
      {children}
      <Divider sx={{ mt: 3 }} />
    </Box>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <ApTypography variant={FontVariantToken.fontSizeMBold} component="h3" sx={{ mb: 2 }}>
      {children}
    </ApTypography>
  );
}

function ButtonGroup({ children }: { children: ReactNode }) {
  return <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>{children}</Box>;
}

type DemoButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean };

/* All harness controls below render MUI components so the control panel
   itself exercises the Apollo theme overrides under every theme. */

function DemoButton({ primary = false, children, onClick, disabled, title }: DemoButtonProps) {
  return (
    <Button
      variant={primary ? 'contained' : 'outlined'}
      size="small"
      onClick={onClick}
      disabled={disabled}
      title={title}
      sx={{ whiteSpace: 'nowrap' }}
    >
      {children}
    </Button>
  );
}

type FieldChangeHandler = React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;

function DemoInput({
  style,
  type,
  min,
  max,
  value,
  onChange,
  placeholder,
  disabled,
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <TextField
      size="small"
      fullWidth
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={onChange as FieldChangeHandler}
      inputProps={{ min, max }}
      sx={{ mb: 1.5 }}
      style={style}
    />
  );
}

function DemoTextArea({
  style,
  value,
  onChange,
  placeholder,
  disabled,
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <TextField
      size="small"
      fullWidth
      multiline
      minRows={3}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={onChange as unknown as FieldChangeHandler}
      sx={{ mb: 1.5 }}
      style={style}
    />
  );
}

function DemoSelect({
  style,
  children,
  value,
  onChange,
  disabled,
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <TextField
      select
      size="small"
      fullWidth
      value={value}
      disabled={disabled}
      onChange={onChange as unknown as FieldChangeHandler}
      SelectProps={{ native: true }}
      sx={{ mb: 1.5 }}
      style={style}
    >
      {children}
    </TextField>
  );
}

function InfoText({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <Typography component="p" variant="body2" sx={{ color: 'text.secondary', mt: 1 }} style={style}>
      {children}
    </Typography>
  );
}

/* ------------------------------------------------------------------ */
/* Showcase harness                                                    */
/* ------------------------------------------------------------------ */

export interface ChatShowcaseDemoProps {
  /** ApChat theme (already mapped from the Storybook global theme). */
  theme: ApChatTheme;
  /**
   * Service instance name. Each story uses a distinct name so the
   * per-name `AutopilotChatService` singletons don't clash when the docs
   * page renders multiple stories at once.
   */
  instanceName: string;
  /** Chat mode the harness starts in. */
  initialMode?: AutopilotChatMode;
  /** Locale, driven by Storybook's global locale selector. */
  locale?: SupportedLocale;
}

export function ChatShowcaseDemo({
  theme,
  instanceName,
  initialMode = AutopilotChatMode.SideBySide,
  locale = 'en',
}: ChatShowcaseDemoProps) {
  const embeddedContainerRef = useRef<HTMLDivElement>(null);

  const [chatService, setChatService] = useState<AutopilotChatService | null>(null);
  const [chatMode, setChatMode] = useState<AutopilotChatMode>(initialMode);
  const [customMessage, setCustomMessage] = useState('Hello, how can I help you today?');
  const [errorMessage, setErrorMessage] = useState('An error occurred. Please try again.');
  const [streamingText, setStreamingText] = useState(
    'This is a streaming response that will appear word by word...'
  );
  const [loadingMessage, setLoadingMessage] = useState('Thinking...');
  const [waitForMore, setWaitForMore] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isShowLoading, setIsShowLoading] = useState(false);

  // Feature toggles (true = feature enabled, false = feature disabled)
  const [features, setFeatures] = useState({
    history: true,
    settings: true,
    attachments: true,
    audio: false, // STT dictate (mic) button - disabled by default
    audioStreaming: false, // Always-on voice interaction button - disabled by default
    htmlPreview: true,
    headerSeparator: false, // Disabled by default (like HTML)
    fullHeight: true, // Enabled by default
    resize: true,
    close: true,
    feedback: true,
    model: true,
    agentMode: true,
    sendOnClick: false,
    paginatedMessages: false,
    compactMode: false,
    customScrollTheme: false,
    copy: true, // Copy enabled by default
    attachmentsAsync: false,
    readOnly: false,
  });
  const [selectedAgentMode, setSelectedAgentMode] = useState<string>('agent');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4');
  const [primaryFontToken, setPrimaryFontToken] = useState<FontVariantToken>(
    FontVariantToken.fontSizeM
  );
  const [promptBoxMinRows, setPromptBoxMinRows] = useState<number>(2);
  const [promptBoxMaxRows, setPromptBoxMaxRows] = useState<number>(12);

  const [resourcePaginationEnabled, setResourcePaginationEnabled] = useState(true);
  const [resourcePageSize, setResourcePageSize] = useState(10);

  // Resource manager creation function
  const createResourceManager = useCallback((): AutopilotChatResourceManager => {
    const topLevelItems = [
      {
        id: 'variables',
        type: 'category',
        displayName: 'Variables',
        icon: 'data_object',
        hasNestedResources: true,
      },
      {
        id: 'files',
        type: 'category',
        displayName: 'This is an intentionally very very long category name',
        icon: 'folder',
        hasNestedResources: true,
      },
      {
        id: 'current-user',
        type: 'context',
        displayName: 'This is an intentionally very very long resource name',
        icon: 'person',
        tooltip: 'The currently logged in user context',
        hasNestedResources: false,
      },
      {
        id: 'current-date',
        type: 'context',
        displayName: 'Current Date',
        icon: 'calendar_today',
        tooltip: "Today's date in ISO format",
        hasNestedResources: false,
      },
    ];

    const variableIcons = [
      'text_fields',
      'mail',
      'numbers',
      'toggle_on',
      'settings',
      'person',
      'calendar_today',
      'list',
      'data_object',
      'code',
    ] as const;
    const variableItems = Array.from({ length: 50 }, (_, i) => ({
      id: `var-${i}`,
      type: 'variable',
      displayName: `variable_${i.toString().padStart(2, '0')}`,
      icon: variableIcons[i % variableIcons.length] as string,
      tooltip: `Variable ${i} - This is a sample variable for testing pagination`,
    }));

    const fileIcons = [
      'description',
      'table_chart',
      'picture_as_pdf',
      'image',
      'code',
      'folder',
    ] as const;
    const fileExtensions = [
      '.json',
      '.csv',
      '.pdf',
      '.png',
      '.ts',
      '.txt',
      '.xml',
      '.yaml',
    ] as const;
    const fileItems = Array.from({ length: 30 }, (_, i) => ({
      id: `file-${i}`,
      type: 'file',
      displayName: `document_${i.toString().padStart(2, '0')}${fileExtensions[i % fileExtensions.length]}`,
      icon: fileIcons[i % fileIcons.length] as string,
      tooltip: `File ${i} - Sample file for testing pagination`,
    }));

    const paginate = <T,>(
      items: T[],
      skip: number,
      pageSize: number,
      paginationEnabled: boolean
    ): { paginatedItems: T[]; done: boolean } => {
      if (!paginationEnabled) {
        return { paginatedItems: items, done: true };
      }
      const paginatedItems = items.slice(skip, skip + pageSize);
      const done = skip + pageSize >= items.length;
      return { paginatedItems, done };
    };

    return {
      getTopLevelResources: () => topLevelItems,
      getNestedResources: async (resourceId, options) => {
        await new Promise((resolve) => setTimeout(resolve, 300));

        let items: typeof variableItems = [];
        if (resourceId === 'variables') {
          items = variableItems;
        } else if (resourceId === 'files') {
          items = fileItems;
        }

        if (options?.searchText) {
          const searchLower = options.searchText.toLowerCase();
          items = items.filter((item) => item.displayName.toLowerCase().includes(searchLower));
        }

        const skip = options?.skip ?? 0;
        const { paginatedItems, done } = paginate(
          items,
          skip,
          resourcePageSize,
          resourcePaginationEnabled
        );

        console.log(
          `[ResourceManager] getNestedResources: resourceId=${resourceId}, skip=${skip}, returned=${paginatedItems.length}, done=${done}`
        );

        return { items: paginatedItems, done };
      },
      globalSearch: async (options) => {
        await new Promise((resolve) => setTimeout(resolve, 300));

        let allItems: AutopilotChatResourceItem[] = [...variableItems, ...fileItems];

        const skip = options.skip ?? 0;
        if (options.searchText) {
          const searchLower = options.searchText.toLowerCase();
          if (skip === 0) {
            const matchingTopLevel = topLevelItems.filter((item) =>
              item.displayName.toLowerCase().includes(searchLower)
            );
            allItems = [...matchingTopLevel, ...allItems];
          }
          allItems = allItems.filter((item) =>
            item.displayName.toLowerCase().includes(searchLower)
          );
        }
        const { paginatedItems, done } = paginate(
          allItems,
          skip,
          resourcePageSize,
          resourcePaginationEnabled
        );

        console.log(
          `[ResourceManager] globalSearch: searchText="${options.searchText ?? ''}", skip=${skip}, returned=${paginatedItems.length}, done=${done}`
        );

        return { items: paginatedItems, done };
      },
      onResourceSelected: (item) => {
        console.log('Resource selected:', item.displayName);
      },
    };
  }, [resourcePaginationEnabled, resourcePageSize]);

  // Custom settings renderer function
  const createSettingsRenderer = useCallback(
    () => (container: HTMLElement) => {
      // Create custom settings panel
      const settingsDiv = document.createElement('div');
      settingsDiv.style.padding = '24px';
      settingsDiv.style.color = 'var(--color-foreground)';

      settingsDiv.innerHTML = `
				<h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Chat Settings</h2>

				<div style="margin-bottom: 24px;">
					<h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 500;">Appearance</h3>
					<label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;">
						<input type="checkbox" id="darkMode" style="cursor: pointer;" />
						<span>Dark Mode</span>
					</label>
					<label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
						<input type="checkbox" id="compactMode" checked style="cursor: pointer;" />
						<span>Compact Mode</span>
					</label>
				</div>

				<div style="margin-bottom: 24px;">
					<h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 500;">Behavior</h3>
					<label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;">
						<input type="checkbox" id="autoScroll" checked style="cursor: pointer;" />
						<span>Auto-scroll to new messages</span>
					</label>
					<label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
						<input type="checkbox" id="soundEnabled" style="cursor: pointer;" />
						<span>Enable sound notifications</span>
					</label>
				</div>

				<div style="margin-bottom: 24px;">
					<h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 500;">Advanced</h3>
					<label style="display: block; margin-bottom: 8px;">
						<span style="display: block; margin-bottom: 4px;">Max Messages</span>
						<input type="number" id="maxMessages" value="100" min="10" max="500"
							style="padding: 8px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-background); color: var(--color-foreground); width: 100px;" />
					</label>
					<label style="display: block;">
						<span style="display: block; margin-bottom: 4px;">Response Delay (ms)</span>
						<input type="number" id="responseDelay" value="0" min="0" max="5000" step="100"
							style="padding: 8px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-background); color: var(--color-foreground); width: 100px;" />
					</label>
				</div>

				<div style="display: flex; gap: 12px;">
					<button id="saveSettings" style="padding: 8px 16px; background: var(--color-primary); color: var(--color-foreground-on-accent); border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
						Save Settings
					</button>
					<button id="resetSettings" style="padding: 8px 16px; background: transparent; color: var(--color-foreground); border: 1px solid var(--color-border); border-radius: 4px; cursor: pointer;">
						Reset to Defaults
					</button>
				</div>
			`;

      // Add event listeners
      const darkModeCheckbox = settingsDiv.querySelector('#darkMode') as HTMLInputElement;
      darkModeCheckbox?.addEventListener('change', (e) => {
        console.log('Dark mode:', (e.target as HTMLInputElement).checked);
      });

      const saveButton = settingsDiv.querySelector('#saveSettings');
      saveButton?.addEventListener('click', () => {
        console.log('Settings saved:', {
          darkMode: (settingsDiv.querySelector('#darkMode') as HTMLInputElement).checked,
          compactMode: (settingsDiv.querySelector('#compactMode') as HTMLInputElement).checked,
          autoScroll: (settingsDiv.querySelector('#autoScroll') as HTMLInputElement).checked,
          soundEnabled: (settingsDiv.querySelector('#soundEnabled') as HTMLInputElement).checked,
          maxMessages: (settingsDiv.querySelector('#maxMessages') as HTMLInputElement).value,
          responseDelay: (settingsDiv.querySelector('#responseDelay') as HTMLInputElement).value,
        });
        console.log('Settings saved successfully!');
      });

      const resetButton = settingsDiv.querySelector('#resetSettings');
      resetButton?.addEventListener('click', () => {
        (settingsDiv.querySelector('#darkMode') as HTMLInputElement).checked = false;
        (settingsDiv.querySelector('#compactMode') as HTMLInputElement).checked = true;
        (settingsDiv.querySelector('#autoScroll') as HTMLInputElement).checked = true;
        (settingsDiv.querySelector('#soundEnabled') as HTMLInputElement).checked = false;
        (settingsDiv.querySelector('#maxMessages') as HTMLInputElement).value = '100';
        (settingsDiv.querySelector('#responseDelay') as HTMLInputElement).value = '0';
        console.log('Settings reset to defaults');
      });

      container.appendChild(settingsDiv);
    },
    []
  );

  useEffect(() => {
    // Initialize chat service
    const service = AutopilotChatService.Instantiate({
      instanceName,
      config: {
        mode: initialMode,
        readOnly: features.readOnly,
        disabledFeatures: {
          history: !features.history,
          settings: !features.settings,
          attachments: !features.attachments,
          audio: !features.audio,
          audioStreaming: !features.audioStreaming,
          htmlPreview: !features.htmlPreview,
          headerSeparator: !features.headerSeparator,
          fullHeight: !features.fullHeight,
          resize: !features.resize,
          close: !features.close,
          feedback: !features.feedback,
          copy: !features.copy,
        },
        settingsRenderer: createSettingsRenderer(),
      },
    });
    setChatService(service);

    // Store unsubscribe functions for cleanup
    const unsubscribes: Array<() => void> = [];

    // Set up models
    service.setModels([
      { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
      {
        id: 'gpt-3.5',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and efficient',
      },
      { id: 'claude-3', name: 'Claude 3', description: 'Anthropic model' },
    ]);
    service.setSelectedModel('gpt-4');

    // Set up agent modes
    service.setAgentModes([
      {
        id: 'agent',
        name: 'Agent',
        description: 'AI-powered autonomous agent mode',
        icon: 'smart_toy',
      },
      {
        id: 'plan',
        name: 'Plan',
        description: 'Create and review execution plans',
        icon: 'edit_note',
      },
      {
        id: 'attended',
        name: 'Attended',
        description: 'Human assisted execution',
        icon: 'play_arrow',
      },
    ]);
    service.setAgentMode('agent');

    // Set up custom header actions
    service.setCustomHeaderActions([
      {
        id: 'export',
        name: 'Export Chat',
        icon: 'download',
      },
      {
        id: 'share',
        name: 'Share',
        icon: 'share',
      },
    ]);

    // Set up suggestions
    service.setSuggestions([
      { label: 'What can you do?', prompt: 'What can you do?' },
      { label: 'Show me an example', prompt: 'Show me an example' },
      { label: 'Help me with code', prompt: 'Help me with code' },
    ]);

    // Set default loading messages
    service.setDefaultLoadingMessages([
      'Thinking...',
      'Processing your request...',
      'Analyzing...',
      'Working on it...',
    ]);

    // Set up resource manager by default
    service.setResourceManager(createResourceManager());

    // Listen to events
    unsubscribes.push(
      service.on(AutopilotChatEvent.Request, (data: unknown) => {
        console.log('Request sent:', data);
      })
    );

    unsubscribes.push(
      service.on(AutopilotChatEvent.ModeChange, (mode: unknown) => {
        console.log('Mode changed:', mode);
      })
    );

    unsubscribes.push(
      service.on(AutopilotChatEvent.SetSelectedModel, (model: unknown) => {
        console.log('Model changed:', model);
        // biome-ignore lint/suspicious/noExplicitAny: Model type from event
        setSelectedModel((model as any).id || model);
      })
    );

    unsubscribes.push(
      service.on(AutopilotChatEvent.SetSelectedAgentMode, (mode: unknown) => {
        console.log('Agent mode changed:', mode);
        // biome-ignore lint/suspicious/noExplicitAny: Agent mode type from event
        setSelectedAgentMode((mode as any).id);
      })
    );

    unsubscribes.push(
      service.on(AutopilotChatEvent.ModeChange, (mode: unknown) => {
        console.log('Chat mode changed:', mode);
        setChatMode(mode as AutopilotChatMode);
      })
    );

    // Additional event listeners
    unsubscribes.push(
      // biome-ignore lint/suspicious/noExplicitAny: Event not in enum
      service.on('feedback' as any, (data: unknown) => {
        // biome-ignore lint/suspicious/noExplicitAny: Feedback data structure
        const { isPositive, message } = data as any;
        console.log(`Feedback: ${isPositive ? 'Positive' : 'Negative'}`, message);
      })
    );

    unsubscribes.push(
      // biome-ignore lint/suspicious/noExplicitAny: Event not in enum
      service.on('copy' as any, (message: unknown) => {
        console.log('Copy event:', message);
        // Allow default copy behavior
      })
    );

    unsubscribes.push(
      // biome-ignore lint/suspicious/noExplicitAny: Event not in enum
      service.on('attachments' as any, (attachments: unknown) => {
        console.log('Attachments:', attachments);
      })
    );

    unsubscribes.push(
      // biome-ignore lint/suspicious/noExplicitAny: Event not in enum
      service.on('stopResponse' as any, () => {
        console.log('Stop response event');
      })
    );

    // Fake STT consumer — the chat only owns UI state; a real consumer would start
    // a recognizer (e.g. Azure Speech SDK) and feed transcripts back via setPrompt().
    // For the showcase we simulate it: while active, stream a canned phrase word-by-word.
    const fakeSttPhrases = [
      'How do I schedule an unattended robot to run every weekday at 9 AM',
      'Show me the last ten failed jobs and group them by process name',
      'Can you walk me through setting up Document Understanding for invoices',
    ];
    let sttPhraseIndex = 0;
    let sttDictationInterval: ReturnType<typeof setInterval> | null = null;
    unsubscribes.push(
      service.on(AutopilotChatEvent.SpeechToTextToggle, (isActive: unknown) => {
        console.log('[STT] toggle:', isActive);
        // The button already reflects the active state — `publishSpeechToTextToggle`
        // fired `SetSpeechToTextState` before this handler ran. A real consumer that
        // owns a recognizer should call `service.setSpeechToTextState(false)` here if
        // its recognizer fails to start, to revert the UI. This fake recognizer can't
        // fail, so we just drive the transcript simulation.
        if (isActive) {
          const phrase = fakeSttPhrases[sttPhraseIndex % fakeSttPhrases.length] ?? '';
          sttPhraseIndex++;
          const words = phrase.split(' ');
          let wordIndex = 0;
          let transcript = '';
          sttDictationInterval = setInterval(() => {
            if (wordIndex < words.length) {
              transcript += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
              service.setPrompt(transcript);
              wordIndex++;
            } else if (sttDictationInterval) {
              clearInterval(sttDictationInterval);
              sttDictationInterval = null;
            }
          }, 150);
        } else if (sttDictationInterval) {
          clearInterval(sttDictationInterval);
          sttDictationInterval = null;
        }
      })
    );
    unsubscribes.push(() => {
      if (sttDictationInterval) {
        clearInterval(sttDictationInterval);
        sttDictationInterval = null;
      }
    });

    // Fake voice-interaction consumer — logs InputStream payloads and streams a canned
    // assistant reply on activityStart. A real consumer would forward mediaChunks to a
    // model and feed audio responses back via chatService.sendOutputStreamEvent(...).
    const fakeVoiceUserTurns = [
      'How do I debug a workflow in UiPath Studio?',
      'Can you suggest a retry strategy for flaky selectors?',
      'What is the difference between Attended and Unattended automations?',
    ];
    const fakeVoiceAssistantReplies = [
      'Start by enabling **Debug mode** in UiPath Studio and setting breakpoints on the activities you want to inspect. Use **Step Into** to walk through each action, and open the **Locals** panel to watch variables change.',
      'Wrap the click/type activity in a **Retry Scope** with 3-5 attempts and a short delay (500ms-2s). Pair it with a **Check App State** condition so the retry fires only when the expected element is missing.',
      "**Attended** automations run on a user's machine alongside them. **Unattended** automations run on dedicated VMs without any user present; they're scheduled or queue-driven and scale across a robot fleet.",
    ];
    let voiceTurnIndex = 0;
    let voicePendingTimeouts: Array<ReturnType<typeof setTimeout>> = [];
    let voicePendingInterval: ReturnType<typeof setInterval> | null = null;
    let voiceActiveStreamId: string | null = null;
    const clearVoicePending = () => {
      for (const id of voicePendingTimeouts) {
        clearTimeout(id);
      }
      voicePendingTimeouts = [];
      if (voicePendingInterval) {
        clearInterval(voicePendingInterval);
        voicePendingInterval = null;
      }
    };
    unsubscribes.push(
      service.on(AutopilotChatEvent.InputStream, (event: unknown) => {
        // biome-ignore lint/suspicious/noExplicitAny: InputStream event shape
        const ev = event as any;
        if (ev.activityStart) {
          console.log('[voice] activityStart', ev.activityStart);
          const userContent = fakeVoiceUserTurns[voiceTurnIndex % fakeVoiceUserTurns.length] ?? '';
          const assistantContent =
            fakeVoiceAssistantReplies[voiceTurnIndex % fakeVoiceAssistantReplies.length] ?? '';
          voiceTurnIndex++;
          voiceActiveStreamId = `voice-stream-${voiceTurnIndex}`;

          voicePendingTimeouts.push(
            setTimeout(() => {
              service.sendRequest({ content: userContent });
              voicePendingTimeouts.push(
                setTimeout(() => {
                  const words = assistantContent.split(' ');
                  const streamId = voiceActiveStreamId ?? undefined;
                  let wordIndex = 0;
                  voicePendingInterval = setInterval(() => {
                    if (wordIndex < words.length) {
                      service.sendResponse({
                        id: streamId,
                        content:
                          (words[wordIndex] ?? '') + (wordIndex < words.length - 1 ? ' ' : ''),
                        stream: true,
                        created_at: new Date().toISOString(),
                        widget: 'apollo-markdown-renderer',
                      });
                      wordIndex++;
                    } else {
                      if (voicePendingInterval) {
                        clearInterval(voicePendingInterval);
                        voicePendingInterval = null;
                      }
                      service.sendResponse({
                        id: streamId,
                        content: '',
                        stream: true,
                        done: true,
                        created_at: new Date().toISOString(),
                        widget: 'apollo-markdown-renderer',
                      });
                    }
                  }, 80);
                }, 400)
              );
            }, 600)
          );
        }
        if (ev.mediaChunks) {
          console.log('[voice] mediaChunks', ev.mediaChunks.length);
        }
        if (ev.activityEnd) {
          console.log('[voice] activityEnd', ev.activityEnd);
          const wasStreaming = voicePendingInterval !== null;
          clearVoicePending();
          if (wasStreaming && voiceActiveStreamId) {
            service.sendResponse({
              id: voiceActiveStreamId,
              content: '',
              stream: true,
              done: true,
              created_at: new Date().toISOString(),
              widget: 'apollo-markdown-renderer',
            });
          }
          voiceActiveStreamId = null;
        }
      })
    );
    unsubscribes.push(() => clearVoicePending());

    // Listen for custom header action clicks
    unsubscribes.push(
      // biome-ignore lint/suspicious/noExplicitAny: Event not in enum
      service.on('customHeaderActionClicked' as any, (action: unknown) => {
        // biome-ignore lint/suspicious/noExplicitAny: Action data structure
        const actionData = action as any;
        console.log('Custom header action clicked:', actionData);

        let responseContent = '';
        switch (actionData.id) {
          case 'export-pdf':
            responseContent =
              '📄 **Exporting as PDF...**\n\nYour conversation has been exported to a PDF file.';
            break;
          case 'export-docx':
            responseContent =
              '📝 **Exporting as DOCX...**\n\nYour conversation has been exported to a Word document.';
            break;
          case 'export-json':
            responseContent =
              '💾 **Exporting as JSON...**\n\nYour conversation has been exported as JSON data.';
            break;
          case 'export-txt':
            responseContent =
              '📋 **Exporting as Text...**\n\nYour conversation has been exported as plain text.';
            break;
          case 'share':
            responseContent =
              '🔗 **Share Conversation**\n\nA shareable link has been generated:\n`https://example.com/chat/abc123`';
            break;
          case 'translate-es':
            responseContent =
              '🇪🇸 **Traduciendo al español...**\n\nSu conversación ha sido traducida al español.';
            break;
          case 'translate-fr':
            responseContent =
              '🇫🇷 **Traduction en français...**\n\nVotre conversation a été traduite en français.';
            break;
          case 'translate-de':
            responseContent =
              '🇩🇪 **Übersetzung ins Deutsche...**\n\nIhre Unterhaltung wurde ins Deutsche übersetzt.';
            break;
          case 'translate-ja':
            responseContent = '🇯🇵 **日本語に翻訳中...**\n\n会話が日本語に翻訳されました。';
            break;
          case 'translate-zh':
            responseContent = '🇨🇳 **正在翻译成中文...**\n\n您的对话已翻译成中文。';
            break;
          case 'print':
            responseContent = '🖨️ **Print Conversation**\n\nPreparing conversation for printing...';
            break;
          default:
            responseContent = `✅ Action triggered: **${actionData.name}** (ID: ${actionData.id})`;
        }

        service.sendResponse({
          content: responseContent,
          groupId: `custom-action-${actionData.id}`,
          created_at: '22-10-2025',
          widget: 'apollo-markdown-renderer',
        });
      })
    );

    return () => {
      // Cleanup - unsubscribe from all events
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
      service.close();
    };
  }, [
    instanceName,
    initialMode,
    createResourceManager,
    createSettingsRenderer,
    features.attachments,
    features.audio,
    features.audioStreaming,
    features.close,
    features.copy,
    features.feedback,
    features.fullHeight,
    features.headerSeparator,
    features.history,
    features.htmlPreview,
    features.resize,
    features.settings,
    features.readOnly,
  ]);

  // Update embedded container when in embedded mode
  useEffect(() => {
    if (chatService && chatMode === AutopilotChatMode.Embedded && embeddedContainerRef.current) {
      chatService.patchConfig({
        mode: AutopilotChatMode.Embedded,
        embeddedContainer: embeddedContainerRef.current,
      });
    }
  }, [chatService, chatMode]);

  // Update features when toggles change
  useEffect(() => {
    if (chatService) {
      chatService.initialize({
        mode: chatMode,
        readOnly: features.readOnly,
        disabledFeatures: {
          history: !features.history,
          settings: !features.settings,
          attachments: !features.attachments,
          audio: !features.audio,
          audioStreaming: !features.audioStreaming,
          htmlPreview: !features.htmlPreview,
          headerSeparator: !features.headerSeparator,
          fullHeight: !features.fullHeight,
          resize: !features.resize,
          close: !features.close,
          feedback: !features.feedback,
          copy: !features.copy,
        },
        settingsRenderer: createSettingsRenderer(),
        ...(chatMode === AutopilotChatMode.Embedded &&
          embeddedContainerRef.current && {
            embeddedContainer: embeddedContainerRef.current,
          }),
      });

      // Re-set models and agent modes after initialization (or clear if disabled)
      if (features.model) {
        chatService.setModels([
          { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
          {
            id: 'gpt-3.5',
            name: 'GPT-3.5 Turbo',
            description: 'Fast and efficient',
          },
          { id: 'claude-3', name: 'Claude 3', description: 'Anthropic model' },
        ]);
        chatService.setSelectedModel(selectedModel);
      } else {
        chatService.setModels([]);
      }

      if (features.agentMode) {
        chatService.setAgentModes([
          {
            id: 'agent',
            name: 'Agent',
            description: 'AI-powered autonomous agent mode',
            icon: 'smart_toy',
          },
          {
            id: 'plan',
            name: 'Plan',
            description: 'Create and review execution plans',
            icon: 'edit_note',
          },
          {
            id: 'attended',
            name: 'Attended',
            description: 'Human assisted execution',
            icon: 'play_arrow',
          },
        ]);
        chatService.setAgentMode(selectedAgentMode);
      } else {
        chatService.setAgentModes([]);
      }

      // Update other config settings
      chatService.patchConfig({
        paginatedMessages: features.paginatedMessages,
        paginatedResources: resourcePaginationEnabled,
        spacing: {
          compactMode: features.compactMode,
          // Only pass custom values when NOT in compact mode
          // In compact mode, let calculateSpacing compute the values
          ...(features.compactMode
            ? {}
            : {
                primaryFontToken,
                promptBox: {
                  minRows: promptBoxMinRows,
                  maxRows: promptBoxMaxRows,
                },
              }),
        },
        theming: {
          scrollBar: features.customScrollTheme
            ? {
                scrollThumbColor: '#000000',
                scrollSize: '16px',
                scrollHoverColor: '#888888',
                scrollBorderRadius: '8px',
              }
            : undefined,
        },
      });

      // Handle attachments async
      if (features.attachmentsAsync) {
        // biome-ignore lint/suspicious/noExplicitAny: Event not in enum
        chatService.on('setAttachments' as any, (attachments: unknown) => {
          // biome-ignore lint/suspicious/noExplicitAny: Attachments data structure
          const attachmentsData = attachments as any;
          chatService.setAttachmentsLoading([
            // biome-ignore lint/suspicious/noExplicitAny: Attachment object structure
            ...attachmentsData.added.map((attachment: any) => ({
              ...attachment,
              loading: true,
            })),
          ]);

          setTimeout(() => {
            chatService.setAttachmentsLoading([
              // biome-ignore lint/suspicious/noExplicitAny: Attachment object structure
              ...attachmentsData.added.map((attachment: any) => ({
                ...attachment,
                loading: false,
              })),
            ]);
          }, 2000);
        });
      } else {
        chatService.setAttachmentsLoading([]);
      }
    }
  }, [
    features,
    chatService,
    selectedModel,
    selectedAgentMode,
    createSettingsRenderer,
    chatMode,
    primaryFontToken,
    promptBoxMinRows,
    promptBoxMaxRows,
    resourcePaginationEnabled,
  ]);

  // Chat mode controls
  const openChat = () => chatService?.open();
  const closeChat = () => chatService?.close();
  const setFullScreen = () => {
    chatService?.setChatMode(AutopilotChatMode.FullScreen);
    setChatMode(AutopilotChatMode.FullScreen);
  };
  const setSideBySide = () => {
    chatService?.setChatMode(AutopilotChatMode.SideBySide);
    setChatMode(AutopilotChatMode.SideBySide);
  };
  const setEmbedded = () => {
    setChatMode(AutopilotChatMode.Embedded);
    chatService?.setChatMode(AutopilotChatMode.Embedded);
  };

  // Message controls
  const sendSimpleRequest = () => {
    chatService?.sendRequest({
      content: customMessage,
    });
  };

  const sendSimpleResponse = () => {
    chatService?.sendResponse({
      content: customMessage,
      created_at: '22-10-2025',
      widget: 'apollo-markdown-renderer',
      shouldWaitForMoreMessages: waitForMore,
    });
  };

  const sendResponseWithActions = () => {
    chatService?.sendResponse({
      content: 'Here is a response with custom actions. Try the buttons below!',
      created_at: '22-10-2025',
      widget: 'apollo-markdown-renderer',
      actions: [
        {
          name: 'copy-action',
          label: 'Copy to Clipboard',
          icon: 'content_copy',
          eventName: 'copy-custom',
        },
        {
          name: 'regenerate-action',
          label: 'Regenerate',
          icon: 'refresh',
          eventName: 'regenerate-custom',
        },
      ],
    });

    // Listen for the custom events
    // biome-ignore lint/suspicious/noExplicitAny: Event not in enum
    chatService?.on('copy-custom' as any, () => {
      navigator.clipboard.writeText('Response copied!');
      console.log('Copied to clipboard!');
    });

    // biome-ignore lint/suspicious/noExplicitAny: Event not in enum
    chatService?.on('regenerate-custom' as any, () => {
      console.log('Regenerating response...');
    });
  };

  const sendResponseWithCitations = () => {
    chatService?.sendResponse({
      content:
        'According to research, the sky is blue due to Rayleigh scattering. See references below for more information.',
      widget: 'default',
      contentParts: [
        {
          text: 'According to research, the sky is blue due to Rayleigh scattering. ',
          citations: [
            {
              id: 1,
              title: 'Why is the Sky Blue?',
              url: 'https://example.com/sky',
            },
          ],
        },
        {
          text: 'See references below for more information.',
          citations: [
            {
              id: 2,
              title: 'Atmospheric Science',
              url: 'https://example.com/atmosphere',
            },
          ],
        },
      ],
      // biome-ignore lint/suspicious/noExplicitAny: contentParts and citations not in public type definition
    } as any);
  };

  const sendStreamingResponse = () => {
    // Use fakeStream for simpler demo streaming
    chatService?.sendResponse({
      content: streamingText,
      fakeStream: true,
      shouldWaitForMoreMessages: waitForMore,
      // biome-ignore lint/suspicious/noExplicitAny: fakeStream not in public type definition
    } as any);
  };

  const sendCodeBlock = () => {
    const codeContent = `\`\`\`typescript
// This is a long comment line that should wrap properly when displayed in the code block to test the wrapping functionality
interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: { theme: 'light' | 'dark'; language: string; notifications: boolean };
}

function processUserData(user: UserProfile, additionalMetadata: Record<string, unknown>): string {
  const fullName = \`\${user.firstName} \${user.lastName}\`;
  const metadataString = JSON.stringify(additionalMetadata, null, 2);

  return \`User: \${fullName} (\${user.email}) - Created: \${user.createdAt.toISOString()} - Metadata: \${metadataString}\`;
}

const exampleUser: UserProfile = {
  id: 12345,
  username: 'john_doe_with_a_very_long_username_that_should_test_wrapping',
  email: 'john.doe.with.a.very.long.email.address@example-domain-name.com',
  firstName: 'John',
  lastName: 'Doe',
  createdAt: new Date(),
  updatedAt: new Date(),
  preferences: { theme: 'dark', language: 'en-US', notifications: true }
};

console.log(processUserData(exampleUser, { source: 'web', ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }));
\`\`\``;

    chatService?.sendResponse({
      content: `Here's a TypeScript example with long lines to test wrapping:\n\n${codeContent}`,
      widget: 'default',
      // biome-ignore lint/suspicious/noExplicitAny: widget property not properly typed
    } as any);
  };

  const sendHTMLPreview = () => {
    const htmlContent = `\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>Hello World</title>
  <style>
    body { font-family: Arial; text-align: center; padding: 50px; }
    h1 { color: #fa4616; }
  </style>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>This is an HTML preview example.</p>
</body>
</html>
\`\`\``;

    chatService?.sendResponse({
      content: `Here's an HTML example with live preview:\n\n${htmlContent}`,
      widget: 'default',
      // biome-ignore lint/suspicious/noExplicitAny: widget property not properly typed
    } as any);
  };

  // Loading and error states
  const showLoading = () => {
    chatService?.setLoadingMessage(loadingMessage);
  };

  const hideLoading = () => {
    chatService?.setLoadingMessage('');
  };

  const showError = () => {
    chatService?.setError(errorMessage);
  };

  const showWarning = () => {
    chatService?.setError('This is a warning message.');
  };

  const clearErrors = () => {
    chatService?.clearError();
  };

  // History controls
  const toggleHistory = () => {
    chatService?.toggleHistory();
  };

  const addHistoryItems = () => {
    chatService?.setHistory([
      {
        id: '1',
        name: 'Previous Conversation 1',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '2',
        name: 'Previous Conversation 2',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: '3',
        name: 'Previous Conversation 3',
        timestamp: new Date(Date.now() - 259200000).toISOString(),
      },
    ]);
  };

  // Utility
  const clearChat = () => {
    chatService?.newChat();
  };

  const toggleFeature = (feature: keyof typeof features) => {
    setFeatures((prev) => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  // Additional controls
  const setPrompt = () => {
    chatService?.setPrompt('I need something to be done');
  };

  const resetPrompt = () => {
    chatService?.setPrompt('');
  };

  const stopResponse = () => {
    chatService?.stopResponse();
  };

  const toggleAutoScroll = () => {
    const newValue = !autoScroll;
    setAutoScroll(newValue);
    chatService?.toggleAutoScroll(newValue);
  };

  const setAllowedAttachments = () => {
    chatService?.setAllowedAttachments({
      types: {
        'text/csv': ['.csv'],
      },
      maxSize: 1024 * 1024,
      multiple: false,
    });
    console.log('Allowed attachments set to: CSV files only, max 1MB');
  };

  const setFirstRunExperience = () => {
    chatService?.setFirstRunExperience({
      title: 'Welcome to UiPath Autopilot',
      description:
        "I'm here to help you build, understand, and troubleshoot your automation projects.",
      suggestions: [
        {
          label: 'New process',
          prompt:
            'Can you provide a detailed step-by-step guide on how to create a new automation process?',
        },
        {
          label: 'Debug workflow',
          prompt:
            "I'm having trouble with my workflow execution. Can you explain debugging techniques?",
        },
        {
          label: 'Studio updates',
          prompt: 'What are the latest features in UiPath Studio?',
        },
      ],
    });
  };

  const setConversation = () => {
    chatService?.setConversation([
      {
        id: '1',
        role: AutopilotChatRole.User,
        content: 'How do I create a workflow that extracts data from invoices?',
        created_at: '22-10-2022',
        widget: '',
      },
      {
        id: '2',
        role: AutopilotChatRole.Assistant,
        content:
          'To extract data from invoices, you can use UiPath Document Understanding. Here\'s a step-by-step approach:\n\n1. Install the Document Understanding package\n2. Create a new workflow and add the "Digitize Document" activity\n3. Configure it to use ML skills\n4. Use the "Data Extraction" activity\n5. Validate the extracted data',
        created_at: '23-10-2022',
        widget: '',
      },
    ]);
  };

  const setSuggestions = () => {
    chatService?.setSuggestions(
      [
        { label: 'What can you do?', prompt: 'What can you do?' },
        { label: 'Show me an example', prompt: 'Show me an example' },
        { label: 'Help me with code', prompt: 'Help me with code' },
      ],
      true
    );
  };

  const sendToolCall = (displayMode: string) => {
    const now = new Date().toISOString();
    const start = new Date(Date.now() - 2500).toISOString();

    if (displayMode === ConversationalDisplayModeTypes.FullTrace) {
      chatService?.sendResponse({
        content: 'Tool call response',
        widget: 'apollo-agents-tool-call',
        meta: {
          displayMode,
          span: {
            key: 'multi-web-search',
            name: 'Tool call - Multi_Web_Search',
            data: {
              id: 'root-span',
              name: 'Tool call - Multi_Web_Search',
              startTime: new Date(Date.now() - 25000).toISOString(),
              endTime: now,
              status: 'ok',
              type: 'toolCall',
              attributes: {
                toolName: 'Multi_Web_Search',
                toolType: 'Agent',
                arguments: { query: 'what are trending right now' },
                result: { result: 'Multi web search completed successfully.' },
              },
            },
            children: [
              {
                key: 'autonomous-web-search',
                name: 'Autonomous Web Search',
                data: {
                  id: 'agentTool-1',
                  name: 'Autonomous Web Search',
                  startTime: new Date(Date.now() - 25000).toISOString(),
                  endTime: now,
                  status: 'ok',
                  type: 'agentTool',
                },
                children: [
                  {
                    key: 'agent-run-1',
                    name: 'Agent run - Autonomous Web Search',
                    data: {
                      id: 'agentRun-1',
                      name: 'Agent run - Autonomous Web Search',
                      startTime: new Date(Date.now() - 23000).toISOString(),
                      endTime: now,
                      status: 'ok',
                      type: 'agentRun',
                    },
                    children: [
                      {
                        key: 'tool-call-web-search-1',
                        name: 'Tool call - Web_Search',
                        data: {
                          id: 'ws1',
                          name: 'Tool call - Web_Search',
                          type: 'toolCall',
                          status: 'ok',
                          startTime: new Date(Date.now() - 21000).toISOString(),
                          endTime: new Date(Date.now() - 17000).toISOString(),
                        },
                        children: [],
                      },
                      {
                        key: 'tool-call-web-search-2',
                        name: 'Tool call - Web_Search',
                        data: {
                          id: 'ws2',
                          name: 'Tool call - Web_Search',
                          type: 'toolCall',
                          status: 'ok',
                          startTime: new Date(Date.now() - 16000).toISOString(),
                          endTime: new Date(Date.now() - 10000).toISOString(),
                        },
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
        // biome-ignore lint/suspicious/noExplicitAny: meta property not in public type definition
      } as any);
      return;
    }

    chatService?.sendResponse({
      content: 'Tool call response',
      widget: 'apollo-agents-tool-call',
      meta: {
        displayMode,
        input: {
          provider: 'GoogleCustomSearch',
          query: 'most interesting scientific fact discovered recently 2025',
          num: 5,
        },
        output: {
          results: [
            {
              snippet: 'Breaking science news and articles...',
              title: 'ScienceDaily: Latest Research News',
              url: 'https://www.sciencedaily.com/',
            },
          ],
        },
        isError: false,
        startTime: start,
        endTime: now,
        toolName: 'Web_Search',
      },
      // biome-ignore lint/suspicious/noExplicitAny: meta property not in public type definition
    } as any);
  };

  const sendResponseDisabledActions = () => {
    chatService?.sendResponse({
      content: 'Message with no actions',
      disableActions: true,
      // biome-ignore lint/suspicious/noExplicitAny: disableActions not in public type definition
    } as any);
  };

  const setPreHook = () => {
    const actions = ['new-chat', 'toggle-history', 'toggle-chat', 'close-chat', 'feedback'];
    actions.forEach((action) => {
      // biome-ignore lint/suspicious/noExplicitAny: setPreHook action parameter not fully typed
      chatService?.setPreHook(action as any, async () => {
        return window.confirm(`${action} pre hook. Continue?`);
      });
    });
    console.log('Pre-hooks set for all actions');
  };

  // Custom Header Actions
  const setCustomHeaderActions = () => {
    chatService?.setCustomHeaderActions([
      {
        id: 'export',
        name: 'Export',
        icon: 'download',
        description: 'Export conversation in various formats',
        children: [
          {
            id: 'export-pdf',
            name: 'Export as PDF',
            icon: 'picture_as_pdf',
            description: 'Download conversation as PDF file',
          },
          {
            id: 'export-docx',
            name: 'Export as DOCX',
            icon: 'description',
            description: 'Download conversation as Word document',
          },
          {
            id: 'export-json',
            name: 'Export as JSON',
            icon: 'data_object',
            description: 'Download conversation as JSON file',
          },
          {
            id: 'export-txt',
            name: 'Export as Text',
            icon: 'text_snippet',
            description: 'Download conversation as plain text',
          },
        ],
      },
      {
        id: 'share',
        name: 'Share Conversation',
        icon: 'share',
        description: 'Share this conversation with others',
      },
      {
        id: 'translate',
        name: 'Translate',
        icon: 'translate',
        description: 'Translate conversation to different languages',
        children: [
          {
            id: 'translate-es',
            name: 'Spanish',
            icon: 'language',
            description: 'Translate to Spanish',
          },
          {
            id: 'translate-fr',
            name: 'French',
            icon: 'language',
            description: 'Translate to French',
          },
          {
            id: 'translate-de',
            name: 'German',
            icon: 'language',
            description: 'Translate to German',
          },
          {
            id: 'translate-ja',
            name: 'Japanese',
            icon: 'language',
            description: 'Translate to Japanese',
          },
          {
            id: 'translate-zh',
            name: 'Chinese',
            icon: 'language',
            description: 'Translate to Chinese',
          },
        ],
      },
      {
        id: 'print',
        name: 'Print',
        icon: 'print',
        description: 'Print conversation',
      },
      {
        id: 'advanced',
        name: 'Advanced Settings',
        icon: 'tune',
        description: 'Advanced configuration options',
        disabled: true,
      },
      // biome-ignore lint/suspicious/noExplicitAny: Custom header actions type not fully defined
    ] as any);
    console.log('Custom header actions set');
  };

  const clearCustomHeaderActions = () => {
    chatService?.setCustomHeaderActions([]);
    console.log('Custom header actions cleared');
  };

  // Resource Manager controls
  const setResourceManager = () => {
    chatService?.setResourceManager(createResourceManager());
    console.log('Resource manager set');
  };

  const clearResourceManager = () => {
    // biome-ignore lint/suspicious/noExplicitAny: null is used to clear the resource manager
    chatService?.setResourceManager(null as any);
    console.log('Resource manager cleared');
  };

  // Auto-update resource manager when pagination settings change
  useEffect(() => {
    if (chatService) {
      chatService.setResourceManager(createResourceManager());
      console.log(
        `Resource manager updated: pagination=${resourcePaginationEnabled}, pageSize=${resourcePageSize}`
      );
    }
  }, [chatService, createResourceManager, resourcePaginationEnabled, resourcePageSize]);

  const sendResponseWithVariables = () => {
    chatService?.sendResponse({
      content: `I will update [[resource-token:{"id":"var-email","type":"variable","icon":"mail","displayName":"email"}]] and [[resource-token:{"id":"var-long","type":"variable","icon":"data_object","displayName":"this_is_a_very_long_variable_name_that_should_test_truncation"}]] in the system, then notify [[resource-token:{"id":"var-username","type":"variable","icon":"person","displayName":"username"}]] when complete.`,
      created_at: '02-02-2026',
      widget: 'default',
    });
    console.log('Sent response with resource tokens');
  };

  // Stream with Resource Tokens - demonstrates buffering of incomplete tokens
  const streamWithResourceTokens = () => {
    const messageId = `streaming-resources-${Date.now()}`;
    let chunkIndex = 0;

    const chunks = [
      'I will update the ',
      '[[resource-token:', // Start of token (incomplete)
      '{"id":"var-', // JSON starts (still incomplete)
      'email","type":"variable",', // More JSON
      '"icon":"mail","displayName":"email"}]]', // Token completes
      ' variable in the system.\n\n',
      "Then I'll notify ",
      '[[resource-token:{', // Another token starts
      '"id":"var-username",',
      '"type":"variable","icon":"person",',
      '"displayName":"username"}]]', // Token completes
      ' when the process is complete.\n\n',
      "I'll also update ",
      '[[resource-token:{',
      '"id":"var-long","type":"variable",',
      '"icon":"data_object","displayName":',
      '"this_is_a_very_long_variable_name_that_should_test_truncation"}]]', // Long label token
      ' for testing.\n\n',
      "Finally, I'll log the result to ",
      '[[resource-token:{"id":"var-log","type":"variable","icon":"description","displayName":"activity_log"}]]', // Complete token in one chunk
      '.',
    ];

    const streamChunk = () => {
      if (chunkIndex >= chunks.length) {
        return;
      }

      const chunk = chunks[chunkIndex] ?? '';
      const isDone = chunkIndex === chunks.length - 1;

      chatService?.sendResponse({
        id: messageId,
        content: chunk,
        stream: true,
        done: isDone,
        created_at: '02-02-2026',
        widget: 'default',
      });

      const preview = chunk.slice(0, 30);
      const suffix = chunk.length > 30 ? '...' : '';
      console.log(
        `[StreamWithResourceTokens] Chunk ${chunkIndex + 1}/${chunks.length}: "${preview}${suffix}" (done: ${isDone})`
      );

      chunkIndex++;

      if (!isDone) {
        // Simulate network delay between chunks
        setTimeout(streamChunk, 150);
      }
    };

    streamChunk();
  };

  // Stream with Citations
  const streamWithCitations = () => {
    // Generate a unique message ID for this streaming response
    const messageId = `streaming-citations-${Date.now()}`;
    let streamIndex = 0;

    const streamingParts = [
      { index: 0, text: 'Based on the search results' },
      { index: 0, text: ", I'll" },
      { index: 0, text: ' create a comprehensive' },
      { index: 0, text: ' summary about UiPath with' },
      { index: 0, text: ' citations:\n\n##' },
      { index: 0, text: ' Company Background' },
      { index: 0, text: '\n- ' },
      { index: 1, text: '**UiPath Inc**' },
      { index: 1, text: '. is a global' },
      { index: 1, text: ' software company that was' },
      { index: 1, text: ' founded in ' },
      { index: 1, text: '_Bucharest, Romania_' },
      { index: 1, text: ', by' },
      { index: 1, text: ' **Daniel Dines**' },
      {
        index: 1,
        text: '',
        citation: {
          id: 1,
          title: 'UiPath - Wikipedia',
          url: 'https://en.wikipedia.org/wiki/UiPath',
        },
      },
      { index: 2, text: '. ' },
      { index: 3, text: 'The' },
      { index: 3, text: ' company starte' },
      { index: 3, text: 'd its journey' },
      { index: 3, text: ' in 2005' },
      { index: 3, text: ' and has' },
      { index: 3, text: ' grown to become a leading' },
      { index: 3, text: ' enterprise automation software ven' },
      {
        index: 3,
        text: 'dor',
        citation: {
          id: 1,
          title: 'UiPath - Wikipedia',
          url: 'https://en.wikipedia.org/wiki/UiPath',
        },
      },
      {
        index: 3,
        text: '',
        citation: {
          id: 2,
          title: 'UiPath, Inc. (PATH)',
          url: 'https://ir.uipath.com/',
        },
      },
      { index: 4, text: '. \n\n## Core' },
      { index: 4, text: ' Business' },
      { index: 4, text: '\nU' },
      { index: 4, text: 'iPath special' },
      { index: 4, text: 'izes in several' },
      { index: 4, text: ' key areas:\n\n1' },
      { index: 4, text: '. **Rob' },
      { index: 4, text: 'otic Process Automation' },
      { index: 4, text: ':**' },
      { index: 4, text: '\n' },
      { index: 5, text: 'R' },
      { index: 5, text: 'PA has' },
      { index: 5, text: ' revolutionized how work' },
      { index: 5, text: ' gets done globally' },
      { index: 5, text: ' by eliminating time' },
      { index: 5, text: '-consuming, repet' },
      { index: 5, text: 'itive tasks from employees' },
      { index: 5, text: "' worklo" },
      {
        index: 5,
        text: 'ads',
        citation: {
          id: 3,
          title: 'Discovery Phase Guide',
          download_url: 'https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf',
          page_number: 2,
        },
      },
      { index: 6, text: '.' },
      { index: 6, text: '\n\n2. **' },
      { index: 6, text: 'Business Automation Platform**' },
      { index: 6, text: '\n' },
      { index: 7, text: 'The platform' },
      { index: 7, text: ' offers en' },
      { index: 7, text: 'd-to-en' },
      { index: 7, text: 'd process transformation' },
      { index: 7, text: ' capabilities on' },
      { index: 7, text: ' a single platform,' },
      { index: 7, text: ' featuring fully' },
      { index: 7, text: ' governed agentic' },
      { index: 7, text: ' automation that integ' },
      { index: 7, text: 'rates with existing systems' },
      {
        index: 7,
        text: '',
        citation: {
          id: 4,
          title: 'UiPath Business Automation Platform | UiPath',
          url: 'https://www.uipath.com/product',
        },
      },
    ];

    const streamChunk = () => {
      if (streamIndex >= streamingParts.length) {
        return;
      }

      const chunk = streamingParts[streamIndex];
      if (!chunk) return;

      // Use the same message ID for all chunks
      // Set done: true only for the last chunk
      chatService?.sendResponse({
        id: messageId,
        contentPartChunk: {
          index: chunk.index,
          text: chunk.text,
          ...(chunk.citation && { citation: chunk.citation }),
        },
        stream: true,
        done: streamIndex === streamingParts.length - 1,
        // biome-ignore lint/suspicious/noExplicitAny: contentPartChunk not in public type definition
      } as any);

      streamIndex++;

      // Continue streaming if there are more chunks
      if (streamIndex < streamingParts.length) {
        setTimeout(streamChunk, 100);
      }
    };

    streamChunk();
  };

  // Agent Mode selection
  const handleAgentModeChange = (mode: string) => {
    setSelectedAgentMode(mode);
    chatService?.setAgentMode(mode);
  };

  // Model selection
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    chatService?.setSelectedModel(modelId);
  };

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <Box
        sx={{
          display: chatMode === AutopilotChatMode.FullScreen ? 'none' : 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          gap: 1,
          maxHeight: '100vh',
          overflowY: 'auto',
          p: '16px 0 0 16px',
          boxSizing: 'border-box',
        }}
      >
        <ApTypography variant={FontVariantToken.fontSizeH3Bold} component="h2" sx={{ mb: 3 }}>
          ApChat Showcase
        </ApTypography>

        <Section>
          <SectionTitle>Chat Mode Controls</SectionTitle>
          <ButtonGroup>
            <DemoButton primary onClick={openChat}>
              Open Chat
            </DemoButton>
            <DemoButton onClick={closeChat}>Close Chat</DemoButton>
          </ButtonGroup>
          <ButtonGroup>
            <DemoButton onClick={setSideBySide}>Side by Side</DemoButton>
            <DemoButton onClick={setFullScreen}>Full Screen</DemoButton>
            <DemoButton onClick={setEmbedded}>Embedded</DemoButton>
          </ButtonGroup>
          <ButtonGroup>
            <DemoButton onClick={toggleAutoScroll}>Toggle Auto Scroll</DemoButton>
            <DemoButton onClick={clearChat}>Clear Chat</DemoButton>
          </ButtonGroup>
        </Section>

        <Section>
          <SectionTitle>Chat Setup</SectionTitle>
          <ButtonGroup>
            <DemoButton onClick={setAllowedAttachments}>Set Allowed Attachments</DemoButton>
            <DemoButton onClick={setPreHook}>Set Pre Hook</DemoButton>
          </ButtonGroup>
          <ButtonGroup>
            <DemoButton onClick={setFirstRunExperience}>Set First Run Experience</DemoButton>
          </ButtonGroup>
        </Section>

        <Section>
          <SectionTitle>Custom Header Actions</SectionTitle>
          <ButtonGroup>
            <DemoButton onClick={setCustomHeaderActions}>Set Custom Header Actions</DemoButton>
            <DemoButton onClick={clearCustomHeaderActions}>Clear Custom Header Actions</DemoButton>
          </ButtonGroup>
        </Section>

        <Section>
          <SectionTitle>Resource Manager</SectionTitle>
          <ButtonGroup>
            <DemoButton onClick={setResourceManager}>Set Resource Manager</DemoButton>
            <DemoButton onClick={clearResourceManager}>Clear Resource Manager</DemoButton>
          </ButtonGroup>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={resourcePaginationEnabled}
                onChange={() => setResourcePaginationEnabled(!resourcePaginationEnabled)}
              />
            }
            label="Enable Pagination (50 vars, 30 files)"
          />
          <InfoText style={{ marginTop: 8 }}>Page Size: {resourcePageSize}</InfoText>
          <DemoInput
            type="number"
            min={1}
            max={20}
            value={resourcePageSize}
            onChange={(e) => setResourcePageSize(Number(e.target.value))}
            style={{ width: 80 }}
          />
          <InfoText>
            Type @ in the chat input to trigger the picker. Test keyboard navigation (↑/↓),
            selection (Enter/Tab), and escape behavior.
          </InfoText>
        </Section>

        <Section>
          <SectionTitle>Model Selection</SectionTitle>
          <DemoSelect value={selectedModel} onChange={(e) => handleModelChange(e.target.value)}>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-3.5">GPT-3.5 Turbo</option>
            <option value="claude-3">Claude 3</option>
          </DemoSelect>
        </Section>

        <Section>
          <SectionTitle>Agent Mode</SectionTitle>
          <DemoSelect
            value={selectedAgentMode}
            onChange={(e) => handleAgentModeChange(e.target.value)}
          >
            <option value="agent">Agent</option>
            <option value="plan">Plan</option>
            <option value="attended">Attended</option>
          </DemoSelect>
        </Section>

        <Section>
          <SectionTitle>Input Styling</SectionTitle>
          <InfoText>Primary Font Token</InfoText>
          <DemoSelect
            value={primaryFontToken}
            onChange={(e) => setPrimaryFontToken(e.target.value as FontVariantToken)}
          >
            <option value={FontVariantToken.fontSizeXs}>XS (fontSizeXs)</option>
            <option value={FontVariantToken.fontSizeS}>S (fontSizeS)</option>
            <option value={FontVariantToken.fontSizeM}>M (fontSizeM)</option>
            <option value={FontVariantToken.fontSizeL}>L (fontSizeL)</option>
          </DemoSelect>
          <InfoText style={{ marginTop: 12 }}>Prompt Box Min Rows: {promptBoxMinRows}</InfoText>
          <DemoInput
            type="number"
            min={1}
            max={10}
            value={promptBoxMinRows}
            onChange={(e) => setPromptBoxMinRows(Number(e.target.value))}
          />
          <InfoText style={{ marginTop: 12 }}>Prompt Box Max Rows: {promptBoxMaxRows}</InfoText>
          <DemoInput
            type="number"
            min={1}
            max={20}
            value={promptBoxMaxRows}
            onChange={(e) => setPromptBoxMaxRows(Number(e.target.value))}
          />
        </Section>

        <Section>
          <SectionTitle>Message Controls</SectionTitle>
          <ButtonGroup>
            <DemoButton onClick={setPrompt}>Set Prompt</DemoButton>
            <DemoButton onClick={resetPrompt}>Reset Prompt</DemoButton>
          </ButtonGroup>
          <DemoInput
            placeholder="Custom message"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
          />
          <ButtonGroup>
            <DemoButton onClick={sendSimpleRequest}>Send Request</DemoButton>
            <DemoButton onClick={sendSimpleResponse}>Send Response</DemoButton>
            <DemoButton onClick={stopResponse}>Stop Response</DemoButton>
          </ButtonGroup>
          <ButtonGroup>
            <DemoButton onClick={sendResponseWithActions}>With Actions</DemoButton>
            <DemoButton onClick={sendResponseWithCitations}>With Citations</DemoButton>
            <DemoButton onClick={sendResponseWithVariables}>With Resource Tokens</DemoButton>
          </ButtonGroup>
          <ButtonGroup>
            <DemoButton onClick={sendCodeBlock}>Code Block</DemoButton>
            <DemoButton onClick={sendHTMLPreview}>HTML Preview</DemoButton>
          </ButtonGroup>
          <ButtonGroup>
            <DemoButton onClick={() => sendToolCall(ConversationalDisplayModeTypes.ToolNameOnly)}>
              Tool Call: Name Only
            </DemoButton>
            <DemoButton
              onClick={() => sendToolCall(ConversationalDisplayModeTypes.InputsAndOutputs)}
            >
              Tool Call: I/O
            </DemoButton>
            <DemoButton onClick={() => sendToolCall(ConversationalDisplayModeTypes.FullTrace)}>
              Tool Call: Full Trace
            </DemoButton>
            <DemoButton onClick={sendResponseDisabledActions}>Disabled Actions</DemoButton>
          </ButtonGroup>
          <ButtonGroup>
            <DemoButton onClick={setConversation}>Set Conversation</DemoButton>
            <DemoButton onClick={setSuggestions}>Set Suggestions</DemoButton>
          </ButtonGroup>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={waitForMore}
                onChange={() => setWaitForMore(!waitForMore)}
              />
            }
            label="Wait For More Messages"
          />
        </Section>

        <Section>
          <SectionTitle>Streaming</SectionTitle>
          <DemoTextArea
            placeholder="Text to stream"
            value={streamingText}
            onChange={(e) => setStreamingText(e.target.value)}
          />
          <ButtonGroup>
            <DemoButton onClick={sendStreamingResponse}>Stream Response</DemoButton>
            <DemoButton onClick={streamWithCitations}>Stream With Citations</DemoButton>
            <DemoButton onClick={streamWithResourceTokens}>Stream Resource Tokens</DemoButton>
          </ButtonGroup>
          <InfoText>
            Streams text progressively. "Stream Resource Tokens" demonstrates buffering of
            incomplete tokens to prevent flickering.
          </InfoText>
        </Section>

        <Section>
          <SectionTitle>Loading & Error States</SectionTitle>
          <DemoInput
            placeholder="Loading message"
            value={loadingMessage}
            onChange={(e) => setLoadingMessage(e.target.value)}
          />
          <ButtonGroup>
            <DemoButton onClick={showLoading}>Show Loading</DemoButton>
            <DemoButton onClick={hideLoading}>Hide Loading</DemoButton>
          </ButtonGroup>
          <DemoInput
            placeholder="Error message"
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
          />
          <ButtonGroup>
            <DemoButton onClick={showError}>Show Error</DemoButton>
            <DemoButton onClick={showWarning}>Show Warning</DemoButton>
            <DemoButton onClick={clearErrors}>Clear Errors</DemoButton>
          </ButtonGroup>
        </Section>

        <Section>
          <SectionTitle>History</SectionTitle>
          <ButtonGroup>
            <DemoButton onClick={addHistoryItems}>Add History Items</DemoButton>
            <DemoButton onClick={toggleHistory}>Toggle History Panel</DemoButton>
          </ButtonGroup>
        </Section>

        <Section>
          <SectionTitle>Feature Toggles</SectionTitle>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.history}
                onChange={() => toggleFeature('history')}
              />
            }
            label="History"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.settings}
                onChange={() => toggleFeature('settings')}
              />
            }
            label="Settings"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.attachments}
                onChange={() => toggleFeature('attachments')}
              />
            }
            label="Attachments"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.audio}
                onChange={() => toggleFeature('audio')}
              />
            }
            label="STT Dictate"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.audioStreaming}
                onChange={() => toggleFeature('audioStreaming')}
              />
            }
            label="Voice Interaction"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.htmlPreview}
                onChange={() => toggleFeature('htmlPreview')}
              />
            }
            label="HTML Preview"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.headerSeparator}
                onChange={() => toggleFeature('headerSeparator')}
              />
            }
            label="Header Separator"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.fullHeight}
                onChange={() => toggleFeature('fullHeight')}
              />
            }
            label="Full Height"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.resize}
                onChange={() => toggleFeature('resize')}
              />
            }
            label="Resize"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.close}
                onChange={() => toggleFeature('close')}
              />
            }
            label="Close"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.feedback}
                onChange={() => toggleFeature('feedback')}
              />
            }
            label="Feedback"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.model}
                onChange={() => toggleFeature('model')}
              />
            }
            label="Model"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.agentMode}
                onChange={() => toggleFeature('agentMode')}
              />
            }
            label="Agent Mode"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.sendOnClick}
                onChange={() => toggleFeature('sendOnClick')}
              />
            }
            label="Send On Click"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.paginatedMessages}
                onChange={() => toggleFeature('paginatedMessages')}
              />
            }
            label="Paginated Messages"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.compactMode}
                onChange={() => toggleFeature('compactMode')}
              />
            }
            label="Compact Mode"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.customScrollTheme}
                onChange={() => toggleFeature('customScrollTheme')}
              />
            }
            label="Custom Scroll Theme"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.copy}
                onChange={() => toggleFeature('copy')}
              />
            }
            label="Copy"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.attachmentsAsync}
                onChange={() => toggleFeature('attachmentsAsync')}
              />
            }
            label="Attachments Async"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={features.readOnly}
                onChange={() => toggleFeature('readOnly')}
              />
            }
            label="Read Only"
          />
        </Section>

        <Section>
          <SectionTitle>State Controls</SectionTitle>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={isWaiting}
                onChange={() => {
                  setIsWaiting(!isWaiting);
                  chatService?.setWaiting(!isWaiting);
                }}
              />
            }
            label="Set Waiting"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={isShowLoading}
                onChange={() => {
                  setIsShowLoading(!isShowLoading);
                  chatService?.setShowLoading(!isShowLoading);
                }}
              />
            }
            label="Set Show Loading"
          />
        </Section>
      </Box>

      {/* Chat component - always render once */}
      {chatService && (
        <Box sx={{ justifySelf: 'flex-end', background: 'var(--color-background)' }}>
          <ApChat chatServiceInstance={chatService} locale={locale} theme={theme} />
        </Box>
      )}

      {/* Embedded mode: Container always rendered but hidden when not in embedded mode */}
      <Box
        ref={embeddedContainerRef}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 400,
          height: 600,
          boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(0, 0, 0, 0.35))',
          borderRadius: '12px',
          overflow: 'hidden',
          zIndex: 1000,
          // Needed for absolute positioned chat content in embedded mode
          '& > *': { position: 'relative' },
        }}
        style={{
          background: 'var(--color-background)',
          display: chatMode === AutopilotChatMode.Embedded ? 'block' : 'none',
        }}
      />
    </Box>
  );
}
