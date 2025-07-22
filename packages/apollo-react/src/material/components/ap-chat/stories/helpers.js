import { AutopilotChatService } from '@uipath/portal-shell-util';

// Import base configuration data
import {
    attachmentConfigs,
    generateSuggestions,
    modelConfigs,
    sampleConversations,
} from './base.js';

// Helper function to initialize chat service
export const initializeChatService = (args, container, storyId = 'default', canvasElement = null) => {
    // Create a stable instance name for this story
    const instanceName = `chat-story-${storyId}`;

    // Get or create a chat service instance specific to this story
    const chatService = AutopilotChatService.Instantiate({ instanceName });

    // Reset chat service to clean state
    chatService.close();
    chatService.newChat();
    chatService.clearError();
    chatService.setConversation([]);
    chatService.setHistory([]);
    chatService.setSuggestions([]);

    // Close any open panels
    if (chatService.historyOpen) {
        chatService.toggleHistory(false);
    }
    if (chatService.settingsOpen) {
        chatService.toggleSettings(false);
    }

    // Configure disabled features
    const disabledFeatures = {
        settings: args.settingsDisabled,
        resize: args.resizeDisabled,
        fullScreen: args.fullScreenDisabled,
        attachments: args.attachmentsDisabled,
        history: args.historyDisabled,
        close: args.closeDisabled,
        header: args.headerDisabled,
        footer: args.footerDisabled,
        preview: args.previewDisabled,
        newChat: args.newChatDisabled,
        audio: args.audioDisabled,
    };

    // Configure label overrides
    const overrideLabels = {};
    if (args.inputPlaceholder) {
        overrideLabels.inputPlaceholder = args.inputPlaceholder;
    }
    if (args.footerDisclaimer) {
        overrideLabels.footerDisclaimer = args.footerDisclaimer;
    }
    if (args.title) {
        overrideLabels.title = args.title;
    }

    // Initialize with configuration
    const config = {
        mode: args.mode || 'side-by-side',
        embeddedContainer: args.mode === 'embedded' ? container : undefined,
        disabledFeatures,
        overrideLabels: Object.keys(overrideLabels).length > 0 ? overrideLabels : undefined,
        useLocalHistory: args.useLocalHistory,
        paginatedMessages: args.paginatedMessages,
    };

    // Add first run experience if enabled
    if (args.showFirstRun) {
        config.firstRunExperience = {
            title: args.firstRunTitle,
            description: args.firstRunDescription,
            suggestions: generateSuggestions(),
        };
    }

    // Add models if enabled
    if (args.showModels) {
        chatService.setModels(modelConfigs);
        chatService.setSelectedModel(modelConfigs[1].id);
    }

    // Initialize and open
    chatService.initialize(config);

    // Handle demo modes
    if (args.demoMode !== 'none') {
        setupDemoMode(args.demoMode, chatService);
    }

    // Open the chat
    if (args.mode === 'embedded') {
        chatService.open({
            mode: 'embedded',
            embeddedContainer: container,
        });
    } else {
        chatService.open({ mode: args.mode });
    }

    // Handle fullscreen mode changes for all stories
    if (args.mode !== 'embedded' && canvasElement) {
        setupFullscreenHandling(chatService, storyId, canvasElement);
    }

    return chatService;
};

// Setup different demo scenarios
export const setupDemoMode = (demoMode, chatService) => {
    switch (demoMode) {
        case 'basic':
            setTimeout(() => {
                chatService.setConversation(sampleConversations.basic);
            }, 500);
            break;

        case 'streaming':
            setTimeout(() => {
                chatService.sendRequest({ content: sampleConversations.streaming[0].content });
                setTimeout(() => {
                    const message = sampleConversations.streaming[1];
                    const words = message.content.split(' ');
                    let index = 0;
                    const streamId = 'stream-demo';

                    const interval = setInterval(() => {
                        if (index < words.length) {
                            chatService.sendResponse({
                                id: streamId,
                                content: words.slice(0, index + 1).join(' '),
                                stream: true,
                            });
                            index++;
                        } else {
                            clearInterval(interval);
                            chatService.sendResponse({
                                id: streamId,
                                content: '',
                                stream: true,
                                done: true,
                            });
                        }
                    }, 100);
                }, 1000);
            }, 500);
            break;

        case 'attachments':
            setTimeout(() => {
                chatService.setConversation(sampleConversations.attachments);
                chatService.setAllowedAttachments(attachmentConfigs.workflows);
            }, 500);
            break;

        case 'history':
            setTimeout(() => {
                chatService.setHistory(sampleConversations.history);
                chatService.toggleHistory(true);
            }, 500);
            break;

        case 'interactive':
            // Set up interactive features
            chatService.setDefaultLoadingMessages([ 'Analyzing...', 'Processing...', 'Almost done...' ], 2000);
            chatService.setSuggestions([
                {
                    label: 'Quick action',
                    prompt: 'Show me a quick example',
                },
                {
                    label: 'Help',
                    prompt: 'What can you help me with?',
                },
            ]);
            break;
    }
};

// Setup fullscreen handling for all stories
export const setupFullscreenHandling = (chatService, storyId, canvasElement) => {
    const docsPanel = canvasElement.querySelector(`#docs-panel-${storyId}`);
    const chatPanel = canvasElement.querySelector(`#chat-panel-${storyId}`);
    const chatElement = canvasElement.querySelector(`#chat-${storyId}`);

    if (!docsPanel || !chatPanel || !chatElement) {
        return;
    }

    // Listen for mode changes
    chatService.on('modeChange', (mode) => {
        if (mode === 'full-screen') {
            // Hide docs panel and expand chat
            docsPanel.style.display = 'none';
            chatPanel.style.width = '100%';
            chatPanel.style.margin = '0';
            chatElement.style.height = '100vh';
            chatElement.style.borderRadius = '0';
            chatElement.style.boxShadow = 'none';
        } else {
            // Show docs panel and restore normal layout
            docsPanel.style.display = 'block';
            chatPanel.style.width = '';
            chatPanel.style.margin = '20px';
            chatPanel.style.marginLeft = '10px';
            chatPanel.style.minWidth = '400px';
            chatElement.style.height = 'calc(100vh - 40px)';
            chatElement.style.borderRadius = '12px';
            chatElement.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.1), 0 5px 20px rgba(0,0,0,0.15)';
        }
    });
};

// Standard play function for simple stories
export const createStandardPlay = (storyId) => async ({
    canvasElement,
    args,
}) => {
    const container = args.mode === 'embedded' ?
        canvasElement.querySelector('#embedded-chat-container') : null;
    const chatService = initializeChatService(args, container, storyId, canvasElement);

    // Set the chat service instance on the component
    const chatElement = canvasElement.querySelector(`#chat-${storyId}`);
    if (chatElement) {
        chatElement.chatServiceInstance = chatService;
    }
};

// Helper function to get story-specific documentation
export const getStoryDocs = (storyId) => {
    const storySpecificDocs = {
        'default': `
# Autopilot Chat

A flexible chat interface component that provides seamless integration with both React and Angular applications, powered by a globally accessible chat service.

## Overview

The Autopilot Chat component is a full-featured chat interface that can be embedded in applications to provide AI assistant functionality. Side-by-side mode is provided by default in ap-shell, which serves as the default shell for all UiPath services and includes the autopilot chat functionality out-of-the-box.

## Integration with ap-shell

The autopilot chat is automatically available when using ap-shell (the standard container for UiPath applications).

## Standalone Implementation

For standalone usage outside of ap-shell:

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Direct Component Usage</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">// Initialize autopilot chat service
const chatService = window.PortalShell.AutopilotChat;

chatService.initialize({
    mode: 'side-by-side',
    firstRunExperience: {
        title: 'Welcome to Autopilot Chat',
        description: 'Ask me anything about automation!',
        suggestions: [
            { label: 'Get started', prompt: 'How do I begin?' },
            { label: 'Help', prompt: 'What can you help with?' }
        ]
    }
});

// Bind to component and open
const chatElement = document.getElementById('my-chat');
chatElement.chatServiceInstance = chatService;
chatService.open();</pre>
</div>

## Key Features

The component includes:
- Side-by-side layout (default in ap-shell)
- Full-screen and embedded modes for flexible integration
- Markdown support for rich text formatting
- File attachments with drag-and-drop
- Custom message renderers for specialized content
- First-run experience with guided onboarding
- Streaming responses and real-time updates

Features demonstrated:
- ap-shell default integration
- Standalone component usage
- Side-by-side layout configuration
- First run experience setup
        `,
        'basic-conversation': `
# Basic Conversation Demo

Demonstrates a pre-loaded conversation to show message history.

## Code Example

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">JavaScript Implementation</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">// Set up a pre-populated conversation
const conversation = [
    {
        id: '1',
        role: 'user',
        content: 'How do I create a new automation project?'
    },
    {
        id: '2', 
        role: 'assistant',
        content: 'To create a new automation project:\n\n1. Open UiPath Studio\n2. Click "New Project"\n3. Choose your project type\n4. Give it a name and click "Create"\n\nWould you like more details on any step?'
    }
];

// Apply the conversation to the chat service
chatService.setConversation(conversation);</pre>
</div>

**Features demonstrated:**
- Pre-populated conversation
- Message display with user and assistant roles
- Basic markdown rendering
        `,
        'streaming-response': `
# Streaming Response Demo

Shows real-time streaming of responses, simulating typing effect.

## Code Example

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Streaming Implementation</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">// Start streaming a response
const streamMessage = (text) => {
    const words = text.split(' ');
    const streamId = 'stream-response-' + Date.now();
    let index = 0;

    const interval = setInterval(() => {
        if (index < words.length) {
            // Send partial content
            chatService.sendResponse({
                id: streamId,
                content: words.slice(0, index + 1).join(' '),
                stream: true
            });
            index++;
        } else {
            // Mark stream as complete
            clearInterval(interval);
            chatService.sendResponse({
                id: streamId,
                content: '',
                stream: true,
                done: true
            });
        }
    }, 100); // 100ms delay between words
};

// Usage
streamMessage('This is a streaming response that appears word by word.');</pre>
</div>

**Features demonstrated:**
- Word-by-word streaming simulation
- Real-time message updates
- Streaming completion handling
        `,
        'with-attachments': `
# File Attachments Demo

Demonstrates file attachment capabilities and configuration.

## Code Example

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Implementation Code</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">// Configure allowed attachments
chatService.setAllowedAttachments({
    types: {
        'application/xml': ['.xaml'],        // Workflow files
        'text/csv': ['.csv'],                // Data files
        'application/json': ['.json'],       // Config files
        'text/plain': ['.txt', '.log']       // Text and log files
    },
    maxSize: 5 * 1024 * 1024, // 5MB limit
    multiple: true             // Allow multiple files
});

// Handle file uploads in messages
const handleFileMessage = (files) => {
    const attachments = files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
    }));

    chatService.sendRequest({
        content: 'Please analyze these files.',
        attachments: attachments
    });
};

// Respond with file analysis
chatService.sendResponse({
    content: 'I\'ve analyzed your files. Here are my findings:\n\n**File Overview:**\n- Process Name: Invoice Processing\n- Activities Count: 47\n- Decision Points: 5'
});</pre>
</div>

**Features demonstrated:**
- File drag-and-drop interface
- Attachment type restrictions
- File size limitations
- Multiple attachment support
        `,
        'with-history': `
# Conversation History Demo

Shows the history management features and local storage.

## Code Example

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Implementation Code</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">// Enable local history storage
chatService.initialize({
    useLocalHistory: true,
    paginatedMessages: true
});

// Set up conversation history
const historyItems = [
    {
        id: 'conv-1',
        name: 'Invoice Processing Help',
        timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
        id: 'conv-2', 
        name: 'Document Understanding Setup',
        timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
    },
    {
        id: 'conv-3',
        name: 'API Integration Questions', 
        timestamp: new Date(Date.now() - 259200000).toISOString() // 3 days ago
    }
];

// Apply history and show panel
chatService.setHistory(historyItems);
chatService.toggleHistory(true);

// Handle history item selection
chatService.on('history-selected', ({ historyId }) => {
    console.log('Loading conversation:', historyId);
    // Load the selected conversation
});</pre>
</div>

**Features demonstrated:**
- History panel with past conversations
- Local storage using IndexedDB
- Conversation switching
- History management controls
        `,
        'embedded-mode': `
# Embedded Mode Demo

Demonstrates how to embed the chat in a custom container.

## Code Example

HTML Container:
<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">HTML Container Setup</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">&lt;div id="chat-container" style="
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 380px;
    height: 600px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
    background: white;
    z-index: 1000;
"&gt;&lt;/div&gt;</pre>
</div>

JavaScript Integration:
<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">JavaScript Implementation</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">const container = document.getElementById('chat-container');

// Initialize in embedded mode
chatService.initialize({
    mode: 'embedded',
    embeddedContainer: container,
    disabledFeatures: {
        resize: true,      // Disable resize in embedded mode
        fullScreen: true,  // Disable fullscreen
        header: false,     // Keep header for minimize
        close: false       // Allow closing
    }
});

// Open the embedded chat
chatService.open({
    mode: 'embedded',
    embeddedContainer: container
});

// Handle close events
chatService.on('close', () => {
    container.style.display = 'none';
});

// Function to show chat again
const showChat = () => {
    container.style.display = 'block';
    chatService.open({
        mode: 'embedded',
        embeddedContainer: container
    });
};</pre>
</div>

Features demonstrated:
- Floating chat widget
- Custom container positioning
- Embedded mode configuration
- Integration with existing layouts
        `,
        'full-screen-mode': `
# Full Screen Mode Demo

Shows the chat in full-screen overlay mode.

## Code Example

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Implementation Code</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">// Initialize and open in full-screen mode
chatService.initialize({
    mode: 'full-screen'
});

chatService.open({ mode: 'full-screen' });

// Or switch to full-screen from another mode
const openFullScreen = () => {
    chatService.setChatMode('full-screen');
};

// Handle full-screen events
chatService.on('mode-changed', ({ mode, previousMode }) => {
    console.log('Chat mode changed from ' + previousMode + ' to ' + mode);
    
    if (mode === 'full-screen') {
        // Full-screen mode activated
        document.body.style.overflow = 'hidden';
    } else {
        // Exited full-screen
        document.body.style.overflow = '';
    }
});

// Exit full-screen programmatically
const exitFullScreen = () => {
    chatService.setChatMode('side-by-side');
};</pre>
</div>

**Features demonstrated:**
- Full-screen overlay interface
- Modal-like behavior
- Maximized chat experience
        `,
        'minimal-ui': `
# Minimal UI Demo

Demonstrates a stripped-down version with minimal UI elements.

## Code Example

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Implementation Code</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">// Configure minimal UI by disabling features
chatService.initialize({
    mode: 'side-by-side',
    disabledFeatures: {
        settings: true,      // No settings panel
        header: true,        // No header bar
        footer: true,        // No footer
        attachments: true,   // No file attachments
        history: true,       // No conversation history
        newChat: true,       // No new chat button
        audio: true,         // No audio features
        preview: true,       // No preview badge
        resize: false,       // Keep resize (optional)
        fullScreen: false,   // Keep fullscreen (optional)
        close: false         // Keep close button (optional)
    }
});

// Open with minimal interface
chatService.open();

// The result is a clean chat interface with only:
// - Message input field
// - Message display area
// - Essential navigation controls</pre>
</div>

**Features demonstrated:**
- Header and footer disabled
- No attachments or history
- Clean, minimal interface
- Essential chat functionality only
        `,
        'with-custom-labels': `
# Custom Labels Demo

Shows how to customize text labels throughout the interface.

## Code Example

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Implementation Code</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">// Customize labels throughout the interface
chatService.initialize({
    mode: 'side-by-side',
    overrideLabels: {
        inputPlaceholder: 'Ask me anything about automation...',
        footerDisclaimer: 'AI responses may contain errors. Always verify important information.',
        title: 'Automation Assistant'
    }
});

chatService.open();</pre>
</div>

**Features demonstrated:**
- Custom input placeholder
- Custom footer disclaimer
- Custom title
- Label override system
        `,
        'custom-widgets': `
# Custom Widgets Demo

Demonstrates custom message renderers for specialized content using web components.

## Code Example

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Widget Registration</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">// Define custom web component
class ChartWidget extends HTMLElement {
    connectedCallback() {
        this.style.cssText = \`
            display: block;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            color: white;
            margin: 10px 0;
        \`;
        
        const title = document.createElement('h3');
        title.textContent = 'Sales Performance Chart';
        this.appendChild(title);
        
        // Add chart data visualization here
    }
}

// Register the web component
customElements.define('chart-widget', ChartWidget);

// Register with chat service
chatService.injectMessageRenderer({
    name: 'chart-widget',
    render: (element) => {
        const chartWidget = document.createElement('chart-widget');
        element.appendChild(chartWidget);
    }
});</pre>
</div>

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Sending Widget Messages</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">// Send message with widget
chatService.sendResponse({
    content: 'Here is your sales performance data:',
    widget: 'chart-widget',
    actions: [
        {
            name: 'export',
            label: 'Export Chart',
            icon: 'download',
            eventName: 'export-chart'
        }
    ]
});

// Handle widget actions
chatService.on('export-chart', () => {
    chatService.sendResponse({ 
        content: 'Chart exported successfully!' 
    });
});</pre>
</div>

**Features demonstrated:**
- Custom web components for widgets
- Chart, table, and workflow visualizations
- Widget registration with chat service
- Custom action buttons on widget messages
- Event handling for widget interactions
        `,
        'interactive-features': `
# Interactive Features Demo

Shows interactive chat capabilities with suggestions, loading states, models, and custom actions.

## Code Example

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Interactive Features Setup</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">// Set up loading messages
chatService.setDefaultLoadingMessages([
    'Analyzing...', 
    'Processing...', 
    'Almost done...'
], 2000);

// Set up suggestion buttons
chatService.setSuggestions([
    {
        label: 'Quick action',
        prompt: 'Show me a quick example'
    },
    {
        label: 'Help', 
        prompt: 'What can you help me with?'
    }
]);

// Send message with custom actions
chatService.sendResponse({
    content: 'Here is an example with custom actions:',
    actions: [
        {
            name: 'download',
            label: 'Download',
            icon: 'download',
            eventName: 'download-action',
            details: { filename: 'example.xaml' }
        },
        {
            name: 'share',
            label: 'Share',
            icon: 'share',
            showInOverflow: true,
            eventName: 'share-action'
        }
    ]
});

// Handle action events
chatService.on('download-action', ({ action }) => {
    console.log('Download triggered:', action.details.filename);
});

chatService.on('share-action', ({ message }) => {
    console.log('Share triggered for message:', message.id);
});</pre>
</div>

**Features demonstrated:**
- Default loading messages with custom duration
- Suggestion buttons for quick prompts
- Model selection dropdown
- Paginated message display
- Custom action buttons (download and share)
- Action event handling
        `,
        'feature-playground':
'# Feature Playground\n\n' +
'Interactive demo with controls to test all chat features.\n\n' +
'## Code Example\n\n' +
'<pre style="background: #f8f8f8; padding: 15px; border-radius: 4px; overflow-x: auto;">' +
'<code>// Initialize with all features enabled for testing\n' +
'chatService.initialize({\n' +
'    mode: \'side-by-side\',\n' +
'    disabledFeatures: {\n' +
'        settings: false  // Enable settings for playground\n' +
'    },\n' +
'    models: [\n' +
'        { id: \'1\', name: \'GPT-4\', icon: \'smart_toy\', description: \'Advanced reasoning\' },\n' +
'        { id: \'2\', name: \'Claude\', icon: \'psychology\', description: \'Analysis expert\' },\n' +
'        { id: \'3\', name: \'Gemini\', icon: \'auto_awesome\', description: \'Multimodal AI\' }\n' +
'    ],\n' +
'    selectedModel: { id: \'2\', name: \'Claude\' },\n' +
'    useLocalHistory: true,\n' +
'    paginatedMessages: true,\n' +
'    settingsRenderer: (container) => {\n' +
'        // Custom settings panel\n' +
'        const settings = document.createElement(\'div\');\n' +
'        settings.innerHTML = \n' +
'            \'<h3>Custom Settings</h3>\' +\n' +
'            \'<label><input type="checkbox" id="dark-mode"> Dark Mode</label>\' +\n' +
'            \'<label><input type="checkbox" id="notifications"> Notifications</label>\' +\n' +
'            \'<label><input type="checkbox" id="auto-save"> Auto-save</label>\';\n' +
'        container.appendChild(settings);\n' +
'    }\n' +
'});\n' +
'\n' +
'// Example: Dynamic feature toggling\n' +
'const toggleFeature = (feature, enabled) => {\n' +
'    chatService.setDisabledFeatures({\n' +
'        [feature]: !enabled\n' +
'    });\n' +
'};\n' +
'\n' +
'// Example: Live configuration updates\n' +
'const updateConfiguration = () => {\n' +
'    chatService.patchConfig({\n' +
'        useLocalHistory: document.getElementById(\'local-history\').checked,\n' +
'        paginatedMessages: document.getElementById(\'pagination\').checked\n' +
'    });\n' +
'};\n' +
'\n' +
'// Example: Test all message types\n' +
'const testMessages = () => {\n' +
'    // Regular message\n' +
'    chatService.sendResponse({\n' +
'        content: \'This is a regular message with **markdown** support.\'\n' +
'    });\n' +
'    \n' +
'    // Message with actions\n' +
'    chatService.sendResponse({\n' +
'        content: \'Message with custom actions:\',\n' +
'        actions: [{ name: \'test\', label: \'Test Action\', eventName: \'test-action\' }]\n' +
'    });\n' +
'    \n' +
'    // Streaming message\n' +
'    const words = \'This is a streaming response.\'.split(\' \');\n' +
'    words.forEach((word, index) => {\n' +
'        setTimeout(() => {\n' +
'            chatService.sendResponse({\n' +
'                id: \'stream-test\',\n' +
'                content: words.slice(0, index + 1).join(\' \'),\n' +
'                stream: true,\n' +
'                done: index === words.length - 1\n' +
'            });\n' +
'        }, index * 200);\n' +
'    });\n' +
'};\n' +
'\n' +
'// Example: Complete playground setup\n' +
'const setupPlayground = () => {\n' +
'    chatService.open();\n' +
'    \n' +
'    // Set sample history\n' +
'    chatService.setHistory([\n' +
'        { id: \'1\', name: \'Test Session 1\', timestamp: new Date().toISOString() },\n' +
'        { id: \'2\', name: \'Test Session 2\', timestamp: new Date().toISOString() }\n' +
'    ]);\n' +
'    \n' +
'    // Set suggestions\n' +
'    chatService.setSuggestions([\n' +
'        { label: \'Test Feature\', prompt: \'Test a specific feature\' },\n' +
'        { label: \'Help\', prompt: \'Show available commands\' }\n' +
'    ]);\n' +
'};</pre>\n' +
'</div>\n' +
'\n' +
'**Features demonstrated:**\n' +
'- Live feature toggles\n' +
'- Real-time configuration\n' +
'- All chat capabilities\n' +
'- Developer testing interface\n',
    };

    return storySpecificDocs[storyId] || '';
};
