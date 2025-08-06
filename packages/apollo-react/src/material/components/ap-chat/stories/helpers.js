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
                                content: words[index] + (index < words.length - 1 ? ' ' : ''),
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

                // Define conversation data
                const conversations = {
                    'conv1': [
                        {
                            id: '1',
                            role: 'user',
                            content: 'How do I extract data from PDF invoices using Document Understanding?',
                            created_at: new Date(Date.now() - 86400000).toISOString(),
                        },
                        {
                            id: '2',
                            role: 'assistant',
                            // eslint-disable-next-line max-len
                            content: 'To extract data from PDF invoices using Document Understanding:\n\n**1. Set up the environment:**\n- Install UiPath.IntelligentOCR.Activities package\n- Configure your Document Understanding license\n\n**2. Create the workflow:**\n- Add "Digitize Document" activity for OCR\n- Use "Data Extraction Scope" for field extraction\n- Configure "Extract Document Text" for text processing\n\n**3. Train or use pre-built models:**\n- For invoices, use the pre-built Invoice model\n- Train custom models for specific invoice formats\n- Set confidence thresholds for validation\n\n**4. Handle the extracted data:**\n- Use "Get OCR Text" to retrieve text\n- Parse structured data with "Extract Document Data"\n- Validate results and handle exceptions\n\nWould you like me to explain any of these steps in more detail?',
                            created_at: new Date(Date.now() - 86300000).toISOString(),
                        },
                    ],
                    'conv2': [
                        {
                            id: '1',
                            role: 'user',
                            content: 'What are the best practices for setting up Document Understanding workflows?',
                            created_at: new Date(Date.now() - 172800000).toISOString(),
                        },
                        {
                            id: '2',
                            role: 'assistant',
                            // eslint-disable-next-line max-len
                            content: 'Here are the key best practices for Document Understanding workflows:\n\n**Workflow Design:**\n- Use separate workflows for different document types\n- Implement proper error handling with Try-Catch blocks\n- Add logging for debugging and monitoring\n\n**Model Training:**\n- Provide diverse training samples (50-100 documents minimum)\n- Include edge cases and variations in your training set\n- Regularly retrain models with new document formats\n\n**Performance Optimization:**\n- Use appropriate OCR engines for your document quality\n- Set optimal confidence thresholds (typically 70-85%)\n- Implement parallel processing for batch operations\n\n**Data Validation:**\n- Add validation rules for extracted data\n- Implement human-in-the-loop for low-confidence results\n- Use data normalization for consistent output formats',
                            created_at: new Date(Date.now() - 172700000).toISOString(),
                        },
                    ],
                    'conv3': [
                        {
                            id: '1',
                            role: 'user',
                            content: 'How do I integrate Document Understanding with external APIs?',
                            created_at: new Date(Date.now() - 259200000).toISOString(),
                        },
                        {
                            id: '2',
                            role: 'assistant',
                            // eslint-disable-next-line max-len
                            content: 'Integrating Document Understanding with external APIs involves several steps:\n\n**API Integration Approaches:**\n- Use HTTP Request activities to send extracted data\n- Implement webhook endpoints for real-time processing\n- Set up queue-based processing for high-volume scenarios\n\n**Data Format Considerations:**\n- Convert extracted data to JSON or XML formats\n- Map document fields to API parameters\n- Handle data type conversions and validation\n\n**Error Handling:**\n- Implement retry logic for API failures\n- Add circuit breaker patterns for unreliable APIs\n- Log API responses for troubleshooting\n\n**Security Best Practices:**\n- Use secure authentication (API keys, OAuth)\n- Encrypt sensitive data in transit\n- Implement proper access controls and rate limiting\n\nWould you like specific examples for any of these integration patterns?',
                            created_at: new Date(Date.now() - 259100000).toISOString(),
                        },
                    ],
                };

                // Check if there's an active conversation and load it
                const activeConversationId = chatService.activeConversationId;
                if (activeConversationId && conversations[activeConversationId]) {
                    setTimeout(() => {
                        chatService.setConversation(conversations[activeConversationId]);
                    }, 100);
                }

                // Set up conversation opening functionality
                chatService.on('openConversation', (conversationId) => {
                    // Use setTimeout to ensure loading state is set first
                    setTimeout(() => {
                        if (conversations[conversationId]) {
                            chatService.setConversation(conversations[conversationId]);
                        }
                    }, 100);
                });
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

        case 'citations':
            setTimeout(() => {
                chatService.sendRequest({ content: 'Tell me about NBA championships' });
                setTimeout(() => {
                    chatService.sendResponse({
                        contentParts: [
                            {
                                text: '# NBA Championship Analysis',
                                citations: [],
                            },
                            {
                                text: 'The NBA Finals are the annual championship series of the National Basketball Association (NBA).',
                                citations: [
                                    {
                                        id: 1,
                                        title: 'NBA Official Finals Overview',
                                        url: 'https://www.nba.com/history/finals',
                                    },
                                ],
                            },
                            {
                                // eslint-disable-next-line max-len
                                text: 'The Boston Celtics have won the most championships in NBA history, followed closely by the Los Angeles Lakers.',
                                citations: [
                                    {
                                        id: 2,
                                        title: 'NBA Team Championships - Basketball Reference',
                                        url: 'https://www.basketball-reference.com/leagues/NBA_2024.html#champions',
                                    },
                                    {
                                        id: 3,
                                        title: 'Celtics vs Lakers Rivalry - ESPN',
                                        url: 'https://www.espn.com/nba/story/_/id/29325513/celtics-vs-lakers-nba-most-storied-rivalry',
                                    },
                                ],
                            },
                            {
                                text: '## Recent Champions',
                                citations: [],
                            },
                            {
                                text: '| Year | Champion | Finals MVP |',
                                citations: [],
                            },
                            {
                                text: '|------|----------|------------|',
                                citations: [],
                            },
                            {
                                text: '| 2023-24 | Boston Celtics | Jaylen Brown |',
                                citations: [
                                    {
                                        id: 4,
                                        title: '2024 NBA Finals Recap',
                                        url: 'https://www.nba.com/news/2024-finals-recap',
                                    },
                                ],
                            },
                            {
                                text: '| 2022-23 | Denver Nuggets | Nikola Jokić |',
                                citations: [
                                    {
                                        id: 5,
                                        title: '2023 NBA Finals Summary',
                                        url: 'https://www.nba.com/news/2023-finals-summary',
                                    },
                                ],
                            },
                        ],
                    });
                }, 1000);
            }, 500);
            break;

        case 'streaming-citations':
            setTimeout(() => {
                chatService.sendRequest({ content: 'What are the best practices for RPA implementation?' });
                setTimeout(() => {
                    const messageId = 'stream-demo-citations';
                    let streamIndex = 0;

                    const streamingParts = [
                        {
                            index: 0,
                            text: '# RPA Implementation Best Practices',
                            citation: null,
                        },
                        {
                            index: 1,
                            text: '\n\nBased on industry research',
                            citation: null,
                        },
                        {
                            index: 1,
                            text: ', successful RPA implementations follow these key principles:',
                            citation: {
                                id: 1,
                                title: 'RPA Best Practices Guide 2024',
                                url: 'https://www.uipath.com/resources/rpa-best-practices',
                            },
                        },
                        {
                            index: 2,
                            text: '\n\n## Key Success Factors',
                            citation: null,
                        },
                        {
                            index: 3,
                            text: '\n\n1. **Process Assessment**',
                            citation: null,
                        },
                        {
                            index: 3,
                            text: ' - Identify automation opportunities through detailed analysis',
                            citation: {
                                id: 2,
                                title: 'Process Mining Whitepaper',
                                download_url: 'https://docs.uipath.com/process-mining.pdf',
                                page_number: 5,
                            },
                        },
                        {
                            index: 4,
                            text: '\n2. **Governance Framework**',
                            citation: null,
                        },
                        {
                            index: 4,
                            text: ' - Establish clear policies and procedures',
                            citation: {
                                id: 3,
                                title: 'CoE Setup Guide',
                                url: 'https://www.uipath.com/coe-setup',
                            },
                        },
                        {
                            index: 5,
                            text: '\n3. **Change Management**',
                            citation: null,
                        },
                        {
                            index: 5,
                            text: ' - Ensure stakeholder buy-in and training',
                            citation: {
                                id: 4,
                                title: 'Change Management Strategies',
                                url: 'https://www.uipath.com/resources/change-management',
                            },
                        },
                        {
                            index: 6,
                            text: '\n\n## Implementation Phases',
                            citation: null,
                        },
                        {
                            index: 7,
                            text: '\n\n| Phase | Duration | Key Activities |',
                            citation: null,
                        },
                        {
                            index: 8,
                            text: '\n|-------|----------|----------------|',
                            citation: null,
                        },
                        {
                            index: 9,
                            text: '\n| Discovery | 2-4 weeks',
                            citation: null,
                        },
                        {
                            index: 9,
                            text: ' | Process identification, ROI analysis |',
                            citation: {
                                id: 5,
                                title: 'Discovery Phase Guide',
                                download_url: 'https://docs.uipath.com/discovery-guide.pdf',
                                page_number: 8,
                            },
                        },
                        {
                            index: 10,
                            text: '\n| Design | 3-6 weeks',
                            citation: null,
                        },
                        {
                            index: 10,
                            text: ' | Solution architecture, technical design |',
                            citation: {
                                id: 6,
                                title: 'Solution Design Template',
                                url: 'https://www.uipath.com/resources/solution-design',
                            },
                        },
                        {
                            index: 11,
                            text: '\n| Development | 4-12 weeks',
                            citation: null,
                        },
                        {
                            index: 11,
                            text: ' | Bot development, testing, validation |',
                            citation: {
                                id: 7,
                                title: 'Development Best Practices',
                                url: 'https://docs.uipath.com/studio/docs/best-practices',
                            },
                        },
                        {
                            index: 12,
                            text: '\n| Deployment | 1-2 weeks',
                            citation: null,
                        },
                        {
                            index: 12,
                            text: ' | Production rollout, monitoring setup |',
                            citation: {
                                id: 8,
                                title: 'Deployment Checklist',
                                download_url: 'https://docs.uipath.com/deployment-checklist.pdf',
                                page_number: 3,
                            },
                        },
                        {
                            index: 13,
                            text: '\n\n## Critical Success Metrics',
                            citation: null,
                        },
                        {
                            index: 14,
                            text: '\n\n- **ROI**: Average 300% within first year',
                            citation: {
                                id: 9,
                                title: 'RPA ROI Report 2024',
                                url: 'https://www.uipath.com/resources/roi-report',
                            },
                        },
                        {
                            index: 15,
                            text: '\n- **Accuracy**: 99.5% process accuracy',
                            citation: {
                                id: 10,
                                title: 'Automation Metrics Study',
                                download_url: 'https://research.uipath.com/metrics-2024.pdf',
                                page_number: 15,
                            },
                        },
                        {
                            index: 16,
                            text: '\n- **Time Savings**: 65% reduction in process time',
                            citation: {
                                id: 11,
                                title: 'Efficiency Gains Analysis',
                                url: 'https://www.uipath.com/resources/efficiency-report',
                            },
                        },
                    ];

                    const interval = setInterval(() => {
                        if (streamIndex < streamingParts.length) {
                            const chunk = streamingParts[streamIndex];
                            chatService.sendResponse({
                                id: messageId,
                                contentPartChunk: {
                                    index: chunk.index,
                                    text: chunk.text,
                                    ...(chunk.citation && { citation: chunk.citation }),
                                },
                                stream: true,
                                done: false,
                            });
                            streamIndex++;
                        } else {
                            clearInterval(interval);
                            chatService.sendResponse({
                                id: messageId,
                                contentPartChunk: {
                                    index: 16,
                                    text: '',
                                },
                                stream: true,
                                done: true,
                            });
                        }
                    }, 50);
                }, 1000);
            }, 500);
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

The autopilot chat is automatically available when using ap-shell (the standard container for UiPath applications). A default chat service is provided on \`window.PortalShell.AutopilotChat\` that is automatically bound to the chat component.

## Standalone Implementation

For standalone usage outside of ap-shell:

<div style="margin: 15px 0; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
<strong>⚠️ Important:</strong> When using Autopilot Chat outside of ap-shell, use <strong>embedded mode</strong> for use cases where the chat height is not <code>100vh - 48px</code> (the standard app-bar height). In general, if not used within ap-shell, it should be used in embedded mode to ensure proper height management and integration with your application's layout.
</div>

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Basic Setup</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">// Initialize autopilot chat service
const chatService = window.PortalShell.AutopilotChat;

chatService.initialize({
    mode: 'side-by-side',
    firstRunExperience: {
        title: 'Welcome to Autopilot Chat',
        description: 'Ask me anything about automation!',
        suggestions: [
            { label: 'Get started', prompt: 'How do I get started with UiPath Studio?' },
            { label: 'Best practices', prompt: 'What are the best practices for RPA development?' },
            { label: 'Debug workflow', prompt: 'How can I debug my automation workflow?' }
        ]
    }
});

// Bind to component and open
const chatElement = document.querySelector('ap-autopilot-chat');
chatElement.chatServiceInstance = chatService;
chatService.open();</pre>
</div>

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Embedded Mode Setup (Recommended for Standalone)</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">// Initialize with embedded mode for custom container
const container = document.querySelector('.chat-container');
const chatService = window.PortalShell.AutopilotChat;

chatService.initialize({
    mode: 'embedded',
    embeddedContainer: container,
    firstRunExperience: {
        title: 'Welcome to Autopilot Chat',
        description: 'Ask me anything about automation!',
        suggestions: [
            { label: 'Get started', prompt: 'How do I get started with UiPath Studio?' },
            { label: 'Best practices', prompt: 'What are the best practices for RPA development?' },
            { label: 'Debug workflow', prompt: 'How can I debug my automation workflow?' }
        ]
    }
});

// Open in embedded mode
chatService.open({
    mode: 'embedded',
    embeddedContainer: container
});</pre>
</div>

## Key Features

The component includes:
- Clean, default chat interface
- Side-by-side layout 
- Basic chat functionality
- Configurable feature toggles

**Features demonstrated:**
- Basic chat service initialization
- Simple configuration setup  
- Component binding
- Default chat interface

## Documentation

For complete API reference and advanced usage examples, see the <a href="https://github.com/UiPath/apollo-design-system/blob/master/packages/apollo-react/src/material/components/ap-chat/DOCS.md" target="_blank">official Autopilot Chat documentation</a>.
        `,
        'basic-conversation': `
# Basic Conversation Demo

Demonstrates a pre-loaded conversation to show message history and basic chat functionality.

## Implementation

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Basic Conversation Setup</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">import { AutopilotChatService } from '@uipath/portal-shell-util';

// Initialize chat service for this story
const instanceName = 'chat-story-basic-conversation';
const chatService = AutopilotChatService.Instantiate({ instanceName });

// Initialize with minimal configuration
// Note: Settings and audio are disabled by default in ChatService
const config = {
    mode: 'side-by-side'
};

chatService.initialize(config);

// Set up the basic conversation
const basicConversation = [
    {
        id: '1',
        role: 'user',
        content: 'How do I create a new automation project?'
    },
    {
        id: '2',
        role: 'assistant',
        content: 'To create a new automation project in UiPath Studio:\\n\\n1. Open UiPath Studio\\n2. Click on "New Project" from the home screen\\n3. Choose your project type (Process, Library, etc.)\\n4. Give your project a meaningful name\\n5. Select the appropriate dependencies\\n6. Click "Create" to initialize your project\\n\\nWould you like me to explain any of these steps in more detail?'
    }
];

// Load the conversation after a brief delay for demo effect
setTimeout(() => {
    chatService.setConversation(basicConversation);
}, 500);

// Open the chat
chatService.open({ mode: 'side-by-side' });</pre>
</div>

**Features demonstrated:**
- Pre-populated conversation with realistic UiPath content
- User and assistant message roles
- Multi-line assistant responses with step-by-step instructions
- Delayed conversation loading (500ms) for demo effect
- Minimal configuration setup

## Documentation

For complete API reference and advanced usage examples, see the <a href="https://github.com/UiPath/apollo-design-system/blob/master/packages/apollo-react/src/material/components/ap-chat/DOCS.md" target="_blank">official Autopilot Chat documentation</a>.
        `,
        'streaming-response': `
# Streaming Response Demo

Shows real-time streaming of responses with comprehensive technical content, simulating AI assistant typing effect.

## Code Example

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Streaming Implementation</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">import { AutopilotChatService } from '@uipath/portal-shell-util';

// Initialize chat service
const chatService = AutopilotChatService.Instantiate({ instanceName: 'streaming-demo' });
chatService.initialize({ mode: 'side-by-side' });

// Send initial user request
chatService.sendRequest({
    content: 'How do I handle errors in RPA workflows?'
});

// Stream a concise response about RPA error handling
const streamResponse = () => {
    const response = \`For robust error handling in RPA workflows, implement these key strategies:

**Try-Catch Blocks:** Use try-catch at process and activity levels to capture exceptions gracefully.

**Retry Logic:** Configure intelligent retry mechanisms with delays for transient failures like network issues.

**Logging:** Add comprehensive logging to track errors and workflow execution for debugging.

**Recovery:** Implement checkpoint-restart capabilities to resume from failure points.

These practices will make your automations more reliable and easier to maintain in production.\`;

    const words = response.split(' ');
    const streamId = 'comprehensive-stream';
    let index = 0;
    
    const interval = setInterval(() => {
        if (index < words.length) {
            // Send one word at a time
            chatService.sendResponse({
                id: streamId,
                content: words[index] + (index < words.length - 1 ? ' ' : ''),
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
    }, 100); // 100ms delay between words for realistic typing effect
};

// Start streaming after a brief delay
setTimeout(streamResponse, 1000);

chatService.open();</pre>
</div>

**Features demonstrated:**
- Concise technical content streaming
- Progressive text rendering simulating AI response generation
- Structured content with headings and key points
- Real-time message updates with completion handling
- Realistic timing for practical demonstration

## Documentation

For complete API reference and advanced usage examples, see the <a href="https://github.com/UiPath/apollo-design-system/blob/master/packages/apollo-react/src/material/components/ap-chat/DOCS.md" target="_blank">official Autopilot Chat documentation</a>.
        `,
        'with-attachments': `
# File Attachments Demo

Demonstrates file attachment capabilities with workflow file analysis.

## Code Example

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Implementation Code</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">import { AutopilotChatService } from '@uipath/portal-shell-util';

// Initialize chat service
const chatService = AutopilotChatService.Instantiate({ instanceName: 'attachments-demo' });
chatService.initialize({ mode: 'side-by-side' });

// Configure allowed attachments for workflow files
chatService.setAllowedAttachments({
    types: {
        'application/xml': ['.xaml'],       // Workflow files
        'application/json': ['.json'],      // Config files
        'text/plain': ['.txt', '.log']      // Text and log files
    },
    maxSize: 2 * 1024 * 1024, // 2MB limit
    multiple: false           // Single file upload
});

// Set up demo conversation with file attachment
const attachmentConversation = [
    {
        id: '1',
        role: 'user',
        content: 'Can you analyze this workflow file?',
        attachments: [{
            name: 'workflow.xaml',
            size: 12450,
            type: 'application/xml'
        }]
    },
    {
        id: '2',
        role: 'assistant',
        content: 'I\\'ve analyzed your workflow file. Here are my findings:\\n\\n**Workflow Overview:**\\n- Process Name: Invoice Processing\\n- Activities Count: 47\\n- Decision Points: 5\\n- Error Handlers: 3\\n\\n**Recommendations:**\\n1. Consider adding more error handling for the data extraction section\\n2. The retry mechanism could be optimized\\n3. Add logging for better debugging\\n\\nWould you like me to provide more specific suggestions?'
    }
];

// Load the conversation
chatService.setConversation(attachmentConversation);

chatService.open();</pre>
</div>

**Features demonstrated:**
- Workflow-specific file attachment configuration
- Single file upload with size restrictions  
- Pre-loaded conversation showing file analysis
- Detailed AI response with structured findings and recommendations

**File Upload Methods:**
- <strong>Attachment Button</strong>: Click the attachment button to open file browser
- <strong>Copy & Paste</strong>: Use Ctrl+C and Ctrl+V to paste valid files directly into the chat
- <strong>Drag & Drop</strong>: Drag files from your file explorer directly into the chat area

## Documentation

For complete API reference and advanced usage examples, see the <a href="https://github.com/UiPath/apollo-design-system/blob/master/packages/apollo-react/src/material/components/ap-chat/DOCS.md" target="_blank">official Autopilot Chat documentation</a>.
        `,
        'with-history': `
# Conversation History Demo

Shows the history management features and local storage with interactive conversation opening.

## Code Examples

<h3>With Local History (Demo/POC)</h3>

<div style="margin: 15px 0; padding: 15px; background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px;">
<strong>ℹ️ Note:</strong> Local history using <code>useLocalHistory: true</code> is primarily intended for <strong>demos and proof-of-concepts</strong>. For production applications, implement custom history management by handling <code>openConversation</code>, <code>deleteConversation</code>, and other events to integrate with your backend storage system.
</div>

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #ffc107;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Local Storage Implementation (Demo Only)</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">// Enable local history storage - that's it!
chatService.initialize({
    useLocalHistory: true
});

// Local history automatically handles:
// - Conversation persistence to IndexedDB
// - History panel population 
// - Loading conversations when clicked
// - Saving new messages
// - Active conversation restoration</pre>
</div>

<h3>With Custom History (Mock Example)</h3>

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Custom History Implementation (Used in this Storybook)</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">// Initialize without local history
chatService.initialize({
    useLocalHistory: false
});

// Set up mock conversation history
const historyItems = [
    {
        id: 'conv1',
        name: 'Invoice Processing Help',
        timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
        id: 'conv2', 
        name: 'Document Understanding Setup',
        timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
    },
    {
        id: 'conv3',
        name: 'API Integration Questions', 
        timestamp: new Date(Date.now() - 259200000).toISOString() // 3 days ago
    }
];

// Apply history and show panel
chatService.setHistory(historyItems);
chatService.toggleHistory(true);

// Define mock conversation data
const conversations = {
    'conv1': [
        {
            id: '1',
            role: 'user', 
            content: 'How do I extract data from PDF invoices using Document Understanding?',
            created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: '2',
            role: 'assistant',
            content: 'To extract data from PDF invoices using Document Understanding...',
            created_at: new Date(Date.now() - 86300000).toISOString()
        }
    ],
    // ... more conversations
};

// Check if there's an active conversation and load it automatically
const activeConversationId = chatService.activeConversationId;
if (activeConversationId && conversations[activeConversationId]) {
    setTimeout(() => {
        chatService.setConversation(conversations[activeConversationId]);
    }, 100);
}

// Handle history item selection with conversation loading
chatService.on('openConversation', (conversationId) => {
    // Use setTimeout to avoid race conditions with loading state
    setTimeout(() => {
        if (conversations[conversationId]) {
            chatService.setConversation(conversations[conversationId]);
        }
    }, 100);
});</pre>
</div>

**Local History Features:**
- Built-in IndexedDB storage for demos and POCs
- Automatic conversation persistence and restoration
- Interactive conversation loading when history items are clicked
- Automatic loading of active conversation on initialization

**Custom History Features (Production):**
- Backend integration with your API endpoints
- Secure conversation storage with authentication
- Error handling and loading states
- Event-driven architecture for conversation management
- Proper separation of concerns between UI and data layer

## Documentation

For complete API reference and advanced usage examples, see the <a href="https://github.com/UiPath/apollo-design-system/blob/master/packages/apollo-react/src/material/components/ap-chat/DOCS.md" target="_blank">official Autopilot Chat documentation</a>.
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
        fullScreen: true   // Disable fullscreen
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

**Features demonstrated:**
- Floating chat widget positioned in bottom-right corner
- Custom container styling and positioning
- Embedded mode configuration with disabled resize and fullscreen
- Integration with existing application layouts
- Interactive demo controls for testing embedded functionality

## Documentation

For complete API reference and advanced usage examples, see the <a href="https://github.com/UiPath/apollo-design-system/blob/master/packages/apollo-react/src/material/components/ap-chat/DOCS.md" target="_blank">official Autopilot Chat documentation</a>.
        `,
        'full-screen-mode': `
# Full Screen Mode Demo

Shows the chat in full-screen overlay mode.

## Code Example

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Implementation Code</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">// Initialize and open in full-screen mode
chatService.open({
    mode: 'full-screen'
});</pre>
</div>

**Features demonstrated:**
- Full-screen overlay interface
- Maximized chat experience

## Documentation

For complete API reference and advanced usage examples, see the <a href="https://github.com/UiPath/apollo-design-system/blob/master/packages/apollo-react/src/material/components/ap-chat/DOCS.md" target="_blank">official Autopilot Chat documentation</a>.
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

## Documentation

For complete API reference and advanced usage examples, see the <a href="https://github.com/UiPath/apollo-design-system/blob/master/packages/apollo-react/src/material/components/ap-chat/DOCS.md" target="_blank">official Autopilot Chat documentation</a>.
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
        title: 'Custom Title'
    }
});

chatService.open();</pre>
</div>

**Features demonstrated:**
- Custom input placeholder
- Custom footer disclaimer
- Custom title
- Label override system

## Documentation

For complete API reference and advanced usage examples, see the <a href="https://github.com/UiPath/apollo-design-system/blob/master/packages/apollo-react/src/material/components/ap-chat/DOCS.md" target="_blank">official Autopilot Chat documentation</a>.
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

## Documentation

For complete API reference and advanced usage examples, see the <a href="https://github.com/UiPath/apollo-design-system/blob/master/packages/apollo-react/src/material/components/ap-chat/DOCS.md" target="_blank">official Autopilot Chat documentation</a>.
        `,
        'interactive-features': `
# Interactive Features Demo

Shows interactive chat capabilities with suggestions, loading states, models, and custom actions.

## Code Example

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Interactive Features Setup</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">// Set up loading messages
chatService.setDefaultLoadingMessages([
    'Analyzing your request...', 
    'Processing data...', 
    'Generating response...',
    'Almost ready...'
], 1500);

// Set up suggestion buttons
chatService.setSuggestions([
    {
        label: 'Create Workflow',
        prompt: 'Help me create a new automation workflow'
    },
    {
        label: 'Debug Process',
        prompt: 'I need help debugging my automation process'
    },
    {
        label: 'Best Practices',
        prompt: 'Show me automation best practices'
    },
    {
        label: 'API Integration',
        prompt: 'How do I integrate with external APIs?'
    }
], true);

// Send message with custom actions
chatService.sendResponse({
    content: 'Here are some interactive actions you can try:',
    groupId: 'custom-actions-demo',
    actions: [
        {
            name: 'create',
            label: 'Create Project',
            icon: 'add_circle',
            eventName: 'create-project-action',
            details: { type: 'automation' }
        },
        {
            name: 'analyze',
            label: 'Analyze Code',
            icon: 'analytics',
            eventName: 'analyze-code-action'
        },
        {
            name: 'deploy',
            label: 'Deploy Process',
            icon: 'rocket_launch',
            showInOverflow: true,
            eventName: 'deploy-process-action'
        },
        {
            name: 'help',
            label: 'Get Help',
            icon: 'help',
            showInOverflow: true,
            eventName: 'help-action'
        }
    ]
});

// Handle action events with responses
chatService.on('download-action', ({ action }) => {
    console.log('Download action triggered:', action.details.filename);
    chatService.sendResponse({
        content: 'Downloaded: ' + action.details.filename,
        groupId: 'download-response'
    });
});

chatService.on('create-project-action', ({ action }) => {
    console.log('Create project action triggered:', action.details.type);
    chatService.sendResponse({
        content: 'Created new ' + action.details.type + ' project! You can now start building your automation workflow.',
        groupId: 'create-project-response'
    });
});

chatService.on('analyze-code-action', () => {
    console.log('Analyze code action triggered');
    chatService.sendResponse({
        content: 'Code analysis completed:\\n\\nNo syntax errors found\\n2 optimization suggestions\\nCode complexity: Medium\\n\\nWould you like details on the optimization suggestions?',
        groupId: 'analyze-code-response'
    });
});

chatService.on('deploy-process-action', () => {
    console.log('Deploy process action triggered');
    chatService.sendResponse({
        content: 'Deployment initiated...\\n\\nBuilding process...\\nProcess deployed successfully!\\n\\n**Deployment Details:**\\n- Environment: Production\\n- Version: 1.2.3\\n- Status: Active',
        groupId: 'deploy-process-response'
    });
});

chatService.on('help-action', () => {
    console.log('Help action triggered');
    chatService.sendResponse({
        content: '**Available Commands:**\\n\\n• Type "create" to start a new project\\n• Type "debug" for troubleshooting help\\n• Type "examples" to see sample workflows\\n• Type "docs" for documentation links\\n\\nWhat would you like help with?',
        groupId: 'help-response'
    });
});</pre>
</div>

**Features demonstrated:**
- Default loading messages with custom duration
- Suggestion buttons for quick prompts
- Model selection dropdown
- Paginated message display
- Custom action buttons (download and share)
- Action event handling

## Documentation

For complete API reference and advanced usage examples, see the <a href="https://github.com/UiPath/apollo-design-system/blob/master/packages/apollo-react/src/material/components/ap-chat/DOCS.md" target="_blank">official Autopilot Chat documentation</a>.
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
'        }, index * 50);\n' +
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
'- Developer testing interface\n\n' +
'## Documentation\n\n' +
// eslint-disable-next-line max-len
'For complete API reference and advanced usage examples, see the <a href="https://github.com/UiPath/apollo-design-system/blob/master/packages/apollo-react/src/material/components/ap-chat/DOCS.md" target="_blank">official Autopilot Chat documentation</a>.\n',
        'error-handling': `
# Error Handling Demo

Demonstrates error handling capabilities including setting and clearing error states.

## Implementation

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #dc3545;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Basic Error Management</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">import { AutopilotChatService } from '@uipath/portal-shell-util';

// Initialize chat service
const instanceName = 'chat-story-error-handling';
const chatService = AutopilotChatService.Instantiate({ instanceName });

// Configure with error handling
chatService.initialize({
    mode: 'side-by-side',
    disabledFeatures: {
        settings: true,
        // ... other features
    },
});

// Setting an error message
chatService.setError('❌ Something went wrong! Please try again.');

// The error will be displayed above the prompt box

// Clearing the error - removes error display from above the prompt box
chatService.clearError();

// Checking current error state
const currentError = chatService.getError();
if (currentError) {
    console.log('Current error:', currentError);
} else {
    console.log('No error currently set');
}

// Open the chat
chatService.open({ mode: 'side-by-side' });</pre>
</div>

## Demo Controls

<div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #6c757d;">
<div style="display: flex; gap: 10px; flex-wrap: wrap;">
<button id="set-error-demo" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">Set Error</button>
<button id="clear-error-demo" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">Clear Error</button>
</div>
</div>

**Features demonstrated:**
- Setting error messages with \`setError()\`
- Clearing errors with \`clearError()\`
- Checking error state with \`getError()\`
- Error state display in chat interface
- Interactive error state management

## Documentation

For complete API reference and advanced usage examples, see the <a href="https://github.com/UiPath/apollo-design-system/blob/master/packages/apollo-react/src/material/components/ap-chat/DOCS.md" target="_blank">official Autopilot Chat documentation</a>.
        `,
        'settings': `
# Custom Settings Demo

Demonstrates how to create a custom settings panel using the settingsRenderer function.

## Implementation

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Settings Panel Implementation</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">import { AutopilotChatService } from '@uipath/portal-shell-util';

// Create custom settings renderer function
const settingsRenderer = (element) => {
    element.innerHTML = \`
        &lt;div style="padding: 20px; font-family: system-ui;"&gt;
            &lt;h3 style="margin-top: 0; margin-bottom: 20px; color: #2c3e50;"&gt;Chat Settings&lt;/h3&gt;
            
            &lt;div style="margin-bottom: 20px;"&gt;
                &lt;h4 style="margin-bottom: 10px; color: #34495e;"&gt;Appearance&lt;/h4&gt;
                &lt;label style="display: block; margin-bottom: 8px; cursor: pointer;"&gt;
                    &lt;input type="checkbox" id="dark-mode" style="margin-right: 8px;" /&gt;
                    Dark mode
                &lt;/label&gt;
                &lt;label style="display: block; margin-bottom: 8px; cursor: pointer;"&gt;
                    &lt;input type="checkbox" id="compact-view" style="margin-right: 8px;" /&gt;
                    Compact view
                &lt;/label&gt;
            &lt;/div&gt;

            &lt;div style="margin-bottom: 20px;"&gt;
                &lt;h4 style="margin-bottom: 10px; color: #34495e;"&gt;Notifications&lt;/h4&gt;
                &lt;label style="display: block; margin-bottom: 8px; cursor: pointer;"&gt;
                    &lt;input type="checkbox" id="sound-enabled" checked style="margin-right: 8px;" /&gt;
                    Sound notifications
                &lt;/label&gt;
                &lt;label style="display: block; margin-bottom: 8px; cursor: pointer;"&gt;
                    &lt;input type="checkbox" id="desktop-notifications" style="margin-right: 8px;" /&gt;
                    Desktop notifications
                &lt;/label&gt;
            &lt;/div&gt;

            &lt;div style="margin-bottom: 20px;"&gt;
                &lt;h4 style="margin-bottom: 10px; color: #34495e;"&gt;Language&lt;/h4&gt;
                &lt;select id="language-select" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"&gt;
                    &lt;option value="en"&gt;English&lt;/option&gt;
                    &lt;option value="es"&gt;Español&lt;/option&gt;
                    &lt;option value="fr"&gt;Français&lt;/option&gt;
                    &lt;option value="de"&gt;Deutsch&lt;/option&gt;
                    &lt;option value="ja"&gt;日本語&lt;/option&gt;
                &lt;/select&gt;
            &lt;/div&gt;

            &lt;div style="margin-bottom: 20px;"&gt;
                &lt;h4 style="margin-bottom: 10px; color: #34495e;"&gt;Advanced&lt;/h4&gt;
                &lt;label style="display: block; margin-bottom: 8px; cursor: pointer;"&gt;
                    &lt;input type="checkbox" id="auto-save" checked style="margin-right: 8px;" /&gt;
                    Auto-save conversations
                &lt;/label&gt;
                &lt;label style="display: block; margin-bottom: 8px; cursor: pointer;"&gt;
                    &lt;input type="checkbox" id="typing-indicator" checked style="margin-right: 8px;" /&gt;
                    Show typing indicator
                &lt;/label&gt;
            &lt;/div&gt;

            &lt;div style="border-top: 1px solid #eee; padding-top: 15px;"&gt;
                &lt;button id="save-settings" style="background: #007acc; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;"&gt;Save Settings&lt;/button&gt;
                &lt;button id="reset-settings" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;"&gt;Reset&lt;/button&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    \`;

    // Add event listeners
    const saveButton = element.querySelector('#save-settings');
    const resetButton = element.querySelector('#reset-settings');
    
    saveButton.addEventListener('click', () =&gt; {
        const settings = {
            darkMode: element.querySelector('#dark-mode').checked,
            compactView: element.querySelector('#compact-view').checked,
            soundEnabled: element.querySelector('#sound-enabled').checked,
            desktopNotifications: element.querySelector('#desktop-notifications').checked,
            language: element.querySelector('#language-select').value,
            autoSave: element.querySelector('#auto-save').checked,
            typingIndicator: element.querySelector('#typing-indicator').checked,
        };
        
        
        chatService.sendResponse({
            content: \`✅ Settings saved successfully!

            Current Configuration:
            - Theme: \${settings.darkMode ? 'Dark' : 'Light'}
            - Layout: \${settings.compactView ? 'Compact' : 'Standard'}
            - Sound: \${settings.soundEnabled ? 'Enabled' : 'Disabled'}
            - Desktop Notifications: \${settings.desktopNotifications ? 'Enabled' : 'Disabled'}
            - Language: \${settings.language.toUpperCase()}
            - Auto-save: \${settings.autoSave ? 'On' : 'Off'}
            - Typing Indicator: \${settings.typingIndicator ? 'On' : 'Off'}

            Your preferences have been updated.\`
        });
        
        setTimeout(() =&gt; chatService.toggleSettings(false), 2000);
    });
    
    resetButton.addEventListener('click', () =&gt; {
        // Reset to defaults
        element.querySelector('#dark-mode').checked = false;
        element.querySelector('#compact-view').checked = false;
        element.querySelector('#sound-enabled').checked = true;
        element.querySelector('#desktop-notifications').checked = false;
        element.querySelector('#language-select').value = 'en';
        element.querySelector('#auto-save').checked = true;
        element.querySelector('#typing-indicator').checked = true;
        
        chatService.sendResponse({
            content: '🔄 Settings reset to default values.'
        });
    });
};

// Configure with settings enabled
chatService.initialize({
    mode: 'side-by-side',
    disabledFeatures: {
        settings: false,  // Enable settings for this story
        // ... other features
    },
    settingsRenderer: settingsRenderer,
});

chatService.open({ mode: 'side-by-side' });</pre>
</div>

**Features demonstrated:**
- Custom settings panel with multiple sections
- Form controls (checkboxes, select dropdowns)
- Event handling for save and reset actions
- Real-time configuration updates
- User feedback through chat responses

## Documentation

For complete API reference and advanced usage examples, see the <a href="https://github.com/UiPath/apollo-design-system/blob/master/packages/apollo-react/src/material/components/ap-chat/DOCS.md" target="_blank">official Autopilot Chat documentation</a>.
        `,
        'with-citations': `
# Citations Demo

Demonstrates how to send messages with citations attached to specific text segments, including support for tables and multiple citations per segment.

## Implementation

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Sending Messages with Citations</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">import { AutopilotChatService } from '@uipath/portal-shell-util';

// Initialize chat service
const chatService = AutopilotChatService.Instantiate({ instanceName: 'citations-demo' });
chatService.initialize({ mode: 'side-by-side' });

// Send message with citations using contentParts
chatService.sendResponse({
    contentParts: [
        {
            text: '# NBA Championship Analysis',
            citations: []
        },
        {
            text: 'The NBA Finals are the annual championship series of the National Basketball Association (NBA).',
            citations: [
                {
                    id: 1,
                    title: 'NBA Official Finals Overview',
                    url: 'https://www.nba.com/history/finals'
                }
            ]
        },
        {
            text: 'The Boston Celtics have won the most championships in NBA history.',
            citations: [
                {
                    id: 2,
                    title: 'NBA Team Championships - Basketball Reference',
                    url: 'https://www.basketball-reference.com/leagues/NBA_2024.html'
                },
                {
                    id: 3,
                    title: 'Celtics vs Lakers Rivalry - ESPN',
                    url: 'https://www.espn.com/nba/story/celtics-lakers-rivalry'
                }
            ]
        },
        {
            text: '## Recent Champions',
            citations: []
        },
        {
            text: '| Year | Champion | Finals MVP |',
            citations: []
        },
        {
            text: '|------|----------|------------|',
            citations: []
        },
        {
            text: '| 2023-24 | Boston Celtics | Jaylen Brown |',
            citations: [
                {
                    id: 4,
                    title: '2024 NBA Finals Recap',
                    url: 'https://www.nba.com/news/2024-finals-recap'
                }
            ]
        },
        {
            text: '| 2022-23 | Denver Nuggets | Nikola Jokić |',
            citations: [
                {
                    id: 5,
                    title: '2023 NBA Finals Summary',
                    url: 'https://www.nba.com/news/2023-finals-summary'
                }
            ]
        }
    ]
});

chatService.open();</pre>
</div>

**Features demonstrated:**
- Message segmentation with contentParts array
- Citations attached to specific text segments
- Support for multiple citations per segment
- Table content with row-specific citations
- Mixed content (headers, paragraphs, tables) with selective citations
- URL and download_url citation types

**Citation Object Properties:**
- **id**: Unique identifier for the citation
- **title**: Display title for the citation
- **url**: Web URL for online resources (optional)
- **download_url**: Download URL for files (optional)
- **page_number**: Page reference for documents (optional)

## Documentation

For complete API reference and advanced usage examples, see the <a href="https://github.com/UiPath/apollo-design-system/blob/master/packages/apollo-react/src/material/components/ap-chat/DOCS.md" target="_blank">official Autopilot Chat documentation</a>.
        `,
        'streaming-with-citations': `
# Streaming With Citations Demo

Shows real-time streaming of messages with citations attached to specific chunks as they appear.

## Implementation

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Streaming Implementation with Citations</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">import { AutopilotChatService } from '@uipath/portal-shell-util';

// Initialize chat service
const chatService = AutopilotChatService.Instantiate({ instanceName: 'streaming-citations-demo' });
chatService.initialize({ mode: 'side-by-side' });

// Stream response with citations
const streamCitations = () => {
    const messageId = 'stream-citations-' + Date.now();
    let streamIndex = 0;
    
    const streamingParts = [
        {
            index: 0,
            text: '# RPA Implementation Best Practices',
            citation: null
        },
        {
            index: 1,
            text: '\\n\\nBased on industry research',
            citation: null
        },
        {
            index: 1,
            text: ', successful RPA implementations follow these key principles:',
            citation: {
                id: 1,
                title: 'RPA Best Practices Guide 2024',
                url: 'https://www.uipath.com/resources/rpa-best-practices'
            }
        },
        {
            index: 2,
            text: '\\n\\n## Key Success Factors',
            citation: null
        },
        {
            index: 3,
            text: '\\n\\n1. <strong>Process Assessment</strong>',
            citation: null
        },
        {
            index: 3,
            text: ' - Identify automation opportunities through detailed analysis',
            citation: {
                id: 2,
                title: 'Process Mining Whitepaper',
                download_url: 'https://docs.uipath.com/process-mining.pdf',
                page_number: 5
            }
        },
        {
            index: 4,
            text: '\\n2. <strong>Governance Framework</strong>',
            citation: null
        },
        {
            index: 4,
            text: ' - Establish clear policies and procedures',
            citation: {
                id: 3,
                title: 'CoE Setup Guide',
                url: 'https://www.uipath.com/coe-setup'
            }
        },
        {
            index: 5,
            text: '\\n3. <strong>Change Management</strong>',
            citation: null
        },
        {
            index: 5,
            text: ' - Ensure stakeholder buy-in and training',
            citation: {
                id: 4,
                title: 'Change Management Strategies',
                url: 'https://www.uipath.com/resources/change-management'
            }
        },
        {
            index: 6,
            text: '\\n\\n## Implementation Phases',
            citation: null
        },
        {
            index: 7,
            text: '\\n\\n| Phase | Duration | Key Activities |',
            citation: null
        },
        {
            index: 8,
            text: '\\n|-------|----------|----------------|',
            citation: null
        },
        {
            index: 9,
            text: '\\n| Discovery | 2-4 weeks | Process identification, ROI analysis |',
            citation: {
                id: 5,
                title: 'Discovery Phase Guide',
                download_url: 'https://docs.uipath.com/discovery-guide.pdf',
                page_number: 8
            }
        },
        {
            index: 10,
            text: '\\n| Design | 3-6 weeks | Solution architecture, technical design |',
            citation: {
                id: 6,
                title: 'Solution Design Template',
                url: 'https://www.uipath.com/resources/solution-design'
            }
        },
        {
            index: 11,
            text: '\\n| Development | 4-12 weeks | Bot development, testing, validation |',
            citation: {
                id: 7,
                title: 'Development Best Practices',
                url: 'https://docs.uipath.com/studio/docs/best-practices'
            }
        },
        {
            index: 12,
            text: '\\n| Deployment | 1-2 weeks | Production rollout, monitoring setup |',
            citation: {
                id: 8,
                title: 'Deployment Checklist',
                download_url: 'https://docs.uipath.com/deployment-checklist.pdf',
                page_number: 3
            }
        },
        {
            index: 13,
            text: '\\n\\n## Critical Success Metrics',
            citation: null
        },
        {
            index: 14,
            text: '\\n\\n- <strong>ROI</strong>: Average 300% within first year',
            citation: {
                id: 9,
                title: 'RPA ROI Report 2024',
                url: 'https://www.uipath.com/resources/roi-report'
            }
        },
        {
            index: 15,
            text: '\\n- <strong>Accuracy</strong>: 99.5% process accuracy',
            citation: {
                id: 10,
                title: 'Automation Metrics Study',
                download_url: 'https://research.uipath.com/metrics-2024.pdf',
                page_number: 15
            }
        },
        {
            index: 16,
            text: '\\n- <strong>Time Savings</strong>: 65% reduction in process time',
            citation: {
                id: 11,
                title: 'Efficiency Gains Analysis',
                url: 'https://www.uipath.com/resources/efficiency-report'
            }
        }
    ];
    
    // Handle stop response events
    let isStreaming = true;
    const unsubscribe = chatService.on('stopResponse', () => {
        isStreaming = false;
    });
    
    const streamChunk = () => {
        if (!isStreaming || streamIndex >= streamingParts.length) {
            // Send final chunk to mark completion
            chatService.sendResponse({
                id: messageId,
                contentPartChunk: {
                    index: streamingParts.length > 0 ? 
                           streamingParts[streamingParts.length - 1].index : 0,
                    text: ''
                },
                stream: true,
                done: true
            });
            unsubscribe();
            return;
        }
        
        const chunk = streamingParts[streamIndex];
        
        chatService.sendResponse({
            id: messageId,
            contentPartChunk: {
                index: chunk.index,
                text: chunk.text,
                ...(chunk.citation && { citation: chunk.citation })
            },
            stream: true,
            done: false
        });
        
        streamIndex++;
        setTimeout(streamChunk, 50); // Stream chunk every 50ms
    };
    
    streamChunk();
};

// Send initial request
chatService.sendRequest({ content: 'What are the best practices for RPA implementation?' });

// Start streaming response after a delay
setTimeout(streamCitations, 1000);

chatService.open();</pre>
</div>

**Features demonstrated:**
- Real-time citation streaming with contentPartChunk
- Progressive text rendering with attached citations
- Index-based content segmentation for proper citation placement
- Mixed content chunks (with and without citations)
- Stop response handling to interrupt streaming
- Realistic typing effect with 50ms delays

<strong>Streaming Citation Structure:</strong>
- <strong>index</strong>: Segment index for grouping related chunks
- <strong>text</strong>: Text content to append to the segment
- <strong>citation</strong>: Optional citation object to attach to this chunk
- <strong>stream</strong>: Boolean indicating streaming mode
- <strong>done</strong>: Boolean to mark stream completion

## Documentation

For complete API reference and advanced usage examples, see the <a href="https://github.com/UiPath/apollo-design-system/blob/master/packages/apollo-react/src/material/components/ap-chat/DOCS.md" target="_blank">official Autopilot Chat documentation</a>.
        `,
        'first-run-experience': `
# First Run Experience Demo

Demonstrates the first-run experience configuration with a welcome screen, title, description, and suggestion prompts.

## Implementation

<div style="margin-top: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #9b59b6;">
<h4 style="margin-top: 0; color: #2c3e50; font-size: 14px;">Basic First Run Experience</h4>
<pre style="margin: 0; padding: 10px; background: #2c3e50; color: #ecf0f1; border-radius: 4px; overflow-x: auto; font-size: 12px;">import { AutopilotChatService } from '@uipath/portal-shell-util';

// Initialize chat service
const chatService = AutopilotChatService.Instantiate();

// Configure with first run experience
chatService.initialize({
    mode: 'side-by-side',
    firstRunExperience: {
        title: 'Welcome to Autopilot Chat!',
        description: 'I\\'m here to help you with automation questions, process guidance, and UiPath best practices.',
        suggestions: [
            { label: 'Get Started', prompt: 'How do I begin with UiPath automation?' },
            { label: 'Best Practices', prompt: 'What are UiPath automation best practices?' },
            { label: 'Help & Support', prompt: 'Where can I find help and documentation?' }
        ]
    }
});

// Open the chat
chatService.open({ mode: 'side-by-side' });</pre>
</div>

**Features demonstrated:**
- Welcome screen with custom title and description
- Suggestion buttons for quick start prompts
- First-run experience configuration during initialization
- Clean onboarding flow for new users

## Documentation

For complete API reference and advanced usage examples, see the <a href="https://github.com/UiPath/apollo-design-system/blob/master/packages/apollo-react/src/material/components/ap-chat/DOCS.md" target="_blank">official Autopilot Chat documentation</a>.
        `,
    };

    return storySpecificDocs[storyId] || '';
};
