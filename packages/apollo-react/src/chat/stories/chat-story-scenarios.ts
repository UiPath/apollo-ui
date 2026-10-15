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
  STREAMED_CITATION_CHUNKS,
  STREAMED_MARKDOWN,
  STREAMING_REPLY,
  type StoryToolCallDisplayMode,
  storyHistoryPage,
  storyToolCallMeta,
  storyTraceSpan,
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

export const CHAT_STORY_SCENARIOS = {
  none: {
    label: 'None',
    description: 'No scripted traffic.',
    run: () => {},
  },
  'first-run': {
    label: 'First-run experience',
    description:
      'Starts a new chat so the first-run experience shows (turn on the firstRunExperience arg).',
    emptyTranscript: true,
    run: () => {},
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
      'Appends a reply covering headings, lists, task lists, tables with line breaks, quotes, math, images (shown as links) and footnotes, then streams a shorter reply so partial markdown is seen mid-stream.',
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
      'Appends a long TypeScript block, blocks in other languages with inline code, then streams an HTML block. HTML preview is off by default (disabledFeatures.htmlPreview); turn off the disableHtmlPreview control, or use the HTML preview story, to get the preview action. It stays disabled while the block streams.',
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
      'Appends one tool call per display mode: tool name only, inputs and outputs, full trace.',
    run: (context) => {
      context.sendScriptedRequest({ content: 'Search the web for me.' });
      TOOL_CALL_MODES.forEach((displayMode, index) => {
        context.schedule(
          () =>
            respond(context.service, {
              content: 'Tool call response',
              widget: AGENTS_TOOL_CALL_RENDERER,
              meta: storyToolCallMeta(displayMode),
            }),
          context.delayMs * (index + 1)
        );
      });
    },
  },
  tree: {
    label: 'Tree message',
    description: 'Appends a trace rendered as a tree.',
    run: (context) => {
      context.sendScriptedRequest({ content: 'Show me the agent trace.' });
      context.schedule(
        () =>
          respond(context.service, {
            content: 'Trace',
            widget: APOLLO_CHAT_TREE_RENDERER,
            meta: { span: storyTraceSpan() },
          }),
        context.delayMs
      );
    },
  },
  attachments: {
    label: 'Attachments',
    description: 'Appends a user turn with two attached files and a reply.',
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
      'Appends a user turn and shows a loading message for four seconds before replying.',
    run: (context) => {
      const { service } = context;
      context.sendScriptedRequest({ content: 'Take your time.' });
      service.setLoadingMessage('Searching the knowledge base...');
      context.onCleanup(() => service.setLoadingMessage(''));
      context.schedule(() => {
        service.setLoadingMessage('');
        respond(service, { content: 'Found it.' });
      }, 4000);
    },
  },
  error: {
    label: 'Error',
    description: 'Shows a chat error (markdown supported) until the scenario changes.',
    run: (context) => {
      context.service.setError('An error occurred. **Please try again.**');
      context.onCleanup(() => context.service.clearError());
    },
  },
  warning: {
    label: 'Warning',
    description: 'Shows a chat warning until the scenario changes.',
    run: (context) => {
      context.service.setError('This is a warning message.', 'warn');
      context.onCleanup(() => context.service.clearError());
    },
  },
} satisfies Record<string, ChatStoryScenario>;

export type ChatStoryScenarioId = keyof typeof CHAT_STORY_SCENARIOS;
