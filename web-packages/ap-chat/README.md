# @uipath/ap-chat

A flexible chat interface component provided as a framework-agnostic web component, making it usable in any framework or vanilla JavaScript.

## Overview

The `ap-chat` web component provides AI assistant functionality with a powerful service-based API. The component includes:

- A resizable and collapsible UI that can operate in side-by-side, full-screen, or embedded mode
- Support for text messages with markdown formatting and citations
- File attachments with drag-and-drop support
- Customizable first-run experience with suggested prompts
- Extensible architecture with custom message renderers
- Event system for intercepting and handling chat interactions
- Support for real-time streaming responses and simulated streaming
- Interactive message actions system
- Comprehensive conversation history management
- Settings panel with customizable content
- Real-time voice input and output streaming
- Model and agent mode selection
- Custom header actions with nested menus
- Loading and waiting state management
- Pagination support for large conversations

## Installation

```bash
npm install @uipath/ap-chat
# or
pnpm add @uipath/ap-chat
# or
yarn add @uipath/ap-chat
```

## Usage

### Vanilla JavaScript / HTML

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AP Chat Example</title>
</head>
<body>
  <ap-chat id="chat"></ap-chat>

  <script type="module">
    import { AutopilotChatService } from '@uipath/ap-chat/service';
    import '@uipath/ap-chat';

    // Create and initialize the service
    const service = new AutopilotChatService();
    service.initialize({
      mode: 'side-by-side',
      firstRunExperience: {
        title: "Welcome to Autopilot Chat!",
        description: "Ask me anything about your data or how to use this application.",
        suggestions: [
          { label: "Get started", prompt: "How do I get started?" },
          { label: "Show features", prompt: "What features are available?" }
        ]
      }
    });

    // Set the service instance and properties on the web component
    const chatElement = document.getElementById('chat');
    chatElement.chatServiceInstance = service;
    chatElement.locale = 'en';
    chatElement.theme = 'light';

    // Listen for user requests
    service.on('Request', (data) => {
      console.log('User sent:', data.content);

      // Send a response
      setTimeout(() => {
        service.sendResponse({
          content: `Echo: ${data.content}`,
          role: 'assistant'
        });
      }, 1000);
    });

    // Open the chat
    service.open();
  </script>
</body>
</html>
```

### React

For React applications, use the `@uipath/apollo-react` package directly instead of the web component:

```typescript
import { ApChat } from '@uipath/apollo-react/ap-chat';
import { AutopilotChatService } from '@uipath/apollo-react/ap-chat/service';

function App() {
  const service = new AutopilotChatService();
  // ... use ApChat React component directly
}
```

See the [@uipath/apollo-react documentation](https://github.com/UiPath/apollo-ui/tree/main/packages/apollo-react) for details.

### Angular

```typescript
// In app.module.ts or component
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AutopilotChatService } from '@uipath/ap-chat/service';
import '@uipath/ap-chat';

@Component({
  selector: 'app-root',
  template: '<ap-chat #chat></ap-chat>',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('chat') chatElement!: ElementRef;
  private service = new AutopilotChatService();

  ngOnInit() {
    this.service.initialize({ mode: 'side-by-side' });

    this.service.on('Request', (data) => {
      this.service.sendResponse({
        content: `Echo: ${data.content}`,
        role: 'assistant'
      });
    });
  }

  ngAfterViewInit() {
    this.chatElement.nativeElement.chatServiceInstance = this.service;
    this.chatElement.nativeElement.locale = 'en';
    this.chatElement.nativeElement.theme = 'light';
    this.service.open();
  }
}
```

## Web Component Properties

The `<ap-chat>` element exposes the following JavaScript properties:

```typescript
// Chat service instance (required)
chatElement.chatServiceInstance = service;

// Locale (optional, default: 'en')
// Supported: 'en', 'de', 'es', 'es-MX', 'fr', 'ja', 'ko', 'pt', 'pt-BR', 'ru', 'tr', 'zh-CN', 'zh-TW'
chatElement.locale = 'en';

// Theme (optional, default: 'light')
// Supported: 'light', 'dark', 'light-hc', 'dark-hc'
chatElement.theme = 'light';
```

## Chat Service API

The complete chat service API documentation is available in the [@uipath/apollo-react package documentation](https://github.com/UiPath/apollo-ui/tree/main/packages/apollo-react/src/material/components/ap-chat/DOCS.md).

### Quick Reference

**Configuration & Initialization**
- `initialize(config)` - Initialize the chat service
- `open()` - Open the chat interface
- `close()` - Close the chat interface
- `setChatMode(mode)` - Set chat window mode ('side-by-side', 'full-screen', 'embedded')
- `setLocale(locale)` - Change locale dynamically
- `setTheme(theme)` - Change theme dynamically

**Message Handling**
- `sendRequest(message)` - Send a user request
- `sendResponse(message)` - Send an AI response
- `setConversation(messages)` - Set entire conversation
- `getConversation()` - Get current conversation
- `setPrompt(prompt)` - Set input field value
- `setSuggestions(suggestions)` - Show suggestion chips

**Event Handling**
- `on(event, handler)` - Subscribe to events
- `intercept(event, interceptor)` - Intercept events

**Common Events**
- `Request` - User sends a message
- `Response` - AI response received
- `ModeChange` - Chat mode changed
- `Open` - Chat opened
- `Close` - Chat closed

### Example: Streaming Response

```javascript
import { AutopilotChatService } from '@uipath/ap-chat/service';

const service = new AutopilotChatService();

// Stream a response word by word
const messageId = 'stream-' + Date.now();
const words = ['Hello', 'World', 'This', 'is', 'streaming'];

words.forEach((word, index) => {
  setTimeout(() => {
    service.sendResponse({
      id: messageId,
      content: word,
      stream: true,
      done: index === words.length - 1
    });
  }, index * 200);
});
```

### Example: Citations

```javascript
service.sendResponse({
  role: 'assistant',
  contentParts: [
    {
      text: 'The NBA Finals are the annual championship series.',
      citations: [
        {
          id: 1,
          title: 'NBA Official Finals Overview',
          url: 'https://www.nba.com/history/finals'
        }
      ]
    }
  ]
});
```

### Example: Custom Actions

```javascript
service.sendResponse({
  content: 'Here is your data analysis',
  actions: [
    {
      name: 'export',
      label: 'Export Data',
      icon: 'download',
      eventName: 'export-data'
    }
  ]
});

service.on('export-data', ({ message, action }) => {
  console.log('Export triggered for message:', message.id);
});
```

## Complete Documentation

For comprehensive documentation including:
- All service methods and parameters
- Event system details
- Message renderers
- History management
- Settings panel
- Model and agent mode selection
- Streaming and citations
- And much more...

See the [complete documentation](https://github.com/UiPath/apollo-ui/tree/main/packages/apollo-react/src/material/components/ap-chat/DOCS.md).

## TypeScript Support

The package includes full TypeScript definitions. Import types from the service:

```typescript
import {
  AutopilotChatService,
  AutopilotChatMessage,
  AutopilotChatConfiguration,
  AutopilotChatEvent
} from '@uipath/ap-chat/service';
```

## Browser Support

The web component uses modern browser features:
- Custom Elements v1
- Shadow DOM v1
- ES Modules

Supported browsers:
- Chrome/Edge 88+
- Firefox 90+
- Safari 14+

## License

MIT
