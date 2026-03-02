# AI Chat Component

A generic, reusable, and type-safe AI chat component for the Apollo Design System. Built with React, TypeScript, and Tailwind CSS, it supports OpenAI-compatible LLM APIs with features like tool calling, collapsible tool groups, suggestion buttons, and file uploads.

## Features

- 🤖 **OpenAI-compatible API** - Works with OpenAI, Azure OpenAI, and compatible endpoints
- 🛠️ **Tool/Function Calling** - Full support for LLM function calling with collapsible tool groups
- 💬 **Suggestion Buttons** - Interactive choice buttons for user responses
- 📎 **File Attachments** - Upload and process files (images, PDFs, text)
- 💾 **Persistent History** - Save conversations to session/local storage
- 🌍 **i18n Support** - Built-in internationalization with react-i18next
- ⚡ **Type-Safe** - Full TypeScript support with strict types
- ♿ **Accessible** - WCAG 2.1 compliant with keyboard navigation

## Installation

This component is part of the Apollo Vertex registry. Add it to your project:

```bash
# Add the ai-chat component
npx shadcn@latest add @uipath/ai-chat

# Install peer dependencies
npm install lucide-react react-i18next
```

**Optional:** Install `zod` for runtime validation of tool arguments:

```bash
npm install zod
```

## Quick Start

### Basic Chat

```tsx
import { AiChat } from '@/registry/ai-chat/ai-chat';
import { useAiChat } from '@/registry/ai-chat/use-ai-chat';

function BasicChat() {
  const chat = useAiChat({
    config: {
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4',
      systemPrompt: 'You are a helpful assistant.',
    },
    accessToken: () => 'your-api-key',
  });

  return (
    <div className="h-screen p-4">
      <AiChat
        messages={chat.messages}
        isLoading={chat.isLoading}
        onSendMessage={(msg) => chat.sendMessage(msg)}
        onStop={chat.stop}
        onClearChat={chat.clearChat}
        title="AI Assistant"
      />
    </div>
  );
}
```

### With Tool Calling

```tsx
import { AiChat } from '@/registry/ai-chat/ai-chat';
import { useAiChat } from '@/registry/ai-chat/use-ai-chat';
import type { ToolDefinition } from '@/registry/ai-chat/types';

const tools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City name',
          },
        },
        required: ['location'],
      },
    },
  },
];

function ChatWithTools() {
  const chat = useAiChat({
    config: {
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4',
      systemPrompt: 'You are a helpful weather assistant.',
      tools,
    },
    accessToken: () => 'your-api-key',
    onToolCall: async (toolCall, args) => {
      if (toolCall.name === 'get_weather') {
        // Execute your tool logic here
        const weather = await fetchWeather(args.location as string);
        console.log('Weather:', weather);
      }
    },
  });

  return (
    <AiChat
      messages={chat.messages}
      isLoading={chat.isLoading}
      onSendMessage={(msg) => chat.sendMessage(msg)}
      onStop={chat.stop}
      onClearChat={chat.clearChat}
      title="Weather Assistant"
      renderToolCall={(toolCalls) => (
        <div className="p-4 rounded-lg bg-muted">
          {toolCalls?.map((tc) => (
            <div key={tc.id}>
              <p className="text-sm font-medium">
                Calling: {tc.name}
              </p>
              <pre className="text-xs mt-1 text-muted-foreground">
                {tc.arguments}
              </pre>
            </div>
          ))}
        </div>
      )}
    />
  );
}
```

### Azure OpenAI

```tsx
const chat = useAiChat({
  config: {
    baseUrl: 'https://your-resource.openai.azure.com/openai/deployments/gpt-4',
    model: 'gpt-4',
    apiVersion: '2024-08-01-preview',
    systemPrompt: 'You are a helpful assistant.',
  },
  accessToken: () => 'your-azure-api-key',
});
```

### Validating Tool Arguments with Zod

Use zod to validate tool call arguments for type safety:

```tsx
import { z } from 'zod';

const WeatherArgsSchema = z.object({
  location: z.string(),
  unit: z.enum(['celsius', 'fahrenheit']).optional(),
});

const chat = useAiChat({
  config: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    tools: [
      {
        type: 'function',
        function: {
          name: 'get_weather',
          description: 'Get weather for a location',
          parameters: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
            },
            required: ['location'],
          },
        },
      },
    ],
  },
  accessToken: () => 'your-api-key',
  onToolCall: async (toolCall, args) => {
    if (toolCall.name === 'get_weather') {
      // Validate with zod
      const parsed = WeatherArgsSchema.safeParse(args);
      if (!parsed.success) {
        console.error('Invalid tool arguments:', parsed.error);
        return;
      }

      // Type-safe access
      const { location, unit } = parsed.data;
      const weather = await fetchWeather(location, unit);
      return weather;
    }
  },
});
```

### Tool Grouping

Group consecutive tool-only messages into collapsible badges:

```tsx
<AiChat
  messages={chat.messages}
  isLoading={chat.isLoading}
  onSendMessage={(msg) => chat.sendMessage(msg)}
  onStop={chat.stop}
  enableToolGrouping={true}
  toolDisplayNames={{
    search_database: "Search Database",
    filter_results: "Filter Results",
    generate_report: "Generate Report",
  }}
/>
```

### Suggestion Buttons

Display interactive choice buttons from tool results:

```tsx
import type { ToolResultChoices } from '@/registry/ai-chat/types';

// In your tool handler, return choices
const choicesData: ToolResultChoices = {
  type: "choices",
  prompt: "How would you like to proceed?",
  options: [
    { id: "approve", label: "Approve Document", recommended: true },
    { id: "reject", label: "Reject Document" },
    { id: "request", label: "Request Changes" },
  ],
};

// Add as a tool message
const toolMessage: ChatMessage = {
  id: crypto.randomUUID(),
  role: "tool",
  content: JSON.stringify(choicesData),
  timestamp: Date.now(),
};

// Handle choice selection
<AiChat
  messages={chat.messages}
  isLoading={chat.isLoading}
  onSendMessage={(msg) => chat.sendMessage(msg)}
  onStop={chat.stop}
  onChoiceSelect={(option) => {
    console.log("User selected:", option.label);
    chat.sendMessage(option.label);
  }}
/>
```

## API Reference

### `useAiChat(options)`

Main hook for AI chat functionality.

**Note:** Currently non-streaming. The hook fetches the complete response in a single request.

**Options:**

- `config` (required): Chat configuration
  - `baseUrl`: API endpoint URL
  - `model`: Model name (e.g., "gpt-4", "gpt-4o-mini")
  - `apiVersion`: API version (for Azure OpenAI)
  - `maxTokens`: Max tokens in response (default: 2048)
  - `temperature`: Temperature 0-2 (default: 0.7)
  - `systemPrompt`: System prompt for the AI
  - `tools`: Tool/function definitions
  - `toolChoice`: "auto" | "none" | "required"

- `accessToken` (required): API key or token getter function
- `storage`: Storage configuration
  - `type`: "session" | "local" | "none"
  - `messagesKey`: Storage key (default: "ai_chat_messages")

- `onToolCall`: Handler for tool execution
- `onError`: Error handler

**Returns:**

- `messages`: Chat messages array
- `isLoading`: Loading state
- `error`: Error object (if any)
- `sendMessage(content, file?)`: Send a message
- `stop()`: Stop current generation
- `clearChat()`: Clear chat history
- `addSystemMessage(content)`: Add system message

### `<AiChat>`

Main chat UI component.

**Props:**

- `messages` (required): Messages array
- `isLoading` (required): Loading state
- `onSendMessage` (required): Message handler
- `onStop` (required): Stop handler
- `onClearChat`: Clear handler
- `onChoiceSelect`: Handler for suggestion button clicks
- `renderToolCall`: Custom tool render function
- `assistantName`: Assistant display name
- `title`: Chat title
- `emptyState`: Custom empty state
- `placeholder`: Input placeholder
- `showClearButton`: Show clear button (default: true)
- `allowFileAttachments`: Enable file uploads (default: true)
- `maxFiles`: Maximum number of files
- `maxFileSize`: Maximum file size in bytes
- `acceptedFileTypes`: Accepted file MIME types
- `toolDisplayNames`: Custom display names for tools
- `enableToolGrouping`: Group consecutive tool-only messages (default: false)

## Integration with Existing Projects

### Invoice Processing (simple use case)

Replace the existing Chat component with:

```tsx
import { AiChat } from '@/registry/ai-chat/ai-chat';
import { useAiChat } from '@/registry/ai-chat/use-ai-chat';

const tools = [
  // Your show_entity_table and show_entity_barchart tools
];

export function Chat() {
  const chat = useAiChat({
    config: {
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4',
      tools,
      systemPrompt: CHAT_SYSTEM_PROMPT,
    },
    accessToken: () => getYourAccessToken(),
    onToolCall: async (toolCall, args) => {
      // Handle your tool calls here
    },
  });

  return (
    <AiChat
      messages={chat.messages}
      isLoading={chat.isLoading}
      onSendMessage={(msg) => chat.sendMessage(msg)}
      onStop={chat.stop}
      onClearChat={chat.clearChat}
      title="Autopilot"
      renderToolCall={(toolCalls) => (
        // Your custom tool rendering (tables, charts)
      )}
    />
  );
}
```

### Purchase Order Intake (complex use case)

The wizard chat can be built on top of the base `useAiChat` hook:

```tsx
// Create a custom hook that extends useAiChat
function useWizardChat(options) {
  const baseChat = useAiChat({
    // Base chat config
  });

  // Add wizard-specific state and logic
  const [wizardState, setWizardState] = useState(/* ... */);

  return {
    ...baseChat,
    wizardState,
    // Wizard-specific methods
  };
}
```

## TypeScript

All components and hooks are fully typed. Import types:

```tsx
import type {
  ChatMessage,
  ChatRole,
  ToolDefinition,
  ToolCall,
  AiChatConfig,
  UseAiChatReturn,
  ChoiceOption,
  ToolResultChoices,
  ToolResultNavigation,
  MessagePart,
} from '@/registry/ai-chat/types';
```

### Additional Types

```tsx
// Choice/suggestion buttons
interface ChoiceOption {
  id: string;
  label: string;
  value?: string;
  recommended?: boolean;
}

interface ToolResultChoices {
  type: "choices";
  prompt: string;
  options: ChoiceOption[];
}

// Message parts for multi-part content
interface MessagePart {
  content: string;
}

// Extended chat message with new fields
interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  parts?: MessagePart[];      // Multi-part content
  timestamp: number;
  toolCalls?: ToolCall[];
  hidden?: boolean;            // Hide from UI
  attachments?: Array<{...}>;
}
```

## Accessibility

- Keyboard navigation support
- ARIA labels on all interactive elements
- Screen reader friendly
- Focus management

## License

MIT License - Part of the Apollo Design System
