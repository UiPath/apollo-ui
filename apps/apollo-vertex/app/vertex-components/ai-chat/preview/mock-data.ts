import type { UIMessage } from "@tanstack/ai-client";

export const MOCK_MESSAGES_BASIC: UIMessage[] = [
  {
    id: "1",
    role: "user",
    parts: [{ type: "text", content: "What is Apollo Design System?" }],
    createdAt: new Date(Date.now() - 120000),
  },
  {
    id: "2",
    role: "assistant",
    parts: [
      {
        type: "text",
        content:
          "Apollo is UiPath's open-source design system. It provides a unified component library with **design tokens**, **React components**, and **Web Components** for building consistent user interfaces.",
      },
    ],
    createdAt: new Date(Date.now() - 60000),
  },
];

export const MOCK_MESSAGES_MARKDOWN: UIMessage[] = [
  {
    id: "1",
    role: "user",
    parts: [
      {
        type: "text",
        content: "Show me all the markdown formatting you support.",
      },
    ],
    createdAt: new Date(),
  },
  {
    id: "2",
    role: "assistant",
    parts: [
      {
        type: "text",
        content: `Here's a comprehensive demo of supported markdown:

## Headings & Text

This is a paragraph with **bold**, *italic*, and \`inline code\`.

> This is a blockquote with some important information.

---

## Lists

**Unordered list:**
- First item
- Second item with **bold**
- Third item

**Ordered list:**
1. Step one
2. Step two
3. Step three

## Code Block

\`\`\`typescript
interface AiChatProps {
  messages: UIMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
}
\`\`\`

## Table

| Component | Status | Description |
|-----------|--------|-------------|
| AiChat | Ready | Main chat shell |
| AiChatMessage | Ready | Message renderer |
| AiChatInput | Ready | Text input |
| AiChatMarkdown | Ready | Markdown renderer |

## Links

Check [Apollo UI](https://github.com/UiPath/apollo-ui) for more info.`,
      },
    ],
    createdAt: new Date(),
  },
];

export const MOCK_MESSAGES_CONVERSATION: UIMessage[] = [
  {
    id: "1",
    role: "user",
    parts: [{ type: "text", content: "Can you help me set up a new project?" }],
    createdAt: new Date(Date.now() - 300000),
  },
  {
    id: "2",
    role: "assistant",
    parts: [
      {
        type: "text",
        content:
          "Of course! I'd be happy to help. What kind of project are you looking to create?",
      },
    ],
    createdAt: new Date(Date.now() - 240000),
  },
  {
    id: "3",
    role: "user",
    parts: [
      {
        type: "text",
        content: "A React app with Tailwind CSS and TypeScript.",
      },
    ],
    createdAt: new Date(Date.now() - 180000),
  },
  {
    id: "4",
    role: "assistant",
    parts: [
      {
        type: "text",
        content:
          "Great choice! Here's how to get started:\n\n1. Run `npx create-next-app@latest`\n2. Select **TypeScript** and **Tailwind CSS** during setup\n3. Install Apollo components:\n\n```bash\nnpx shadcn@latest add @uipath/button\n```\n\nWould you like me to walk through any of these steps in detail?",
      },
    ],
    createdAt: new Date(Date.now() - 120000),
  },
  {
    id: "5",
    role: "user",
    parts: [{ type: "text", content: "Yes, explain step 3 please." }],
    createdAt: new Date(Date.now() - 60000),
  },
  {
    id: "6",
    role: "assistant",
    parts: [
      {
        type: "text",
        content:
          "The `shadcn` CLI copies component source code directly into your project. When you run the command, it will:\n\n- Create `components/ui/button.tsx` in your project\n- Add any required dependencies to `package.json`\n- Set up the `cn()` utility if not present\n\nYou own the code — modify it however you need.",
      },
    ],
    createdAt: new Date(),
  },
];

export const MOCK_MESSAGES_WITH_CHOICES: UIMessage[] = [
  {
    id: "1",
    role: "user",
    parts: [{ type: "text", content: "What presentation style should I use?" }],
    createdAt: new Date(),
  },
  {
    id: "2",
    role: "assistant",
    parts: [
      {
        type: "text",
        content: "Here are some options based on your audience:",
      },
      {
        type: "tool-call",
        id: "call-1",
        name: "presentChoices",
        arguments: "{}",
        state: "input-complete" as const,
      },
      {
        type: "tool-result",
        toolCallId: "call-1",
        state: "complete" as const,
        content: JSON.stringify({
          type: "choices",
          prompt: "Pick a presentation style:",
          options: [
            { id: "1", label: "Executive Summary", recommended: true },
            { id: "2", label: "Technical Deep Dive" },
            { id: "3", label: "Workshop Format" },
          ],
        }),
      },
    ],
    createdAt: new Date(),
  },
];

export const MOCK_SOURCES_BASIC = {
  "2": [
    { label: "Apollo UI GitHub", url: "https://github.com/UiPath/apollo-ui" },
    { label: "Tailwind CSS", url: "https://tailwindcss.com" },
    { label: "shadcn/ui", url: "https://ui.shadcn.com" },
  ],
};

export const MOCK_ATTACHMENTS_BASIC = {
  "1": [{ name: "Q4_Report.pdf", type: "application/pdf", size: 245000 }],
};

export const MOCK_CHOICE_OPTIONS = [
  { id: "1", label: "Option A — Recommended", recommended: true },
  { id: "2", label: "Option B — Alternative" },
  { id: "3", label: "Option C — Experimental" },
  { id: "4", label: "Option D — Conservative" },
];
