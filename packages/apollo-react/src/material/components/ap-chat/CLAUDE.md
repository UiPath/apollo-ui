# ap-autopilot-chat Component

## Overview

The `ap-autopilot-chat` component is a comprehensive AI chat interface built with a Stencil web component wrapper around a React implementation. It provides a full-featured chat experience with support for streaming, attachments, citations, custom message renderers, and extensive configuration options.

## Architecture

```
Stencil Web Component (ap-autopilot-chat.tsx)
    ↓
React Adapter (PortalShellStencilReactAdapter)
    ↓
React Component (ap-autopilot-chat.react.tsx)
    ↓
Provider Layer (state management via React Context)
    ↓
UI Components (layout, header, messages, input, etc.)
```

**Why this pattern?**
- Stencil provides framework-agnostic web component API
- React handles complex state management and UI logic
- Adapter bridges Stencil lifecycle to React rendering

## Code Location

**Important**: The service layer and state management live in a separate package:

```
@uipath/portal-shell-util/src/autopilot/
├── ChatService.ts              # Main chat service API
├── ChatInternalService.ts      # Internal state management
├── EventBus.ts                 # Event pub/sub system
├── LocalHistory.ts             # IndexedDB history storage
├── StorageService.ts           # Browser storage wrapper
└── ContentPartBuilder.ts       # Citation builder utilities
```

This separation allows the chat service to be used independently of the UI component.

## File Structure

```
ap-autopilot-chat/
├── ap-autopilot-chat.tsx           # Stencil wrapper (entry point)
├── ap-autopilot-chat.react.tsx     # React root component
├── ap-autopilot-chat.scss          # Minimal base styles
├── DOCS.md                         # Complete API documentation
│
├── providers/                      # React Context providers for state
│   ├── chat-service.provider.react.tsx      # ChatService access
│   ├── chat-state-provider.react.tsx        # Chat mode, config state
│   ├── chat-width-provider.react.tsx        # Resizable width state
│   ├── chat-scroll-provider.react.tsx       # Auto-scroll behavior
│   ├── attachements-provider.react.tsx      # File attachments state
│   ├── loading-provider.react.tsx           # Loading indicators
│   ├── error-provider.react.tsx             # Error messages
│   ├── streaming-provider.react.tsx         # Streaming response state
│   ├── model-picker-provider.react.tsx      # Model selection state
│   └── agent-mode-picker-provider.react.tsx # Agent mode state
│
├── components/                     # UI components
│   ├── layout/                     # Layout containers
│   │   ├── full-screen-layout.react.tsx
│   │   └── standard-layout.react.tsx
│   ├── header/                     # Header components
│   │   ├── chat-header.react.tsx
│   │   └── chat-header-actions.react.tsx
│   ├── message/                    # Message display
│   │   ├── message-container.react.tsx
│   │   ├── message-content.react.tsx
│   │   ├── message-actions.react.tsx
│   │   ├── markdown-renderer.react.tsx
│   │   └── ... (citations, loading, etc.)
│   ├── input/                      # Input components
│   │   ├── chat-input.react.tsx
│   │   ├── chat-prompt-box.react.tsx
│   │   ├── chat-suggestions.react.tsx
│   │   └── ... (attachments, voice, etc.)
│   ├── history/                    # History panel
│   │   ├── chat-history-panel.react.tsx
│   │   └── chat-history-item.react.tsx
│   ├── settings/                   # Settings panel
│   │   └── chat-settings.react.tsx
│   ├── common/                     # Shared components
│   │   ├── drag-handle.react.tsx
│   │   ├── loading-indicator.react.tsx
│   │   └── ... (buttons, icons, etc.)
│   └── dropzone/                   # File drop zone
│       └── dropzone.react.tsx
│
├── hooks/                          # React hooks
│   └── use-chat-service.ts
│
├── utils/                          # Utility functions
│   ├── message-utils.ts
│   └── ...
│
├── assets/                         # Static assets
│   └── ... (images, icons)
│
└── stories/                        # Storybook stories
    ├── ap-autopilot-chat.stories.js
    ├── base.js                     # Shared story utilities
    └── ... (individual feature stories)
```

## Styling Patterns

All styled components follow this pattern:

```typescript
import { styled } from '@mui/material/styles';
import token from '@uipath/apollo-core';

const MyComponent = styled('div')(({ theme }) => ({
    // Use Apollo Core tokens for spacing, borders, typography
    padding: token.Spacing.SpacingM,
    border: `${token.Border.BorderThickS} solid ${theme.palette.semantic.colorBorderDeEmp}`,

    // Use theme.palette.semantic for colors (ensures theme compatibility)
    backgroundColor: theme.palette.semantic.colorBackgroundDefault,
    color: theme.palette.semantic.colorTextDefault,

    // Nested selectors and pseudo-classes
    '&:hover': {
        backgroundColor: theme.palette.semantic.colorBackgroundHover,
    },
}));
```

**Key principles:**
- Always import `token` from `@uipath/apollo-core` (not lib-esm)
- Use `theme.palette.semantic.*` for all colors (never hardcode colors)
- Use `token.*` for spacing, borders, shadows, typography sizes
- MUI's `styled` API over CSS/SCSS for type safety

## Development Workflow

### Adding a New Feature

1. **Add service layer changes** to `@uipath/portal-shell-util/src/autopilot/` if needed (add tests, avoid breaking changes)
2. **Create/modify React components** in `components/` directory
3. **Update providers** if you need new state management
4. **Test locally** using the test playground (see below)
5. **Add Storybook story** for documentation and visual testing
6. **Update DOCS.md** if adding public API methods

### Testing Your Changes

Use the interactive test playground at:
```
packages/portal-shell/src/singlecomponents/ap-autopilot-chat.html
```

This HTML file demonstrates all chat features with interactive buttons. To test:

```bash
# Start the portal-shell dev server
yarn start:shell

# Open in browser
# http://localhost:3333/singlecomponents/ap-autopilot-chat.html
```

The test page provides buttons for:
- Opening/closing chat in different modes
- Sending requests/responses
- Testing streaming and citations
- Managing attachments
- Configuring features
- Testing error states

**Add your test case** by creating a button and event handler in the HTML file.

### Updating Storybook

Stories are located in `stories/` directory. The bulk of Storybook setup happens in `stories/helpers.js`, which provides utility functions for initializing and configuring chat stories.

#### Key Storybook Files

- `ap-autopilot-chat.stories.js` - Main stories export
- `base.js` - Shared utilities and setup code
- `helpers.js` - **Core story utilities (where the bulk happens)**
- Individual `.story.js` files - Feature-specific stories

**Note**: The `helpers.js` file should eventually be rewritten for better maintainability.

#### Using helpers.js Functions

The `helpers.js` file provides several key functions:

**1. `initializeChatService(args, container, storyId, canvasElement)`**

Main function for initializing a chat service instance in stories. Handles:
- Creating the chat element
- Setting up event listeners
- Initializing the chat service with proper configuration
- Managing demo modes

```javascript
import { initializeChatService } from './helpers';

export const MyStory = {
    play: async ({ args, canvasElement }) => {
        const chatService = await initializeChatService(
            args,
            'my-story-container',
            'my-story-id',
            canvasElement
        );
    },
};
```

**2. `setupDemoMode(demoMode, chatService)`**

Sets up pre-configured demo scenarios. Available modes:
- `'basic'` - Simple request/response
- `'streaming'` - Streaming response demo
- `'attachments'` - File attachments demo
- `'async-attachments'` - Async attachment handling
- `'history'` - Chat history demo
- `'interactive'` - Interactive suggestions
- `'citations'` - Citations in messages
- `'streaming-citations'` - Streaming with citations

```javascript
setupDemoMode('streaming-citations', chatService);
```

**3. `setupFullscreenHandling(chatService, storyId, canvasElement)`**

Handles fullscreen mode changes in Storybook. Call this to enable proper fullscreen behavior:

```javascript
setupFullscreenHandling(chatService, 'my-story-id', canvasElement);
```

**4. `createStandardPlay(storyId)`**

Helper function that creates a standard play function for stories:

```javascript
export const MyStory = {
    play: createStandardPlay('my-story-id'),
};
```

**5. `getStoryDocs(storyId)`**

Returns pre-written documentation strings for stories. Use this to maintain consistent story descriptions.

#### Creating a New Story

Example using the helper functions:

```javascript
// stories/MyFeature.story.js
import { initializeChatService, setupDemoMode } from './helpers';

export const MyFeature = {
    args: {
        mode: 'side-by-side',
        demoMode: 'basic',
        // ... your configuration
    },
    render: () => {
        return document.createElement('ap-autopilot-chat');
    },
    play: async ({ args, canvasElement }) => {
        const chatService = await initializeChatService(
            args,
            'my-feature-container',
            'my-feature-story',
            canvasElement
        );

        // Optional: Set up demo mode
        if (args.demoMode) {
            setupDemoMode(args.demoMode, chatService);
        }
    },
};
```

To run Storybook:
```bash
yarn storybook:shell
```

## Provider Pattern

The component uses React Context providers for state management. Each provider manages a specific concern:

```typescript
// Example: Using a provider in a component
import { useChatState } from '../../providers/chat-state-provider.react';

const MyComponent = () => {
    const { chatMode, disabledFeatures } = useChatState();

    if (chatMode === AutopilotChatMode.FullScreen) {
        // Render full screen layout
    }
};
```

**When to add a new provider:**
- State is needed by multiple components at different levels
- State updates trigger re-renders in specific component subtrees
- State should be isolated from other concerns

## Common Tasks

### Adding a New Message Renderer

Built-in renderers are defined in the `APOLLO_MESSAGE_RENDERERS` array at `components/message/chat-message-content.react.tsx:33-65`.

To add a custom renderer:
1. Create your renderer component
2. Register it using `ChatService.injectMessageRenderer('your-renderer-name', YourComponent)`
3. Use by setting `widget: 'your-renderer-name'` on messages

Or add a built-in renderer by adding to the `APOLLO_MESSAGE_RENDERERS` array.

### Adding a New Action Button

1. Define action in `AutopilotChatMessageAction` type
2. Add to message via `actions` array
3. Handle event in `ChatService.on('your-event-name', handler)`

### Modifying Chat Layout

1. Edit `components/layout/full-screen-layout.react.tsx` or `standard-layout.react.tsx`
2. Update providers if new state is needed
3. Test in all three modes: side-by-side, full-screen, embedded

### Working with Action Menus

The chat interface has three types of action menus:

**Selection Menus (use DropdownPicker):**
- **Model Picker**: Input section (bottom left) - uses `chat-input-model-picker.react.tsx`
- **Agent Mode Selector**: Input section (bottom left) - uses `chat-input-agent-mode-selector.react.tsx`

**Action Menus (use dedicated menu components):**
- **Custom Header Actions**: Header section (top right, "..." button) - uses `header-action-menu.react.tsx`

**Key Architecture:**
- Dropdown pickers are for **selection** with persistent state
- Action menus are for **triggering actions/commands** without state
- All three share the unified `picker-provider.react.tsx` for state management
- Custom header actions use `AutopilotChatHeaderActionMenu` component (not DropdownPicker)

**Implementation pattern:**
1. Add service methods to `ChatService.ts` (set/get pattern)
2. Add event types to `AutopilotChatEvent` enum
3. Create/update React component in appropriate directory
4. Wire into unified picker provider if state is needed
5. **ALWAYS update documentation** (see below)

## Documentation Requirements

**CRITICAL**: Whenever you add or modify a feature, you **MUST** update documentation and playgrounds in FOUR places:

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

### 2. HTML Test Playground (Default Development Playground)
**Location**: `packages/portal-shell/src/singlecomponents/ap-autopilot-chat.html`

**CRITICAL**: This is the **default playground** that must have ALL features available for testing.

**What to update:**
- Add button for the new feature in the appropriate section
- Add event handler that demonstrates how to use the feature
- Include example data/configuration
- Add console logging to show events firing
- Test the feature works in the playground before committing

**Purpose:**
- Primary development and testing environment
- Must showcase all available features
- Used for rapid iteration during development
- Should be the first place to test changes

**How to use:**
```bash
yarn start:shell
# Open http://localhost:3333/singlecomponents/ap-autopilot-chat.html
```

### 3. Storybook Stories
**Location**: `packages/apollo-react/src/material/components/ap-chat/stories/`

**What to update:**
- **FeaturePlayground.story.js**: Add feature with interactive controls (this is the Storybook equivalent of the HTML playground - must have ALL features)
- Create dedicated story file if feature warrants it (e.g., `CustomMenus.story.js`)
- Update `helpers.js` with documentation for new stories (use `getStoryDocs()`)
- Include code examples in the story documentation
- Stories serve as **both documentation and visual regression tests**

**Note**: The bulk of Storybook setup happens in `helpers.js` - always update it when adding stories

### 4. This CLAUDE.md File
**What to update:**
- Add to "Common Tasks" section if it's a frequent development pattern
- Update architecture notes if component structure changes
- Add to file structure if new directories/files are created
- Keep focused on **development practices**, not consumption examples

## Key References

- **API Documentation**: See `DOCS.md` for complete chat service API
- **Chat Service**: `@uipath/portal-shell-util/src/autopilot/ChatService.ts`
- **Apollo Core Tokens**: `@uipath/apollo-core` package
- **Global Access**: `window.PortalShell.AutopilotChat`

## Important Notes

- When modifying `portal-shell-util`: always add tests and avoid breaking changes (it's a shared dependency)
- Always test in all three chat modes: side-by-side, full-screen, and embedded
- Use the test playground HTML file for rapid iteration
- Follow the existing styled component patterns for consistency
- **Never skip documentation updates** - outdated docs are worse than no docs
