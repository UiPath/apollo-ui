# ApChat Component

## Overview

The `ApChat` component is a comprehensive AI chat interface built as a pure React component. It provides a full-featured chat experience with support for streaming, attachments, citations, custom message renderers, and extensive configuration options.

## Architecture

```
ApChat React Component (ap-chat.tsx)
    ↓
Provider Layer (state management via React Context)
    ↓
Layout Components (FullScreenLayout / StandardLayout)
    ↓
UI Components (header, messages, input, history, settings, etc.)
    ↓
ChatService (service layer for state & event management)
```

**Why this pattern?**

- React handles all UI rendering and state management
- Context providers isolate concerns and prevent prop drilling
- ChatService provides a clean API for external control
- MUI styled components ensure theme compatibility

## File Structure

```
ap-chat/
├── ap-chat.tsx                 # Main React component (entry point)
├── index.ts                    # Public exports
├── DOCS.md                     # Complete API documentation
├── CLAUDE.md                   # This file - development guide
├── readme.md                   # Component overview
│
├── service/                    # Chat service layer
│   ├── ChatService.ts          # Main chat service API
│   ├── ChatInternalService.ts  # Internal state management
│   ├── EventBus.ts             # Event pub/sub system
│   ├── LocalHistory.ts         # IndexedDB history storage
│   ├── StorageService.ts       # Browser storage wrapper
│   ├── ContentPartBuilder.ts   # Citation builder utilities
│   ├── ChatModel.ts            # Type definitions
│   ├── ChatConstants.ts        # Constants
│   └── index.ts                # Service exports
│
├── providers/                  # React Context providers for state
│   ├── chat-service.provider.tsx       # ChatService access
│   ├── chat-state-provider.tsx         # Chat mode, config state
│   ├── chat-width-provider.tsx         # Resizable width state
│   ├── chat-scroll-provider.tsx        # Auto-scroll behavior
│   ├── attachements-provider.tsx       # File attachments state
│   ├── loading-provider.tsx            # Loading indicators
│   ├── error-provider.tsx              # Error messages
│   ├── streaming-provider.tsx          # Streaming response state
│   ├── picker-provider.tsx             # Model/agent mode picker state
│   ├── locale-provider.tsx             # Internationalization
│   └── theme-provider.tsx              # Theme configuration
│
├── components/                 # UI components
│   ├── layout/                 # Layout containers
│   │   ├── full-screen-layout.tsx
│   │   ├── standard-layout.tsx
│   │   └── index.ts
│   ├── header/                 # Header components
│   │   ├── chat-header.tsx
│   │   └── header-actions.tsx
│   ├── message/                # Message display
│   │   ├── chat-message.tsx
│   │   ├── chat-message-content.tsx
│   │   ├── chat-scroll-container.tsx
│   │   ├── chat-scroll-to-bottom.tsx
│   │   ├── actions/            # Message actions (copy, feedback)
│   │   ├── loader/             # Loading states
│   │   ├── markdown/           # Markdown rendering
│   │   ├── suggestions/        # Suggestion chips
│   │   └── first-run-experience/
│   ├── input/                  # Input components
│   │   ├── chat-input.tsx
│   │   ├── chat-input-attachments.tsx
│   │   ├── chat-input-footer.tsx
│   │   ├── chat-input-model-picker.tsx
│   │   └── chat-input-agent-mode-selector.tsx
│   ├── history/                # History panel
│   │   ├── chat-history-panel.tsx
│   │   ├── chat-history-group.tsx
│   │   └── chat-history-item.tsx
│   ├── settings/               # Settings panel
│   │   ├── chat-settings.tsx
│   │   └── chat-settings-header.tsx
│   ├── common/                 # Shared components
│   │   ├── drag-handle.tsx
│   │   ├── icon-button.tsx
│   │   ├── icon.tsx
│   │   ├── action-button.tsx
│   │   ├── tooltip.tsx
│   │   └── ...
│   ├── dropzone/               # File drop zone
│   │   └── dropzone.tsx
│   └── audio/                  # Audio I/O
│       ├── chat-audio-input.ts
│       └── chat-audio-output.ts
│
├── hooks/                      # React hooks
│   └── use-is-streaming-message.tsx
│
├── utils/                      # Utility functions
│   ├── dynamic-padding.ts
│   └── file-reader.ts
│
├── assets/                     # Static assets
│   ├── autopilot-logo.svg
│   ├── default-file.svg
│   ├── word-file.svg
│   ├── ppt-file.svg
│   └── legacy-ap-icon/         # Legacy icon set
│
└── locales/                    # Internationalization
    ├── en.json
    ├── de.json
    ├── es.json
    ├── es-MX.json
    ├── fr.json
    ├── ja.json
    ├── ko.json
    ├── pt.json
    ├── pt-BR.json
    ├── ru.json
    ├── tr.json
    ├── zh-CN.json
    └── zh-TW.json
```

## Usage

### Basic Setup

```typescript
import { ApChat, AutopilotChatService, AutopilotChatMode } from '@uipath/apollo-react/material/components';

function MyApp() {
  const [chatService] = useState(() => AutopilotChatService.Instantiate({
    instanceName: 'my-chat',
    config: {
      mode: AutopilotChatMode.SideBySide
      // Configuration options
    }
  }));

  useEffect(() => {
    // Service is already initialized with Instantiate

    // Event listeners
    const unsubscribe = chatService.on('Request', (data) => {
      console.log('User sent:', data);
      // Handle request, send response
    });

    return () => {
      unsubscribe();
      chatService.close();
    };
  }, [chatService]);

  return (
    <ApChat
      service={chatService}
      locale="en"
      theme="light"
    />
  );
}
```

### Component Props

```typescript
interface ApChatProps {
  service: AutopilotChatService; // Chat service instance (required)
  locale?: SupportedLocale; // 'en' | 'de' | 'es' | 'fr' | 'ja' | etc.
  theme?: ApChatTheme; // 'light' | 'dark' | 'light-hc' | 'dark-hc'
}
```

## Styling Patterns

All styled components follow this pattern:

```typescript
import { styled } from '@mui/material/styles';
import token from '@uipath/apollo-core';

const MyComponent = styled('div')(({ theme }) => ({
  // Use Apollo Core tokens for spacing, borders, typography
  padding: token.Spacing.SpacingM,
  border: `${token.Border.BorderThickS} solid var(--color-border-de-emp)`,

  // Use CSS variables for theme-aware colors
  backgroundColor: 'var(--color-background)',
  color: 'var(--color-foreground-emp)',

  // Nested selectors and pseudo-classes
  '&:hover': {
    backgroundColor: 'var(--color-background-hover)',
  },
}));
```

**Key principles:**

- Always import `token` from `@uipath/apollo-core`
- Use CSS variables for all colors (e.g., `var(--color-background)`)
- Use `token.*` for spacing, borders, shadows, typography sizes
- MUI's `styled` API for type safety and theme integration

## Development Workflow

### Adding a New Feature

1. **Update service layer** in `service/` directory if needed
2. **Create/modify React components** in `components/` directory
3. **Update providers** if you need new state management
4. **Test locally** using the React playground (see below)
5. **Update DOCS.md** if adding public API methods
6. **Add to showcase** for visual testing

### Testing Your Changes

Use the interactive React playground at:

```
apps/react-playground/src/pages/ApChatShowcase.tsx
```

This is the primary development and testing environment. To test:

```bash
# Start the React playground dev server
cd apps/react-playground
pnpm dev

# Open in browser
# http://localhost:5173 (or the port shown in terminal)
# Navigate to "Components" → "Chat"
```

The showcase page provides interactive controls for:

- Opening/closing chat in different modes (side-by-side, full-screen, embedded)
- Sending requests/responses
- Testing streaming and citations
- Managing attachments
- Configuring features via toggles
- Testing error states
- Testing model and agent mode selection
- Testing custom header actions
- Testing localization (13+ languages)

**Add your test case** by creating a button and handler in the showcase file.

### Building for Production

```bash
# From the monorepo root
pnpm build

# Or specifically for apollo-react
cd packages/apollo-react
pnpm build
```

## Provider Pattern

The component uses React Context providers for state management. Each provider manages a specific concern:

```typescript
// Example: Using a provider in a component
import { useChatState } from '../../providers/chat-state-provider';

const MyComponent = () => {
  const { chatMode, disabledFeatures } = useChatState();

  if (chatMode === AutopilotChatMode.FullScreen) {
    // Render full screen layout
  }
};
```

**Available Providers:**

- `AutopilotChatServiceProvider` - ChatService access
- `AutopilotChatStateProvider` - Chat mode, config state
- `AutopilotChatWidthProvider` - Resizable width state
- `AutopilotChatScrollProvider` - Auto-scroll behavior
- `AutopilotAttachmentsProvider` - File attachments state
- `AutopilotLoadingProvider` - Loading indicators
- `AutopilotErrorProvider` - Error messages
- `AutopilotStreamingProvider` - Streaming response state
- `AutopilotPickerProvider` - Model/agent mode picker state
- `LocaleProvider` - Internationalization
- `ThemeProvider` - Theme configuration

**When to add a new provider:**

- State is needed by multiple components at different levels
- State updates trigger re-renders in specific component subtrees
- State should be isolated from other concerns

## Common Tasks

### Adding a New Message Renderer

Built-in renderers are defined in the `APOLLO_MESSAGE_RENDERERS` array at `components/message/chat-message-content.tsx`.

To add a custom renderer:

1. Create your renderer component
2. Register it using `chatService.injectMessageRenderer('your-renderer-name', YourComponent)`
3. Use by setting `widget: 'your-renderer-name'` on messages

Or add a built-in renderer by adding to the `APOLLO_MESSAGE_RENDERERS` array.

### Adding a New Action Button

1. Define action in `AutopilotChatMessageAction` type
2. Add to message via `actions` array
3. Handle event in `chatService.on('your-event-name', handler)`

### Modifying Chat Layout

1. Edit `components/layout/full-screen-layout.tsx` or `standard-layout.tsx`
2. Update providers if new state is needed
3. Test in all three modes: side-by-side, full-screen, embedded

### Working with Pickers and Menus

The chat interface has several picker/menu components:

**Selection Pickers (bottom left of input):**

- **Model Picker**: `chat-input-model-picker.tsx` - Select AI model
- **Agent Mode Selector**: `chat-input-agent-mode-selector.tsx` - Select agent mode

**Action Menus (header):**

- **Custom Header Actions**: `header-actions.tsx` - Custom dropdown actions

**Key Architecture:**

- Pickers are for **selection** with persistent state
- Action menus are for **triggering actions/commands**
- All share the unified `picker-provider.tsx` for state management

**Implementation pattern:**

1. Add service methods to `ChatService.ts` (set/get pattern)
2. Add event types to `AutopilotChatEvent` enum
3. Create/update React component in appropriate directory
4. Wire into picker provider if state is needed
5. **ALWAYS update documentation** (see below)

### Adding Internationalization

1. Add translations to all locale files in `locales/` directory
2. Use the `useLocale()` hook to access translations in components
3. Test with multiple locales in the React playground

## Documentation Requirements

**CRITICAL**: Whenever you add or modify a feature, you **MUST** update documentation in THREE places:

### 1. DOCS.md (Consumer API Documentation)

**Location**: `packages/apollo-react/src/material/components/ap-chat/DOCS.md`

**What to update:**

- Add new methods to the API reference table with descriptions
- Add new events to the events list
- Add new type definitions with full JSDoc comments and examples
- Add code examples showing how to use the feature
- Keep this file **always up to date** - it's the source of truth for consumers

**Structure:**

- API Methods table
- Events list
- Type definitions with examples
- Configuration options

### 2. React Playground Showcase (Development Testing)

**Location**: `apps/react-playground/src/pages/ApChatShowcase.tsx`

**CRITICAL**: This is the **primary development and testing environment** that must have ALL features available for testing.

**What to update:**

- Add button/control for the new feature in the appropriate section
- Add event handler that demonstrates how to use the feature
- Include example data/configuration
- Add console logging to show events firing
- Test the feature works in the showcase before committing

**Purpose:**

- Primary development and testing environment
- Must showcase all available features
- Used for rapid iteration during development
- Visual testing and debugging

### 3. This CLAUDE.md File

**What to update:**

- Add to "Common Tasks" section if it's a frequent development pattern
- Update architecture notes if component structure changes
- Add to file structure if new directories/files are created
- Keep focused on **development practices**, not consumption examples

## Key References

- **API Documentation**: See `DOCS.md` for complete chat service API
- **Chat Service**: `service/ChatService.ts` - Main API
- **Apollo Core Tokens**: `@uipath/apollo-core` package
- **Type Definitions**: `service/ChatModel.ts`

## Important Notes

- Always test in all three chat modes: side-by-side, full-screen, and embedded
- Use the React playground for rapid iteration and testing
- Follow the existing styled component patterns for consistency
- Test with multiple locales to ensure i18n compatibility
- Test with both light and dark themes (including high contrast variants)
- **Never skip documentation updates** - outdated docs are worse than no docs

## Theming

The component supports four theme variants:

- `light` - Standard light theme
- `dark` - Standard dark theme
- `light-hc` - Light theme with high contrast
- `dark-hc` - Dark theme with high contrast

Themes are applied via the `theme` prop and use Apollo design system CSS variables.

## Chat Modes

Three chat modes are supported:

- `SideBySide` - Resizable panel on the right side of the screen
- `FullScreen` - Full-screen overlay
- `Embedded` - Embedded in a container (takes full width/height of parent)

Set via `chatService.setChatMode(mode)`.

## Feature Toggles

Features can be disabled via `chatService.setDisabledFeatures()`:

- `history` - Chat history panel
- `settings` - Settings panel
- `attachments` - File attachments
- `audio` - Voice input/output
- `htmlPreview` - HTML preview in messages
- `headerSeparator` - Header separator line
- `fullHeight` - Full viewport height
- `resize` - Resizable width
- `close` - Close button
- `feedback` - Feedback actions (thumbs up/down)
- `copy` - Copy message action

## Best Practices

### DO's

✅ **Use CSS variables** for all colors (theme-aware)
✅ **Use Apollo tokens** for spacing, borders, typography
✅ **Test all chat modes** (side-by-side, full-screen, embedded)
✅ **Test all themes** (light, dark, high contrast variants)
✅ **Test internationalization** with multiple locales
✅ **Update DOCS.md** when adding public APIs
✅ **Update showcase** when adding features
✅ **Follow provider pattern** for state management
✅ **Use MUI styled API** for styled components
✅ **Handle cleanup** in useEffect hooks (unsubscribe from events)

### DON'Ts

❌ **Don't hardcode colors** - use CSS variables
❌ **Don't skip documentation** - update DOCS.md and showcase
❌ **Don't forget cleanup** - always unsubscribe from events
❌ **Don't use inline styles** - use styled components
❌ **Don't bypass providers** - use context for shared state
❌ **Don't forget theme compatibility** - test light and dark
❌ **Don't forget i18n** - add translations for new text
❌ **Don't mutate service state** - use service methods only

## Troubleshooting

### Issue: Chat not rendering

- Check that `chatService.initialize()` was called
- Check that `chatService.open()` was called
- Check console for errors

### Issue: Events not firing

- Check that you subscribed before triggering the action
- Check that you're using the correct event name
- Check that you didn't forget to call `unsubscribe()` in cleanup

### Issue: Styles not applying

- Check that Apollo CSS variables are imported in your app
- Check that theme prop is set correctly
- Check browser console for CSS errors

### Issue: Translations not working

- Check that locale prop matches available locales
- Check that locale files are included in build
- Check that `LocaleProvider` is in the component tree

## Contributing

When contributing new features:

1. Follow the existing patterns and conventions
2. Update documentation in all three places (DOCS.md, showcase, CLAUDE.md)
3. Test thoroughly in all modes and themes
4. Add translations for all supported locales
5. Write clean, maintainable code with proper types
6. Follow the styling patterns (CSS variables, Apollo tokens, MUI styled)
7. Ensure proper cleanup in React components

---

**Last Updated:** 2025-01-20

For questions or issues, please refer to DOCS.md or open an issue in the repository.
