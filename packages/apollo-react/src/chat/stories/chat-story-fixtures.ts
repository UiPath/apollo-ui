/**
 * Data shared by the chat Storybook stories (the Apollo React/Chat playground and the Material
 * showcase): sample configuration, scripted payloads and mock integrations. MUI-free, so both
 * renderers' stories can use it.
 */
import type { SupportedLocale } from '../../i18n';
import {
  type ApChatTheme,
  type AutopilotChatAgentModeInfo,
  type AutopilotChatCustomHeaderAction,
  type AutopilotChatHistory,
  type AutopilotChatMessage,
  type AutopilotChatMessageAction,
  type AutopilotChatModelInfo,
  type AutopilotChatResourceItem,
  type AutopilotChatResourceManager,
  AutopilotChatRole,
  type AutopilotChatSuggestion,
  type ContentPartChunk,
} from '../service';

/* ------------------------------------------------------------------ */
/* Locale and theme                                                   */
/* ------------------------------------------------------------------ */

export const CHAT_LOCALES: SupportedLocale[] = [
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

/**
 * Maps the Storybook global theme to the closest chat theme. The classic and future themes pass
 * through; of the demo themes, wireframe falls back to light and the rest (vertex, canvas) to dark.
 */
export function mapToChatTheme(globalTheme: unknown): ApChatTheme {
  switch (globalTheme) {
    case 'light':
      return 'light';
    case 'future-light':
      return 'future-light';
    case 'light-hc':
      return 'light-hc';
    case 'dark':
      return 'dark';
    case 'dark-hc':
      return 'dark-hc';
    case 'future-dark':
      return 'future-dark';
    case 'wireframe':
      return 'light';
    default:
      return 'dark';
  }
}

/* ------------------------------------------------------------------ */
/* Configuration                                                      */
/* ------------------------------------------------------------------ */

export const STORY_MODELS: AutopilotChatModelInfo[] = [
  { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
  { id: 'gpt-3.5', name: 'GPT-3.5 Turbo', description: 'Fast and efficient' },
  { id: 'claude-3', name: 'Claude 3', description: 'Anthropic model' },
];

export const STORY_AGENT_MODES: AutopilotChatAgentModeInfo[] = [
  {
    id: 'agent',
    name: 'Agent',
    description: 'AI-powered autonomous agent mode',
    icon: 'smart_toy',
  },
  { id: 'plan', name: 'Plan', description: 'Create and review execution plans', icon: 'edit_note' },
  { id: 'attended', name: 'Attended', description: 'Human assisted execution', icon: 'play_arrow' },
];

/** The flat set the Material showcase starts with. */
export const BASIC_CUSTOM_HEADER_ACTIONS: AutopilotChatCustomHeaderAction[] = [
  { id: 'export', name: 'Export Chat', icon: 'download' },
  { id: 'share', name: 'Share', icon: 'share' },
];

/**
 * Nested custom header actions for the Material renderer, whose `icon` values are Material Icons
 * names.
 */
export const MATERIAL_CUSTOM_HEADER_ACTIONS: AutopilotChatCustomHeaderAction[] = [
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
      { id: 'translate-fr', name: 'French', icon: 'language', description: 'Translate to French' },
      { id: 'translate-de', name: 'German', icon: 'language', description: 'Translate to German' },
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
  { id: 'print', name: 'Print', icon: 'print', description: 'Print conversation' },
  {
    id: 'advanced',
    name: 'Advanced Settings',
    icon: 'tune',
    description: 'Advanced configuration options',
    disabled: true,
  },
];

// Lucide names for the Wind renderer; both spellings are accepted, so the set uses each.
const LUCIDE_FOR_MATERIAL_ICON: Record<string, string> = {
  download: 'download',
  picture_as_pdf: 'file-text',
  description: 'FileType',
  data_object: 'braces',
  text_snippet: 'file-text',
  share: 'share-2',
  translate: 'languages',
  language: 'globe',
  print: 'Printer',
  tune: 'sliders-horizontal',
};

const withLucideIcons = (
  actions: AutopilotChatCustomHeaderAction[]
): AutopilotChatCustomHeaderAction[] =>
  actions.map(({ icon, children, ...action }) => ({
    ...action,
    ...(icon && { icon: LUCIDE_FOR_MATERIAL_ICON[icon] }),
    ...(children && {
      children: children.map(({ icon: childIcon, ...child }) => ({
        ...child,
        ...(childIcon && { icon: LUCIDE_FOR_MATERIAL_ICON[childIcon] }),
      })),
    }),
  }));

/**
 * The same actions for the Wind renderer, which takes lucide icon names (kebab-case or the
 * PascalCase export name) where Material takes Material Icons names.
 */
export const WIND_CUSTOM_HEADER_ACTIONS = withLucideIcons(MATERIAL_CUSTOM_HEADER_ACTIONS);

/** Reply the stories send when a custom header action is clicked. */
export function customHeaderActionReply(action: AutopilotChatCustomHeaderAction): string {
  switch (action.id) {
    case 'export-pdf':
      return '📄 **Exporting as PDF...**\n\nYour conversation has been exported to a PDF file.';
    case 'export-docx':
      return '📝 **Exporting as DOCX...**\n\nYour conversation has been exported to a Word document.';
    case 'export-json':
      return '💾 **Exporting as JSON...**\n\nYour conversation has been exported as JSON data.';
    case 'export-txt':
      return '📋 **Exporting as Text...**\n\nYour conversation has been exported as plain text.';
    case 'share':
      return '🔗 **Share Conversation**\n\nA shareable link has been generated:\n`https://example.com/chat/abc123`';
    case 'translate-es':
      return '🇪🇸 **Traduciendo al español...**\n\nSu conversación ha sido traducida al español.';
    case 'translate-fr':
      return '🇫🇷 **Traduction en français...**\n\nVotre conversation a été traduite en français.';
    case 'translate-de':
      return '🇩🇪 **Übersetzung ins Deutsche...**\n\nIhre Unterhaltung wurde ins Deutsche übersetzt.';
    case 'translate-ja':
      return '🇯🇵 **日本語に翻訳中...**\n\n会話が日本語に翻訳されました。';
    case 'translate-zh':
      return '🇨🇳 **正在翻译成中文...**\n\n您的对话已翻译成中文。';
    case 'print':
      return '🖨️ **Print Conversation**\n\nPreparing conversation for printing...';
    default:
      return `✅ Action triggered: **${action.name}** (ID: ${action.id})`;
  }
}

export const STORY_SUGGESTIONS: AutopilotChatSuggestion[] = [
  { label: 'What can you do?', prompt: 'What can you do?' },
  { label: 'Show me an example', prompt: 'Show me an example' },
  { label: 'Help me with code', prompt: 'Help me with code' },
];

export const STORY_LOADING_MESSAGES = [
  'Thinking...',
  'Processing your request...',
  'Analyzing...',
  'Working on it...',
];

export const STORY_FIRST_RUN_EXPERIENCE = {
  title: 'Welcome to UiPath Autopilot',
  description: "I'm here to help you build, understand, and troubleshoot your automation projects.",
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
    { label: 'Studio updates', prompt: 'What are the latest features in UiPath Studio?' },
  ],
};

export function storyHistoryItems(now = Date.now()): AutopilotChatHistory[] {
  return [
    { id: '1', name: 'Previous Conversation 1', timestamp: new Date(now - 86400000).toISOString() },
    {
      id: '2',
      name: 'Previous Conversation 2',
      timestamp: new Date(now - 172800000).toISOString(),
    },
    {
      id: '3',
      name: 'Previous Conversation 3',
      timestamp: new Date(now - 259200000).toISOString(),
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Messages and payloads                                              */
/* ------------------------------------------------------------------ */

export const SAMPLE_CONVERSATION: AutopilotChatMessage[] = [
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
];

export const STREAMING_REPLY =
  'Here is a streamed reply. It arrives **word by word**, the way a model response does, so you can watch the renderer follow the stream.\n\n- First point\n- Second point\n\nDone.';

export const CODE_BLOCK_MESSAGE = `Here's a TypeScript example with long lines to test wrapping:

\`\`\`typescript
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

export const HTML_PREVIEW_MESSAGE = `Here's an HTML example with live preview:

\`\`\`html
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

export const MARKDOWN_CORPUS = `# Heading 1
## Heading 2
### Heading 3

A paragraph with **bold**, _italic_, ~~strikethrough~~, \`inline code\` and a [link](https://www.uipath.com).

> A blockquote that spans a couple of lines to check wrapping and the quote rule.

1. Ordered item
2. Another item
   - Nested bullet
   - Another nested bullet

| Column | Value |
| --- | --- |
| Robots | 12 |
| Queues | 3 |

Inline math such as $$E = mc^2$$ and a block:

$$
\\int_0^1 x^2 \\, dx = \\frac{1}{3}
$$

![An image stays a link](https://www.uipath.com/favicon.ico)

---

- [x] A finished task
- [ ] An open task

| Step | Owner | Notes |
| --- | --- | --- |
| Extract | Robot | Reads the invoice<br>and the vendor record |
| Approve | Finance | Over $5,000 needs a manager, and a single dollar sign stays literal |

> A quote with a nested list:
> - first
> - second

Footnote reference[^1].

[^1]: The footnote text.`;

/** Replies the markdown scenario streams, so incomplete markdown is seen mid-stream. */
export const STREAMED_MARKDOWN = `### Streamed summary

1. **Open** the queue and check the _oldest_ item.
2. Retry it with \`Invoke Workflow\`.

| Queue | Pending |
| --- | --- |
| Invoices | 12 |

\`\`\`json
{ "queue": "Invoices", "retry": true }
\`\`\`

Done.`;

/** Several languages, inline code and a plain block, for code block chrome. */
export const CODE_LANGUAGES_MESSAGE = `Inline \`code\` sits in the sentence. A few blocks:

\`\`\`python
def retry(item, attempts=3):
    return any(run(item) for _ in range(attempts))
\`\`\`

\`\`\`bash
uip robot start --queue Invoices
\`\`\`

\`\`\`
A block with no language.
\`\`\``;

export const RESPONSE_ACTIONS: AutopilotChatMessageAction[] = [
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
];

/** The same actions with lucide icon names, for the Wind renderer. */
export const WIND_RESPONSE_ACTIONS: AutopilotChatMessageAction[] = RESPONSE_ACTIONS.map(
  (action) => ({
    ...action,
    icon: action.icon === 'content_copy' ? 'clipboard-copy' : 'refresh-cw',
  })
);

/** An action for the "More" menu, with the icon name each renderer takes. */
export function overflowResponseAction(renderer: 'wind' | 'material'): AutopilotChatMessageAction {
  return {
    name: 'share-action',
    label: 'Share',
    icon: renderer === 'wind' ? 'share-2' : 'share',
    eventName: 'share-custom',
    showInOverflow: true,
  };
}

export const CITATION_RESPONSE = {
  content:
    'According to research, the sky is blue due to Rayleigh scattering. See references below for more information.',
  widget: 'default',
  contentParts: [
    {
      text: 'According to research, the sky is blue due to Rayleigh scattering. ',
      citations: [{ id: 1, title: 'Why is the Sky Blue?', url: 'https://example.com/sky' }],
    },
    {
      text: 'See references below for more information.',
      citations: [{ id: 2, title: 'Atmospheric Science', url: 'https://example.com/atmosphere' }],
    },
  ],
} satisfies Partial<AutopilotChatMessage>;

/** PDF and URL sources, more than fit the collapsed list, and a range spanning formatting. */
export const PDF_CITATION_RESPONSE = {
  widget: 'default',
  contentParts: [
    { text: 'Invoices over $5,000 need ' },
    {
      text: 'a **finance manager** to approve them',
      citations: [
        {
          id: 1,
          title: 'Approval Policy',
          download_url: 'https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf',
          page_number: 4,
        },
      ],
    },
    { text: ', and ' },
    {
      text: 'every approval is logged with a reason',
      citations: [
        { id: 2, title: 'Audit Requirements', url: 'https://example.com/audit' },
        { id: 3, title: 'Finance Handbook', url: 'https://example.com/handbook' },
      ],
    },
    { text: '. ' },
    {
      text: 'Rejected invoices go back to the vendor.',
      citations: [
        {
          id: 4,
          title: 'Vendor Guide',
          download_url: 'https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf',
          page_number: 9,
        },
      ],
    },
  ],
} satisfies Partial<AutopilotChatMessage>;

/** Streamed with `contentPartChunk`, one entry per chunk. */
export const STREAMED_CITATION_CHUNKS: ContentPartChunk[] = [
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
    citation: { id: 1, title: 'UiPath - Wikipedia', url: 'https://en.wikipedia.org/wiki/UiPath' },
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
    citation: { id: 1, title: 'UiPath - Wikipedia', url: 'https://en.wikipedia.org/wiki/UiPath' },
  },
  {
    index: 3,
    text: '',
    citation: { id: 2, title: 'UiPath, Inc. (PATH)', url: 'https://ir.uipath.com/' },
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

export const RESOURCE_TOKEN_MESSAGE = `I will update [[resource-token:{"id":"var-email","type":"variable","icon":"mail","displayName":"email"}]] and [[resource-token:{"id":"var-long","type":"variable","icon":"data_object","displayName":"this_is_a_very_long_variable_name_that_should_test_truncation"}]] in the system, then notify [[resource-token:{"id":"var-username","type":"variable","icon":"person","displayName":"username"}]] when complete.`;

/** Tokens inside a list, for chips in block content. */
export const RESOURCE_TOKEN_LIST_MESSAGE = `Inputs for the run:

- [[resource-token:{"id":"q-invoices","type":"queue","icon":"inbox","displayName":"Invoices"}]] queue
- [[resource-token:{"id":"b-archive","type":"bucket","icon":"folder","displayName":"Archive"}]] bucket`;

// Resource icons are Material Icons names; the Wind renderer takes lucide names.
const WIND_RESOURCE_ICONS: Record<string, string> = {
  data_object: 'braces',
  description: 'file-text',
  folder: 'folder',
  inbox: 'inbox',
  mail: 'mail',
  person: 'user',
};

/** `text` with its resource token icons named for `renderer`. */
export function withResourceIcons(text: string, renderer: 'wind' | 'material') {
  return renderer === 'wind'
    ? text.replace(/"icon":"(\w+)"/g, (match, icon: string) =>
        WIND_RESOURCE_ICONS[icon] ? `"icon":"${WIND_RESOURCE_ICONS[icon]}"` : match
      )
    : text;
}

/** Streamed with `content` chunks; tokens split across chunks exercise incomplete-token buffering. */
export const RESOURCE_TOKEN_CHUNKS = [
  'I will update the ',
  '[[resource-token:',
  '{"id":"var-',
  'email","type":"variable",',
  '"icon":"mail","displayName":"email"}]]',
  ' variable in the system.\n\n',
  "Then I'll notify ",
  '[[resource-token:{',
  '"id":"var-username",',
  '"type":"variable","icon":"person",',
  '"displayName":"username"}]]',
  ' when the process is complete.\n\n',
  "I'll also update ",
  '[[resource-token:{',
  '"id":"var-long","type":"variable",',
  '"icon":"data_object","displayName":',
  '"this_is_a_very_long_variable_name_that_should_test_truncation"}]]',
  ' for testing.\n\n',
  "Finally, I'll log the result to ",
  '[[resource-token:{"id":"var-log","type":"variable","icon":"description","displayName":"activity_log"}]]',
  '.',
];

export type StoryToolCallDisplayMode = 'FullTrace' | 'InputsAndOutputs' | 'ToolNameOnly';

/** A nested agent trace, used by the FullTrace tool call and the tree message. */
export function storyTraceSpan(now = Date.now()) {
  const end = new Date(now).toISOString();

  return {
    key: 'multi-web-search',
    name: 'Tool call - Multi_Web_Search',
    data: {
      id: 'root-span',
      name: 'Tool call - Multi_Web_Search',
      startTime: new Date(now - 25000).toISOString(),
      endTime: end,
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
          startTime: new Date(now - 25000).toISOString(),
          endTime: end,
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
              startTime: new Date(now - 23000).toISOString(),
              endTime: end,
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
                  startTime: new Date(now - 21000).toISOString(),
                  endTime: new Date(now - 17000).toISOString(),
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
                  startTime: new Date(now - 16000).toISOString(),
                  endTime: new Date(now - 10000).toISOString(),
                },
                children: [],
              },
            ],
          },
        ],
      },
    ],
  };
}

/** `meta` for an `apollo-agents-tool-call` message. */
export function storyToolCallMeta(displayMode: StoryToolCallDisplayMode, now = Date.now()) {
  if (displayMode === 'FullTrace') {
    return { displayMode, span: storyTraceSpan(now) };
  }

  return {
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
    startTime: new Date(now - 2500).toISOString(),
    endTime: new Date(now).toISOString(),
    toolName: 'Web_Search',
  };
}

/** Older pages for the paginated history scenario, newest last. */
export function storyHistoryPage(page: number, pageSize = 6): AutopilotChatMessage[] {
  return Array.from({ length: pageSize }, (_, i) => {
    const n = page * pageSize + (pageSize - i);
    const role = n % 2 === 0 ? AutopilotChatRole.Assistant : AutopilotChatRole.User;

    return {
      id: `history-${n}`,
      role,
      content:
        role === AutopilotChatRole.User
          ? `Question ${n}: what happened in run ${n}?`
          : `Answer ${n}: run ${n} finished in ${(n % 7) + 1} minutes with no faulted jobs.`,
      created_at: new Date(Date.now() - n * 60000).toISOString(),
      widget: 'apollo-markdown-renderer',
    };
  }).reverse();
}

/* ------------------------------------------------------------------ */
/* Mock integrations                                                  */
/* ------------------------------------------------------------------ */

export interface StoryResourceManagerOptions {
  paginationEnabled?: boolean;
  pageSize?: number;
}

/** In-memory resource manager with variables and files, optionally paginated. */
export function createStoryResourceManager({
  paginationEnabled = true,
  pageSize = 10,
}: StoryResourceManagerOptions = {}): AutopilotChatResourceManager {
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

  const fileIcons = ['description', 'table_chart', 'picture_as_pdf', 'image', 'code', 'folder'];
  const fileExtensions = ['.json', '.csv', '.pdf', '.png', '.ts', '.txt', '.xml', '.yaml'];
  const fileItems = Array.from({ length: 30 }, (_, i) => ({
    id: `file-${i}`,
    type: 'file',
    displayName: `document_${i.toString().padStart(2, '0')}${fileExtensions[i % fileExtensions.length]}`,
    icon: fileIcons[i % fileIcons.length] as string,
    tooltip: `File ${i} - Sample file for testing pagination`,
  }));

  const paginate = <T>(items: T[], skip: number) => {
    if (!paginationEnabled) {
      return { items, done: true };
    }

    return { items: items.slice(skip, skip + pageSize), done: skip + pageSize >= items.length };
  };

  const delay = () => new Promise((resolve) => setTimeout(resolve, 300));

  return {
    getTopLevelResources: () => topLevelItems,
    getNestedResources: async (resourceId, options) => {
      await delay();

      let items =
        resourceId === 'variables' ? variableItems : resourceId === 'files' ? fileItems : [];

      if (options?.searchText) {
        const search = options.searchText.toLowerCase();
        items = items.filter((item) => item.displayName.toLowerCase().includes(search));
      }

      const result = paginate(items, options?.skip ?? 0);
      console.log(
        `[ResourceManager] getNestedResources: resourceId=${resourceId}, skip=${options?.skip ?? 0}, returned=${result.items.length}, done=${result.done}`
      );

      return result;
    },
    globalSearch: async (options) => {
      await delay();

      const skip = options.skip ?? 0;
      let allItems: AutopilotChatResourceItem[] = [...variableItems, ...fileItems];

      if (options.searchText) {
        const search = options.searchText.toLowerCase();

        if (skip === 0) {
          allItems = [
            ...topLevelItems.filter((item) => item.displayName.toLowerCase().includes(search)),
            ...allItems,
          ];
        }
        allItems = allItems.filter((item) => item.displayName.toLowerCase().includes(search));
      }

      const result = paginate(allItems, skip);
      console.log(
        `[ResourceManager] globalSearch: searchText="${options.searchText ?? ''}", skip=${skip}, returned=${result.items.length}, done=${result.done}`
      );

      return result;
    },
    onResourceSelected: (item) => {
      console.log('Resource selected:', item.displayName);
    },
  };
}

/** A plain DOM settings page for `settingsRenderer`. */
export function createStorySettingsRenderer() {
  return (container: HTMLElement) => {
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
  };
}
