import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BASIC_CUSTOM_HEADER_ACTIONS,
  CITATION_RESPONSE,
  CODE_BLOCK_MESSAGE,
  createStoryResourceManager,
  createStorySettingsRenderer,
  customHeaderActionReply,
  HTML_PREVIEW_MESSAGE,
  MATERIAL_CUSTOM_HEADER_ACTIONS,
  RESOURCE_TOKEN_CHUNKS,
  RESOURCE_TOKEN_MESSAGE,
  RESPONSE_ACTIONS,
  SAMPLE_CONVERSATION,
  STORY_AGENT_MODES,
  STORY_FIRST_RUN_EXPERIENCE,
  STORY_LOADING_MESSAGES,
  STORY_MODELS,
  STORY_SUGGESTIONS,
  STREAMED_CITATION_CHUNKS,
  type StoryToolCallDisplayMode,
  storyHistoryItems,
  storyToolCallMeta,
} from '../../chat/stories/chat-story-fixtures';
import { embeddedPanelStyle } from '../../chat/stories/chat-story-frame';
import { FontVariantToken } from '../../core';
import {
  ApChat,
  type ApChatTheme,
  ApTypography,
  AutopilotChatEvent,
  AutopilotChatMode,
  type AutopilotChatResourceManager,
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

export { mapToChatLocale, mapToChatTheme } from '../../chat/stories/chat-story-fixtures';

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
    renameChat: true, // Rename affordance on history items - disabled by default
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
    stopResponse: true, // Stop button while a response is in flight - enabled by default
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
  const createResourceManager = useCallback(
    (): AutopilotChatResourceManager =>
      createStoryResourceManager({
        paginationEnabled: resourcePaginationEnabled,
        pageSize: resourcePageSize,
      }),
    [resourcePaginationEnabled, resourcePageSize]
  );

  // Custom settings renderer function
  const createSettingsRenderer = useCallback(() => createStorySettingsRenderer(), []);

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
          renameChat: !features.renameChat,
          stopResponse: !features.stopResponse,
        },
        settingsRenderer: createSettingsRenderer(),
      },
    });
    setChatService(service);

    // Store unsubscribe functions for cleanup
    const unsubscribes: Array<() => void> = [];

    // Set up models
    service.setModels(STORY_MODELS);
    service.setSelectedModel('gpt-4');

    // Set up agent modes
    service.setAgentModes(STORY_AGENT_MODES);
    service.setAgentMode('agent');

    // Set up custom header actions
    service.setCustomHeaderActions(BASIC_CUSTOM_HEADER_ACTIONS);

    // Set up suggestions
    service.setSuggestions(STORY_SUGGESTIONS);

    // Set default loading messages
    service.setDefaultLoadingMessages(STORY_LOADING_MESSAGES);

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

    unsubscribes.push(
      service.on(AutopilotChatEvent.RenameConversation, (payload: unknown) => {
        const { conversationId, name } = payload as {
          conversationId: string;
          name: string;
        };
        console.log(`[Rename] conversation ${conversationId} renamed to "${name}"`);
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

        const responseContent = customHeaderActionReply(actionData);

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
    features.renameChat,
    features.resize,
    features.settings,
    features.stopResponse,
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
          renameChat: !features.renameChat,
          stopResponse: !features.stopResponse,
        },
        settingsRenderer: createSettingsRenderer(),
        ...(chatMode === AutopilotChatMode.Embedded &&
          embeddedContainerRef.current && {
            embeddedContainer: embeddedContainerRef.current,
          }),
      });

      // Re-set models and agent modes after initialization (or clear if disabled)
      if (features.model) {
        chatService.setModels(STORY_MODELS);
        chatService.setSelectedModel(selectedModel);
      } else {
        chatService.setModels([]);
      }

      if (features.agentMode) {
        chatService.setAgentModes(STORY_AGENT_MODES);
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
      actions: RESPONSE_ACTIONS,
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
    chatService?.sendResponse({ ...CITATION_RESPONSE, created_at: '22-10-2025' });
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
    chatService?.sendResponse({
      content: CODE_BLOCK_MESSAGE,
      widget: 'default',
      created_at: '22-10-2025',
    });
  };

  const sendHTMLPreview = () => {
    chatService?.sendResponse({
      content: HTML_PREVIEW_MESSAGE,
      widget: 'default',
      created_at: '22-10-2025',
    });
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
    chatService?.setHistory(storyHistoryItems());
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
    chatService?.setFirstRunExperience(STORY_FIRST_RUN_EXPERIENCE);
  };

  const setConversation = () => {
    chatService?.setConversation(SAMPLE_CONVERSATION);
  };

  const setSuggestions = () => {
    chatService?.setSuggestions(STORY_SUGGESTIONS, true);
  };

  const sendToolCall = (displayMode: StoryToolCallDisplayMode) => {
    chatService?.sendResponse({
      content: 'Tool call response',
      widget: 'apollo-agents-tool-call',
      created_at: new Date().toISOString(),
      meta: storyToolCallMeta(displayMode),
    });
  };

  const sendResponseDisabledActions = () => {
    chatService?.sendResponse({
      content: 'Message with no actions',
      disableActions: true,
      // biome-ignore lint/suspicious/noExplicitAny: disableActions not in public type definition
    } as any);
  };

  const setPreHook = () => {
    const actions = [
      'new-chat',
      'toggle-history',
      'toggle-chat',
      'close-chat',
      'feedback',
      'rename-conversation',
    ];
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
    chatService?.setCustomHeaderActions(MATERIAL_CUSTOM_HEADER_ACTIONS);
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
      content: RESOURCE_TOKEN_MESSAGE,
      created_at: '02-02-2026',
      widget: 'default',
    });
    console.log('Sent response with resource tokens');
  };

  // Stream with Resource Tokens - demonstrates buffering of incomplete tokens
  const streamWithResourceTokens = () => {
    const messageId = `streaming-resources-${Date.now()}`;
    let chunkIndex = 0;

    const chunks = RESOURCE_TOKEN_CHUNKS;

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

    const streamingParts = STREAMED_CITATION_CHUNKS;

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
                checked={features.renameChat}
                onChange={() => toggleFeature('renameChat')}
              />
            }
            label="Rename Chat"
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
                checked={features.stopResponse}
                onChange={() => toggleFeature('stopResponse')}
              />
            }
            label="Stop Response"
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
          // Needed for absolute positioned chat content in embedded mode
          '& > *': { position: 'relative' },
        }}
        style={{
          ...embeddedPanelStyle(),
          display: chatMode === AutopilotChatMode.Embedded ? 'block' : 'none',
        }}
      />
    </Box>
  );
}
