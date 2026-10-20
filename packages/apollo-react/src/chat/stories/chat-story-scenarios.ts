/**
 * Scripted service traffic for the chat playground. Each scenario appends to the current
 * transcript unless it declares `emptyTranscript`, and is replayed into every chat on the page on
 * the same timers so renderers can be compared under identical input.
 */
import type { SupportedLocale } from '../../i18n';
import {
  AGENTS_TOOL_CALL_RENDERER,
  APOLLO_CHAT_TREE_RENDERER,
  type ApChatTheme,
  type AutopilotChatConfiguration,
  AutopilotChatEvent,
  type AutopilotChatFileInfo,
  type AutopilotChatHistorySearchPayload,
  type AutopilotChatMessage,
  type AutopilotChatRenderer,
  type AutopilotChatService,
  type ContentPartChunk,
  DEFAULT_MESSAGE_RENDERER,
} from '../service';
import {
  CITATION_RESPONSE,
  CODE_BLOCK_MESSAGE,
  CODE_LANGUAGES_MESSAGE,
  HTML_PREVIEW_MESSAGE,
  MARKDOWN_CORPUS,
  overflowResponseAction,
  PDF_CITATION_RESPONSE,
  RESOURCE_TOKEN_CHUNKS,
  RESOURCE_TOKEN_LIST_MESSAGE,
  RESOURCE_TOKEN_MESSAGE,
  RESPONSE_ACTIONS,
  SAMPLE_CONVERSATION,
  STORY_HISTORY_PAGE_SIZE,
  STREAMED_CITATION_CHUNKS,
  STREAMED_MARKDOWN,
  STREAMING_REPLY,
  type StoryToolCallDisplayMode,
  storyEscalationSpan,
  storyFailedToolCallMeta,
  storyHistoryArchive,
  storyHistoryBuckets,
  storyHistoryPage,
  storyInputsAndOutputsMeta,
  storyToolCallMeta,
  storyTreeSpan,
  WIND_RESPONSE_ACTIONS,
  withResourceIcons,
} from './chat-story-fixtures';

export interface ScenarioContext {
  service: AutopilotChatService;
  /** The renderer this chat uses, for payloads whose icons differ per renderer. */
  renderer: AutopilotChatRenderer;
  /** Delay between streamed chunks and scripted turns. */
  delayMs: number;
  /** Sends a user turn that neither triggers the auto reply nor is mirrored to the other chat. */
  sendScriptedRequest: (request: {
    content: string;
    attachments?: AutopilotChatFileInfo[];
  }) => void;
  /** `setTimeout` that is cancelled when the scenario changes or the story unmounts. */
  schedule: (run: () => void, delayMs: number) => void;
  onCleanup: (cleanup: () => void) => void;
  log: (event: string, data?: unknown) => void;
}

export interface ChatStoryScenario {
  label: string;
  description: string;
  /** Starts a new chat first; only for scenarios that need an empty transcript. */
  emptyTranscript?: boolean;
  run: (context: ScenarioContext) => void;
}

type Response = Parameters<AutopilotChatService['sendResponse']>[0];

/**
 * `patchConfig` re-runs `initialize`, which re-applies the initial theme, locale, model and agent
 * mode; pass the current ones so a config patch does not reset what the user picked.
 */
export function patchConfigInPlace(
  service: AutopilotChatService,
  config: Partial<AutopilotChatConfiguration>
) {
  service.patchConfig({
    theme: service.getTheme() as ApChatTheme,
    locale: service.getLocale() as SupportedLocale,
    selectedModel: service.getSelectedModel(),
    selectedAgentMode: service.getAgentMode(),
    ...config,
  });
}

const respond = (service: AutopilotChatService, response: Partial<Response>) =>
  service.sendResponse({
    widget: DEFAULT_MESSAGE_RENDERER,
    created_at: new Date().toISOString(),
    ...response,
  });

/** Streams `chunks` into one assistant message, one chunk per `delayMs`. */
export function streamChunks(
  context: ScenarioContext,
  chunks: Array<string | ContentPartChunk>,
  startAfterMs = 0
) {
  const id = `stream-${crypto.randomUUID()}`;

  chunks.forEach((chunk, index) => {
    context.schedule(
      () =>
        respond(context.service, {
          id,
          stream: true,
          done: index === chunks.length - 1,
          ...(typeof chunk === 'string' ? { content: chunk } : { contentPartChunk: chunk }),
        }),
      startAfterMs + index * context.delayMs
    );
  });

  return startAfterMs + chunks.length * context.delayMs;
}

/** Splits text into word chunks that keep their trailing space, for streaming. */
export const splitWords = (text: string) => text.split(/(?<= )/);

const STORY_ATTACHMENTS: AutopilotChatFileInfo[] = [
  {
    name: 'invoices-week-27.pdf',
    type: 'application/pdf',
    size: 182_400,
    lastModified: Date.now(),
    content: { text: null, binary: null, base64: null },
  },
  {
    name: 'vendors.csv',
    type: 'text/csv',
    size: 2_048,
    lastModified: Date.now(),
    content: { text: 'vendor,amount\nAcme,1240', binary: null, base64: null },
  },
];

const TOOL_CALL_MODES: StoryToolCallDisplayMode[] = [
  'ToolNameOnly',
  'InputsAndOutputs',
  'FullTrace',
];

const STORY_SUGGESTIONS = [
  { label: 'Show the overdue ones', prompt: 'Which of these invoices are overdue?' },
  { label: 'Draft a reminder', prompt: 'Draft a payment reminder for the overdue vendors.' },
  { label: 'Export to Excel', prompt: 'Export the invoice list to an Excel file.' },
];

function runSuggestions(context: ScenarioContext, sendOnClick: boolean) {
  context.sendScriptedRequest({ content: 'Which invoices came in this week?' });
  context.schedule(() => {
    respond(context.service, { content: 'Twelve invoices came in this week, from five vendors.' });
    context.service.setSuggestions(STORY_SUGGESTIONS, sendOnClick);
  }, context.delayMs);
  context.onCleanup(() => context.service.setSuggestions([]));
}

export const CHAT_STORY_SCENARIOS = {
  none: {
    label: 'None',
    description: 'No scripted traffic.',
    run: () => {},
  },
  'first-run': {
    label: 'First-run experience',
    description:
      'Starts a new chat so the first-run experience shows (the firstRunExperience arg must be on). FullScreen centers it around the composer, with the suggestions in a row under the welcome text; Embedded docks it above the composer. Picking a suggestion fills the composer. Sending a message switches to the transcript; the composer stays in place, though sending clears the draft as it always does.',
    emptyTranscript: true,
    run: () => {},
  },
  suggestions: {
    label: 'Suggestions',
    description:
      'Appends a turn and a reply, then sets suggestions under the reply (setSuggestions without sendOnClick): picking one fills the composer. A message after them leaves them behind in Wind.',
    run: (context) => runSuggestions(context, false),
  },
  'suggestions-send': {
    label: 'Suggestions that send',
    description:
      'As Suggestions, with sendOnClick: picking one sends it at once. Sending any message clears them (the service clears suggestions on every request).',
    run: (context) => runSuggestions(context, true),
  },
  conversation: {
    label: 'Short conversation',
    description: 'Appends one user turn and one assistant reply.',
    run: (context) => {
      const [question, answer] = SAMPLE_CONVERSATION as [
        AutopilotChatMessage,
        AutopilotChatMessage,
      ];
      context.sendScriptedRequest({ content: question.content });
      context.schedule(
        () => respond(context.service, { content: answer.content }),
        context.delayMs
      );
    },
  },
  streaming: {
    label: 'Streaming reply',
    description: 'Appends a user turn, then streams the reply word by word.',
    run: (context) => {
      context.sendScriptedRequest({ content: 'Stream me a reply, please.' });
      streamChunks(context, splitWords(STREAMING_REPLY), context.delayMs);
    },
  },
  'long-history': {
    label: 'Long history with pagination',
    description:
      'Starts a new chat with paginatedMessages on and the latest page loaded. Scrolling to the top publishes ConversationLoadMore, answered with three older pages.',
    emptyTranscript: true,
    run: (context) => {
      const { service } = context;
      let page = 1;
      patchConfigInPlace(service, { paginatedMessages: true });
      service.setConversation(storyHistoryPage(0));
      const unsubscribe = service.on(AutopilotChatEvent.ConversationLoadMore, () => {
        const current = page++;
        context.schedule(
          () => service.prependOlderMessages(storyHistoryPage(current), current >= 3),
          600
        );
      });
      context.onCleanup(() => {
        unsubscribe();
        patchConfigInPlace(service, { paginatedMessages: false });
      });
    },
  },
  history: {
    label: 'Chat history',
    description:
      'Loads conversations in every date bucket (setHistory) and opens the history (toggleHistory). Search filters the names as you type. Opening a conversation loads a transcript after 400 ms; rename (turn disableRenameChat off) and delete update the list, as a host does on RenameConversation and DeleteConversation. With preHooks on, rename and delete ask first.',
    run: (context) => {
      const { service } = context;
      service.setHistory(storyHistoryBuckets());
      service.toggleHistory(true);
      context.onCleanup(() => service.toggleHistory(false));
    },
  },
  'history-paginated': {
    label: 'Paginated chat history',
    description: `Turns paginatedHistory on, loads the first ${STORY_HISTORY_PAGE_SIZE} of 40 conversations and opens the history. Scrolling to the end publishes HistoryLoadMore, answered after 600 ms with the next page (appendOlderHistoryItems, done on the last one). Typing publishes HistorySearch after a pause, answered after 600 ms with the first page of matches (setHistory). Changing scenario restores the default history.`,
    run: (context) => {
      const { service } = context;
      const archive = storyHistoryArchive();
      let query = '';
      let loaded = STORY_HISTORY_PAGE_SIZE;
      const matches = () =>
        archive.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));

      patchConfigInPlace(service, { paginatedHistory: true });
      service.setHistory(archive.slice(0, STORY_HISTORY_PAGE_SIZE), false);
      const unsubscribeLoadMore = service.on(AutopilotChatEvent.HistoryLoadMore, () =>
        context.schedule(() => {
          const all = matches();
          const page = all.slice(loaded, loaded + STORY_HISTORY_PAGE_SIZE);
          loaded += STORY_HISTORY_PAGE_SIZE;
          service.appendOlderHistoryItems(page, loaded >= all.length);
        }, 600)
      );
      const unsubscribeSearch = service.on(
        AutopilotChatEvent.HistorySearch,
        ({ searchText }: AutopilotChatHistorySearchPayload) => {
          query = searchText;
          loaded = STORY_HISTORY_PAGE_SIZE;
          context.schedule(() => {
            const all = matches();
            service.setHistory(
              all.slice(0, STORY_HISTORY_PAGE_SIZE),
              STORY_HISTORY_PAGE_SIZE >= all.length
            );
          }, 600);
        }
      );
      service.toggleHistory(true);
      context.onCleanup(() => {
        unsubscribeLoadMore();
        unsubscribeSearch();
        service.toggleHistory(false);
        patchConfigInPlace(service, { paginatedHistory: false });
        service.setHistory(storyHistoryBuckets());
      });
    },
  },
  settings: {
    label: 'Settings',
    description:
      "Enables settings (they are disabled by default, as in the service) and opens them (toggleSettings). The playground's settingsRenderer mounts a React root into the container, as CAS does: the container is emptied on close and handed to the renderer again on each opening, which the page counts. Changing scenario closes them and restores disableSettings.",
    run: (context) => {
      const { service } = context;
      const disabled = service.getConfig().disabledFeatures?.settings;
      service.setDisabledFeatures({ settings: false });
      service.toggleSettings(true);
      context.onCleanup(() => {
        service.toggleSettings(false);
        service.setDisabledFeatures({ settings: disabled });
      });
    },
  },
  citations: {
    label: 'Citations',
    description:
      'Appends a reply with URL citations, a reply with PDF citations (page numbers, a range spanning bold text, more sources than the collapsed list shows), then a streamed reply with citations. Hover a citation to highlight what it supports; clicking runs the citation-click pre-hook.',
    run: (context) => {
      context.sendScriptedRequest({ content: 'Why is the sky blue? And tell me about UiPath.' });
      context.schedule(() => respond(context.service, CITATION_RESPONSE), context.delayMs);
      context.schedule(() => respond(context.service, PDF_CITATION_RESPONSE), context.delayMs * 2);
      streamChunks(context, STREAMED_CITATION_CHUNKS, context.delayMs * 4);
    },
  },
  markdown: {
    label: 'Markdown corpus',
    description:
      'Appends a reply covering headings, lists, task lists, tables with line breaks, quotes, math, images (shown as links) and footnotes, then streams a shorter reply so partial markdown is seen mid-stream, including a math fence and a display block that show as code until they close.',
    run: (context) => {
      context.sendScriptedRequest({ content: 'Show me every markdown feature.' });
      context.schedule(
        () => respond(context.service, { content: MARKDOWN_CORPUS }),
        context.delayMs
      );
      streamChunks(context, splitWords(STREAMED_MARKDOWN), context.delayMs * 3);
    },
  },
  code: {
    label: 'Code and HTML preview',
    description:
      'Appends a long TypeScript block, blocks in other languages with inline code, then streams an HTML block. HTML preview is off by default (disabledFeatures.htmlPreview); turn off the disableHtmlPreview control, or use the HTML preview story, to get a Preview toggle that renders a complete HTML block in place; the Wind chat shows the source until it is clicked, Material previews by itself. The toggle stays disabled while the block streams.',
    run: (context) => {
      context.sendScriptedRequest({ content: 'Show me some code.' });
      context.schedule(
        () => respond(context.service, { content: CODE_BLOCK_MESSAGE }),
        context.delayMs
      );
      context.schedule(
        () => respond(context.service, { content: CODE_LANGUAGES_MESSAGE }),
        context.delayMs * 2
      );
      streamChunks(context, HTML_PREVIEW_MESSAGE.split(/(?<=\n)/), context.delayMs * 3);
    },
  },
  'resource-tokens': {
    label: 'Resource tokens',
    description:
      'Appends a reply with resource tokens and one with tokens in a list, then streams tokens split across chunks, which are held back until complete.',
    run: (context) => {
      const icons = (text: string) => withResourceIcons(text, context.renderer);
      context.sendScriptedRequest({ content: 'Which variables will you touch?' });
      context.schedule(
        () => respond(context.service, { content: icons(RESOURCE_TOKEN_MESSAGE) }),
        context.delayMs
      );
      context.schedule(
        () => respond(context.service, { content: icons(RESOURCE_TOKEN_LIST_MESSAGE) }),
        context.delayMs * 2
      );
      streamChunks(context, RESOURCE_TOKEN_CHUNKS.map(icons), context.delayMs * 4);
    },
  },
  'tool-call': {
    label: 'Tool calls',
    description:
      'Appends one tool call per display mode (tool name only, inputs and outputs, full trace), then a call that runs and finishes under the same id (an expanded body stays open), a failed call, and a trace waiting on escalation task links, which opens by itself.',
    run: (context) => {
      const { service, delayMs } = context;
      const toolCall = (meta: object, id?: string) =>
        respond(service, {
          ...(id ? { id } : {}),
          content: 'Tool call response',
          widget: AGENTS_TOOL_CALL_RENDERER,
          meta,
        });
      context.sendScriptedRequest({ content: 'Search the web for me.' });
      TOOL_CALL_MODES.forEach((displayMode, index) => {
        context.schedule(() => toolCall(storyToolCallMeta(displayMode)), delayMs * (index + 1));
      });

      // Starts when it is sent and finishes 3s later, so the line reads about 3 seconds.
      const runningId = `tool-call-${crypto.randomUUID()}`;
      let runningMeta: ReturnType<typeof storyInputsAndOutputsMeta> | undefined;
      context.schedule(() => {
        runningMeta = {
          ...storyInputsAndOutputsMeta(),
          startTime: new Date().toISOString(),
        };
        const { output: _output, isError: _isError, endTime: _endTime, ...running } = runningMeta;
        toolCall(running, runningId);
      }, delayMs * 4);
      context.schedule(
        () => toolCall({ ...runningMeta, endTime: new Date().toISOString() }, runningId),
        delayMs * 4 + 3000
      );
      context.schedule(() => toolCall(storyFailedToolCallMeta()), delayMs * 5);
      context.schedule(
        () => toolCall({ displayMode: 'FullTrace', span: storyEscalationSpan() }),
        delayMs * 6
      );
    },
  },
  tree: {
    label: 'Tree message',
    description:
      'Appends a trace rendered as a tree. Spans with a description show it as a tooltip; spans without one show none.',
    run: (context) => {
      context.sendScriptedRequest({ content: 'Show me the agent trace.' });
      context.schedule(
        () =>
          respond(context.service, {
            content: 'Trace',
            widget: APOLLO_CHAT_TREE_RENDERER,
            meta: { span: storyTreeSpan() },
          }),
        context.delayMs
      );
    },
  },
  attachments: {
    label: 'Attachments',
    description:
      'Appends a user turn with two attached files and a reply, then puts a draft with an attachment in the composer (setPrompt). Attach more with the button, by dropping files on the panel or by pasting them; the default limits allow common document and image types up to the configured size and count. Clear chat or a scenario change clears the draft text, but not the attachment chip: the service has no call that removes a draft attachment, so remove it with its button.',
    run: (context) => {
      context.sendScriptedRequest({
        content: "Here's the invoice batch for this week. Which ones are ready?",
        attachments: STORY_ATTACHMENTS,
      });
      context.schedule(
        () =>
          respond(context.service, {
            content: 'Two of the three invoices are ready for approval.',
          }),
        context.delayMs
      );
      context.schedule(
        () =>
          context.service.setPrompt({
            content: 'Which vendors are in this file?',
            attachments: STORY_ATTACHMENTS.slice(1),
          }),
        context.delayMs * 2
      );
      context.onCleanup(() => context.service.setPrompt(''));
    },
  },
  actions: {
    label: 'Message actions',
    description:
      'Appends a reply with custom actions (logged as copy-custom and regenerate-custom), one more in the "More" menu (share-custom), and a reply with actions disabled.',
    run: (context) => {
      const { service } = context;
      const unsubscribes = [...RESPONSE_ACTIONS, overflowResponseAction('wind')].map((action) =>
        service.on(action.eventName as AutopilotChatEvent, (data) =>
          context.log(action.eventName ?? '', data)
        )
      );
      context.onCleanup(() => {
        for (const unsubscribe of unsubscribes) unsubscribe();
      });
      respond(service, {
        content: 'Here is a response with custom actions. Try the buttons below!',
        actions: [
          ...(context.renderer === 'wind' ? WIND_RESPONSE_ACTIONS : RESPONSE_ACTIONS),
          overflowResponseAction(context.renderer),
        ],
      });
      context.schedule(
        () => respond(service, { content: 'Message with no actions', disableActions: true }),
        context.delayMs
      );
    },
  },
  loading: {
    label: 'Loading message',
    description:
      'Appends a user turn; the thinking state rotates the default loading messages (setDefaultLoadingMessages) for four seconds, then shows a custom one (setLoadingMessage) for four more, and disappears when the streamed reply arrives.',
    run: (context) => {
      const { service } = context;
      context.sendScriptedRequest({ content: 'Take your time.' });
      context.schedule(() => service.setLoadingMessage('Searching the knowledge base...'), 4000);
      context.onCleanup(() => service.setLoadingMessage(''));
      streamChunks(context, splitWords('Found it: three invoices match.'), 8000);
    },
  },
  error: {
    label: 'Error',
    description:
      'Shows a chat error (markdown supported) above the composer until it is dismissed or the scenario changes.',
    run: (context) => {
      context.service.setError('An error occurred. **Please try again.**');
      context.onCleanup(() => context.service.clearError());
    },
  },
  warning: {
    label: 'Warning',
    description:
      'Shows a chat warning above the composer until it is dismissed or the scenario changes.',
    run: (context) => {
      context.service.setError('This is a warning message.', 'warn');
      context.onCleanup(() => context.service.clearError());
    },
  },
} satisfies Record<string, ChatStoryScenario>;

export type ChatStoryScenarioId = keyof typeof CHAT_STORY_SCENARIOS;
