import { AutopilotChatService } from '@uipath/portal-shell-util';

import { prettyPrint } from '../../../stories/helper';
import { defaultArgs } from './base.js';
import { setupFullscreenHandling } from './helpers';

export const FeaturePlayground = (args) => {
    const storyId = 'feature-playground';
    const content = prettyPrint(`
        <div id="story-container-${storyId}" style="display: flex; width: 100%;">
            <!-- Control Panel -->
            <div id="docs-panel-${storyId}" style="display: flex; margin: 16px 0 0 16px; flex-direction: column; flex-grow: 1; gap: 8px; max-height: calc(100vh - 64px); overflow-y: auto;">
                <ap-theme-provider theme="light">
                    <div style="padding: 20px; background: #f5f5f5; border-radius: 8px;">
                        <h3 style="margin-top: 0;">Chat Controls</h3>
                    
                        <div style="margin-bottom: 20px;">
                        <h4>Chat Actions</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px; max-width: 300px;">
                            <ap-button id="toggle-chat" label="Toggle Chat" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="open-fullscreen" label="Open Fullscreen" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="new-chat" label="New Chat" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="toggle-auto-scroll" label="Toggle Auto Scroll" size="small" style="width: 100%;"></ap-button>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4>Message Controls</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px; max-width: 300px;">
                            <ap-button id="set-prompt" label="Set Prompt" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="reset-prompt" label="Reset Prompt" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="send-request" label="Send Request" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="send-response" label="Send Response" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="stop-response" label="Stop Response" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="send-response-custom-actions" label="Custom Actions" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="send-response-with-citations" label="Send With Citations" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="set-conversation" label="Set Conversation" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="set-suggestions" label="Set Suggestions" size="small" style="width: 100%;"></ap-button>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4>Loading & Errors</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px; max-width: 300px;">
                            <ap-button id="set-default-loading-messages" label="Default Loading" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="set-loading-message" label="Loading Message" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="set-error" label="Set Error" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="clear-error" label="Clear Error" size="small" style="width: 100%;"></ap-button>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4>Streaming</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px; max-width: 300px;">
                            <ap-button id="toggle-streaming" label="Toggle Streaming" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="fake-stream" label="Fake Stream" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="stream-with-citations" label="Stream With Citations" size="small" style="width: 100%;"></ap-button>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4>Custom Widgets</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px; max-width: 300px;">
                            <ap-button id="send-trace-span" label="Send Trace Span" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="send-trace-tree" label="Send Trace Tree" size="small" style="width: 100%;"></ap-button>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4>Configuration</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px; max-width: 300px;">
                            <ap-button id="set-models" label="Set Models" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="set-selected-model" label="Set Selected Model" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="set-allowed-attachments" label="Set Attachments" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="set-first-run-experience" label="First Run Experience" size="small" style="width: 100%;"></ap-button>
                            <ap-button id="set-pre-hook" label="Set Pre Hook" size="small" style="width: 100%;"></ap-button>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4>Feature Toggles</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px; max-width: 300px;">
                            <ap-checkbox id="disable-resize" label="Disable Resize"></ap-checkbox>
                            <ap-checkbox id="disable-fullscreen" label="Disable Fullscreen"></ap-checkbox>
                            <ap-checkbox id="disable-attachments" label="Disable Attachments"></ap-checkbox>
                            <ap-checkbox id="disable-history" label="Disable History"></ap-checkbox>
                            <ap-checkbox id="disable-settings" label="Disable Settings"></ap-checkbox>
                            <ap-checkbox id="disable-close" label="Disable Close"></ap-checkbox>
                            <ap-checkbox id="use-local-history" label="Use Local History" checked></ap-checkbox>
                            <ap-checkbox id="embed-mode" label="Embed Mode"></ap-checkbox>
                            <ap-checkbox id="send-on-click" label="Send On Click"></ap-checkbox>
                            <ap-checkbox id="paginated-messages" label="Paginated Messages"></ap-checkbox>
                            <ap-checkbox id="wait-for-more-messages" label="Wait For More"></ap-checkbox>
                            <ap-checkbox id="show-loading-state" label="Show Loading State"></ap-checkbox>
                        </div>
                    </div>
                    </div>
                </ap-theme-provider>
            </div>
            
            <!-- Chat Container -->
            <div id="chat-panel-${storyId}" style="justify-self: flex-end;">
                <ap-autopilot-chat id="chat-${storyId}"></ap-autopilot-chat>
            </div>
            
            <!-- Embedded mode container -->
            <div id="autopilot-chat-embedded-container" style="display: none; position: fixed; bottom: 20px; right: 20px; width: 400px; height: 600px; z-index: 9999;">
                <div id="autopilot-chat-embedded-content" style="width: 100%; height: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 30px rgba(0,0,0,0.3); background: white;"></div>
            </div>
        </div>
    `);

    return content;
};

FeaturePlayground.args = {
    ...defaultArgs,
    settingsDisabled: true,
};

FeaturePlayground.play = async ({
    canvasElement, args,
}) => {
    const storyId = 'feature-playground';

    // Create a stable instance name for this story
    const instanceName = `chat-story-${storyId}`;

    // Get or create a chat service instance specific to this story - but don't auto-initialize
    const chatService = AutopilotChatService.Instantiate({ instanceName });

    // Reset chat service to clean state
    chatService.close();
    chatService.newChat();
    chatService.clearError();
    chatService.setConversation([]);
    chatService.setHistory([]);
    chatService.setSuggestions([]);

    // Set the chat service instance on the component
    const chatElement = canvasElement.querySelector(`#chat-${storyId}`);
    if (chatElement) {
        chatElement.chatServiceInstance = chatService;
    }

    // Initialize with extended settings for playground
    chatService.initialize({
        mode: 'side-by-side',
        disabledFeatures: { settings: false },
        models: [
            {
                id: '1',
                name: 'Gemini',
                // eslint-disable-next-line max-len
                description: 'Gemini is a general-purpose AI model developed by Google. It can understand and generate text, images, and audio.',
            },
            {
                id: '3',
                name: 'claude-3.5-sonnet',
                // eslint-disable-next-line max-len
                description: 'claude-3.5-sonnet is a general-purpose AI model developed by Anthropic. It can understand and generate text, images, and audio.',
            },
        ],
        selectedModel: {
            id: '3',
            name: 'claude-3.5-sonnet',
            // eslint-disable-next-line max-len
            description: 'claude-3.5-sonnet is a general-purpose AI model developed by Anthropic. It can understand and generate text, images, and audio.',
        },
        useLocalHistory: true,
        settingsRenderer: (container) => {
            const settings = document.createElement('div');
            settings.style.cssText = 'height: 100%; width: 100%; display: flex; align-items: center; justify-content: center;';
            settings.innerHTML = 'Custom injected content';
            container.appendChild(settings);
        },
    });

    chatService.open();

    // Handle fullscreen mode changes
    setupFullscreenHandling(chatService, storyId, canvasElement);

    // Wire up controls
    const controls = {
        toggleChat: canvasElement.querySelector('#toggle-chat'),
        openFullscreen: canvasElement.querySelector('#open-fullscreen'),
        newChat: canvasElement.querySelector('#new-chat'),
        toggleAutoScroll: canvasElement.querySelector('#toggle-auto-scroll'),
        setPrompt: canvasElement.querySelector('#set-prompt'),
        resetPrompt: canvasElement.querySelector('#reset-prompt'),
        sendRequest: canvasElement.querySelector('#send-request'),
        sendResponse: canvasElement.querySelector('#send-response'),
        stopResponse: canvasElement.querySelector('#stop-response'),
        sendResponseCustomActions: canvasElement.querySelector('#send-response-custom-actions'),
        sendResponseWithCitations: canvasElement.querySelector('#send-response-with-citations'),
        setConversation: canvasElement.querySelector('#set-conversation'),
        setSuggestions: canvasElement.querySelector('#set-suggestions'),
        setDefaultLoadingMessages: canvasElement.querySelector('#set-default-loading-messages'),
        setLoadingMessage: canvasElement.querySelector('#set-loading-message'),
        setError: canvasElement.querySelector('#set-error'),
        clearError: canvasElement.querySelector('#clear-error'),
        toggleStreaming: canvasElement.querySelector('#toggle-streaming'),
        fakeStream: canvasElement.querySelector('#fake-stream'),
        streamWithCitations: canvasElement.querySelector('#stream-with-citations'),
        sendTraceSpan: canvasElement.querySelector('#send-trace-span'),
        sendTraceTree: canvasElement.querySelector('#send-trace-tree'),
        setModels: canvasElement.querySelector('#set-models'),
        setSelectedModel: canvasElement.querySelector('#set-selected-model'),
        setAllowedAttachments: canvasElement.querySelector('#set-allowed-attachments'),
        setFirstRunExperience: canvasElement.querySelector('#set-first-run-experience'),
        setPreHook: canvasElement.querySelector('#set-pre-hook'),
        disableResize: canvasElement.querySelector('#disable-resize'),
        disableFullscreen: canvasElement.querySelector('#disable-fullscreen'),
        disableAttachments: canvasElement.querySelector('#disable-attachments'),
        disableHistory: canvasElement.querySelector('#disable-history'),
        disableSettings: canvasElement.querySelector('#disable-settings'),
        disableClose: canvasElement.querySelector('#disable-close'),
        useLocalHistory: canvasElement.querySelector('#use-local-history'),
        embedMode: canvasElement.querySelector('#embed-mode'),
        sendOnClick: canvasElement.querySelector('#send-on-click'),
        paginatedMessages: canvasElement.querySelector('#paginated-messages'),
        waitForMoreMessages: canvasElement.querySelector('#wait-for-more-messages'),
        showLoadingState: canvasElement.querySelector('#show-loading-state'),
    };

    let chatOpen = true;
    let autoScroll = true;

    // Chat Actions
    controls.toggleChat?.addEventListener('click', () => {
        if (chatOpen) {
            chatService.close();
        } else {
            chatService.open();
        }
    });

    controls.openFullscreen?.addEventListener('click', () => {
        chatService.setChatMode('full-screen');
    });

    controls.newChat?.addEventListener('click', () => {
        chatService.newChat();
    });

    controls.toggleAutoScroll?.addEventListener('click', () => {
        autoScroll = !autoScroll;
        chatService.toggleAutoScroll(autoScroll);
    });

    // Message Controls
    controls.setPrompt?.addEventListener('click', () => {
        chatService.setPrompt('I need something to be done');
    });

    controls.resetPrompt?.addEventListener('click', () => {
        chatService.setPrompt('');
    });

    controls.sendRequest?.addEventListener('click', () => {
        chatService.sendRequest({ content: 'I need something to be done' });
    });

    controls.sendResponse?.addEventListener('click', () => {
        chatService.sendResponse({
            // eslint-disable-next-line max-len
            content: 'BPMN (Business Process Model and Notation) is a standardized graphical notation for drawing business processes in a workflow. It was developed by the Business Process Management Initiative (BPMI) and is now maintained by the Object Management Group (OMG).\n\nKey aspects of BPMN include:\n\n1. Purpose:\n- To provide a notation that is easily understandable by all business stakeholders\n- To bridge the gap between process design and implementation\n- To model complex business processes clearly and efficiently\n\n2. Main Elements:\n- Flow Objects (Events, Activities, Gateways)\n- Connecting Objects (Sequence Flows, Message Flows, Associations)\n- Swim Lanes (Pools and Lanes)\n- Artifacts (Data Objects, Groups, Annotations)\n\n3. Common Uses:\n- Documenting existing business processes\n- Designing new business processes\n- Analyzing and improving business workflows\n- Communication between different departments\n- Process automation and implementation\n\n4. Benefits:\n- Standardized notation\n- Clear visualization of business processes\n- Improved communication between business and technical teams\n- Support for complex business scenarios\n- Wide tool support\n\nBPMN is widely used in business process management (BPM) and serves as a common language for business process modeling across organizations.',
            shouldWaitForMoreMessages: controls.waitForMoreMessages?.checked || false,
        });
    });

    controls.stopResponse?.addEventListener('click', () => {
        chatService.stopResponse();
    });

    // Handle test events for custom actions
    chatService.on('TestEvent', ({
        message, action,
    }) => {
        // eslint-disable-next-line no-console
        console.log(`TestEvent: ${message.content}, ${action.details.someDetail}`);
    });

    chatService.on('TestEvent2', ({
        message, action,
    }) => {
        // eslint-disable-next-line no-console
        console.log(`TestEvent2: ${message.content}, ${action.details.someOtherDetail}`);
    });

    // Handle feedback events
    chatService.on('feedback', ({
        isPositive, message,
    }) => {
        // eslint-disable-next-line no-console
        console.log(`Feedback received - Positive: ${isPositive}, Message:`, message);
    });

    // Handle copy events
    chatService.on('copy', (message) => {
        navigator.clipboard.writeText(message.content + '<hijacked>').catch(() => {});
    });

    // Handle attachment events
    chatService.on('attachments', (attachments) => {
        // eslint-disable-next-line no-console
        console.log('Attachments received:', attachments);
    });

    // Handle conversation events
    chatService.on('newChat', () => {
        // eslint-disable-next-line no-console
        console.log('New chat started');
    });

    chatService.on('openConversation', (conversationId) => {
        // eslint-disable-next-line no-console
        console.log('Opened conversation:', conversationId);
    });

    // Track mode changes
    chatService.on('modeChange', (mode) => {
        // eslint-disable-next-line no-console
        console.log('Mode changed to:', mode);

        if (mode === 'full-screen') {
            canvasElement.querySelector(`#docs-panel-${storyId}`).style.display = 'none';
        } else {
            canvasElement.querySelector(`#docs-panel-${storyId}`).style.display = 'block';
        }

        chatOpen = mode !== 'closed';
    });

    // Custom Actions - Send Response with Custom Actions
    controls.sendResponseCustomActions?.addEventListener('click', () => {
        chatService.sendResponse({
            content: 'Hello, world!',
            actions: [
                {
                    label: 'Custom Action 1',
                    icon: 'shuffle',
                    eventName: 'TestEvent',
                    details: { someDetail: 'someValue' },
                },
                {
                    label: 'Custom Action 2',
                    eventName: 'TestEvent2',
                    details: { someOtherDetail: 'someOtherValue' },
                    showInOverflow: true,
                },
            ],
            shouldWaitForMoreMessages: controls.waitForMoreMessages?.checked || false,
        });
    });

    // Send Response with Citations
    controls.sendResponseWithCitations?.addEventListener('click', () => {
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
                    text: '## Table: Recent NBA Champions',
                    citations: [],
                },
                {
                    text: '| Year | Champion | Runner-up | Finals MVP |',
                    citations: [],
                },
                {
                    text: '|------|----------|-----------|------------|',
                    citations: [],
                },
                {
                    text: '| 2023-24 | Boston Celtics | Dallas Mavericks | Jaylen Brown |',
                    citations: [
                        {
                            id: 4,
                            title: '2024 NBA Finals Recap - NBA.com',
                            url: 'https://www.nba.com/news/2024-nba-finals-recap',
                        },
                    ],
                },
                {
                    text: '| 2022-23 | Denver Nuggets | Miami Heat | Nikola Jokić |',
                    citations: [
                        {
                            id: 5,
                            title: '2023 NBA Finals: Nuggets Win First Title - The Athletic',
                            url: 'https://theathletic.com/2023-nba-finals-nuggets-heat/',
                        },
                    ],
                },
                {
                    // eslint-disable-next-line max-len
                    text: '## Table Test 2 - Complete Table Stream\n\nHere\'s a complete NBA statistics table with citations:\n\n| Season | Champion | Runner-up | Series Result | Finals MVP |\n|--------|----------|-----------|---------------|------------|\n| 2023-24 | Boston Celtics | Dallas Mavericks | 4-1 | Jaylen Brown |\n| 2022-23 | Denver Nuggets | Miami Heat | 4-1 | Nikola Jokić |\n| 2021-22 | Golden State Warriors | Boston Celtics | 4-2 | Stephen Curry |\n| 2020-21 | Milwaukee Bucks | Phoenix Suns | 4-2 | Giannis Antetokounmpo |\n| 2019-20 | Los Angeles Lakers | Miami Heat | 4-2 | LeBron James |',
                    citations: [
                        {
                            id: 6,
                            title: 'NBA Finals Results 2019-2024 (PDF)',
                            download_url: 'https://nba.com/history/championships-2019-2024.pdf',
                            page_number: 3,
                        },
                        {
                            id: 7,
                            title: 'Basketball Reference: NBA Finals History',
                            url: 'https://www.basketball-reference.com/playoffs/',
                            page_number: 1,
                        },
                    ],
                },
                {
                    text: 'For more details on NBA statistics and player achievements, visit the official NBA stats portal.',
                    citations: [
                        {
                            id: 8,
                            title: 'NBA Advanced Stats Portal',
                            url: 'https://www.nba.com/stats/',
                        },
                    ],
                },
                {
                    text: 'NBA Finals MVPs are awarded based on their performance in the championship series.',
                    citations: [
                        {
                            id: 9,
                            title: 'NBA Finals MVP Award Winners',
                            url: 'https://www.nba.com/history/finals-mvp',
                        },
                    ],
                },
            ],
            shouldWaitForMoreMessages: controls.waitForMoreMessages?.checked || false,
        });
    });

    // Set Conversation
    controls.setConversation?.addEventListener('click', () => {
        const sampleConversation = [
            {
                id: '1',
                role: 'user',
                content: 'How do I create a workflow that extracts data from invoices?',
            },
            {
                id: '2',
                role: 'assistant',
                // eslint-disable-next-line max-len
                content: 'To extract data from invoices, you can use UiPath Document Understanding. Here\'s a step-by-step approach:\n\n1. Install the Document Understanding package from the UiPath Marketplace\n2. Create a new workflow and add the "Digitize Document" activity\n3. Configure it to use the appropriate ML skills (like Invoice Extraction)\n4. Use the "Data Extraction" activity to extract specific fields\n5. Validate the extracted data using the "Validation Station" if needed\n\nWould you like me to explain any of these steps in more detail?',
            },
            {
                id: '3',
                role: 'user',
                content: 'Yes, can you explain more about the ML skills for invoice extraction?',
            },
            {
                id: '4',
                role: 'assistant',
                // eslint-disable-next-line max-len
                content: 'Certainly! ML skills are pre-trained machine learning models that can recognize and extract specific types of data from documents.\n\nFor invoice extraction, UiPath offers several ML skills:\n\n1. **Invoice Extraction ML Skill**: Specifically trained to identify common invoice fields like invoice number, date, total amount, vendor details, line items, etc.\n\n2. **Intelligent Form Extractor**: A more general skill that can handle various structured documents including invoices.\n\n3. **Document OCR**: For text recognition before applying extraction skills.\n\nYou can also train custom ML skills using the Machine Learning Extractor if you have specific invoice formats or need to extract unique fields not covered by the pre-built skills.\n\nTo configure an ML skill in your workflow:\n1. In the Digitize Document activity, click "Configure Extraction"\n2. Add the Invoice Extraction skill\n3. Configure the taxonomy (fields you want to extract)\n4. Set confidence thresholds for automatic extraction vs. human validation',
            },
            {
                id: '5',
                role: 'user',
                content: 'What if my invoices are in different languages?',
            },
            {
                id: '6',
                role: 'assistant',
                // eslint-disable-next-line max-len
                content: 'UiPath\'s Document Understanding can handle invoices in multiple languages. Here\'s how to approach multilingual invoice processing:\n\n1. **OCR Language Settings**: When using Document OCR, you can specify the language(s) to improve text recognition accuracy. UiPath supports 100+ languages for OCR.\n\n2. **ML Skills Language Support**: The pre-built Invoice Extraction ML skill supports multiple languages including English, German, French, Spanish, Italian, and more. Check the latest documentation for the complete list.\n\n3. **Custom ML Training**: For languages not well-supported by pre-built skills, you can train custom ML models using your own invoices in specific languages.\n\n4. **Language Detection**: You can add a pre-processing step to detect the document language (using activities from the UiPath.DocumentProcessing.Activities package) and then route to language-specific processing workflows.\n\n5. **Translation Activities**: For post-processing, you can use translation activities to convert extracted text to a standard language for your business processes.\n\nThe key is to test with sample invoices in all your target languages and fine-tune the extraction process accordingly.',
            },
            {
                id: '7',
                role: 'user',
                content: 'How can I validate the extracted data for accuracy?',
            },
            {
                id: '8',
                role: 'assistant',
                // eslint-disable-next-line max-len
                content: 'Validating extracted invoice data is crucial for accuracy. Here are several approaches you can implement:\n\n1. **Validation Station**: UiPath\'s built-in Validation Station provides a human-in-the-loop interface where users can review and correct extraction results when confidence scores are below thresholds.\n\n2. **Data Validation Rules**: Implement business rules to validate data, such as:\n   - Check if invoice numbers follow expected formats\n   - Verify that line item totals add up to the invoice total\n   - Confirm invoice dates are within reasonable ranges\n   - Cross-reference vendor information with your vendor database\n\n3. **Database Lookups**: Compare extracted data against your ERP or accounting system to validate vendor information, purchase orders, etc.\n\n4. **Confidence Scores**: Use the confidence scores provided by Document Understanding to determine which fields need manual review.\n\n5. **Exception Handling**: Create specific workflows for handling exceptions when validation fails.\n\n6. **Automated Testing**: For high-volume processing, implement automated testing with known sample invoices to continuously monitor extraction accuracy.\n\nWould you like me to provide sample code for implementing any of these validation approaches?',
            },
            {
                id: '9',
                role: 'user',
                content: 'Can I integrate this with our SAP system for automated processing?',
            },
            {
                id: '10',
                role: 'assistant',
                // eslint-disable-next-line max-len
                content: 'Yes, you can definitely integrate UiPath invoice processing with SAP for end-to-end automation. Here\'s how to approach it:\n\n1. **SAP Integration Methods**:\n   - **UiPath SAP Activities Pack**: Use specialized activities for SAP interaction\n   - **SAP GUI Automation**: For screen-based automation\n   - **SAP Web Services/APIs**: For direct system integration\n   - **SAP BAPI/RFC**: For programmatic access to SAP functions\n\n2. **Typical Integration Workflow**:\n   a. Extract invoice data using Document Understanding\n   b. Validate and transform the data to match SAP requirements\n   c. Log into SAP (using SAP logon activities)\n   d. Navigate to invoice processing transactions (like MIRO for invoice posting)\n   e. Input the extracted data\n   f. Handle any exceptions or validation messages from SAP\n   g. Confirm successful processing\n\n3. **Best Practices**:\n   - Use SAP connection managers to securely store credentials\n   - Implement proper error handling for SAP-specific errors\n   - Consider using queues for asynchronous processing\n   - Log all transactions for audit purposes\n   - Test thoroughly with different invoice scenarios\n\n4. **Advanced Options**:\n   - Use UiPath\'s SAP Automation Hub accelerators for invoice processing\n   - Consider SAP-specific document extraction models if available\n   - Implement approval workflows before posting to SAP\n\nDo you need specific guidance on any part of this SAP integration process?',
            },
        ];
        chatService.setConversation(sampleConversation);
    });

    // Set Suggestions
    controls.setSuggestions?.addEventListener('click', () => {
        chatService.setSuggestions([
            {
                label: 'What are the troubleshooting steps for Orchestrator pod issues?',
                prompt: 'What are the troubleshooting steps for Orchestrator pod issues?',
            },
            {
                label: 'How can I resolve CrashLoopBackOff errors in Orchestrator?',
                prompt: 'How can I resolve CrashLoopBackOff errors in Orchestrator?',
            },
            {
                label: 'What are the common installation issues for Automation Suite on Linux?',
                prompt: 'What are the common installation issues for Automation Suite on Linux?',
            },
        ], true);
    });

    // Loading & Error Controls
    controls.setDefaultLoadingMessages?.addEventListener('click', () => {
        chatService.setDefaultLoadingMessages([ 'Running Agent 1', 'Thinking...', 'Analyzing...' ], 2000);
    });

    controls.setLoadingMessage?.addEventListener('click', () => {
        chatService.setLoadingMessage('Running Tool Call 1');
    });

    controls.setError?.addEventListener('click', () => {
        chatService.setError('An error occurred');
    });

    controls.clearError?.addEventListener('click', () => {
        chatService.clearError();
    });

    // Streaming Controls
    let streaming = false;
    let streamInterval;
    let streamId;

    // Listen for stop response events
    chatService.on('stopResponse', () => {
        streaming = false;
        if (streamInterval) {
            clearInterval(streamInterval);
            streamInterval = null;
        }
    });

    controls.toggleStreaming?.addEventListener('click', () => {
        streaming = !streaming;

        if (streaming) {
            streamId = 'toggle-stream-' + Date.now();

            const randomWords = [
                'Hello', 'World', 'Automation', 'Robot', 'Process', 'Workflow',
                'Digital', 'Assistant', 'Intelligence', 'Task', 'Data', 'Extract',
                'Transform', 'Analyze', 'Optimize', 'Efficiency', 'Solution',
                'Enterprise', 'Integration', 'Platform', 'Document', 'Understanding',
                'Vision', 'Recognition', 'Machine', 'Learning', 'Artificial',
                'Technology', 'Innovation', 'Future', 'Productivity', 'Accelerate',
                'Business', 'Value', 'Service', 'Customer', 'Experience', 'Quality',
                'Performance', 'Reliable', 'Secure', 'Scalable', 'Flexible', 'Agile',
                'Modern', 'Cloud', 'System', 'Application', 'Interface',
            ];

            streamInterval = setInterval(() => {
                const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];

                chatService.sendResponse({
                    id: streamId,
                    content: randomWord + ' ',
                    stream: true,
                });
            }, 1);
        } else {
            if (streamInterval) {
                clearInterval(streamInterval);
                streamInterval = null;
            }
            if (streamId) {
                chatService.sendResponse({
                    id: streamId,
                    content: '',
                    stream: true,
                    done: true,
                });
            }
        }
    });

    controls.fakeStream?.addEventListener('click', () => {
        chatService.sendResponse({
            content: `Here's a **comprehensive workflow optimization guide**:

## Key Areas for Improvement

### 1. Process Automation
- **Eliminate manual tasks** where possible
- Use *conditional logic* for decision points
- Implement \`retry mechanisms\` for reliability

### 2. Performance Optimization
\`\`\`javascript
// Example: Parallel execution
const tasks = [task1(), task2(), task3()];
const results = await Promise.all(tasks);
\`\`\`

### 3. Performance Metrics

| Process Type | Avg Duration | Success Rate | Optimization Potential |
|--------------|-------------|-------------|----------------------|
| Data Extraction | 2.3s | 98.5% | ✅ High |
| Email Processing | 1.8s | 99.2% | ⚠️ Medium |
| Report Generation | 5.2s | 97.8% | 🔥 Critical |
| API Integration | 0.9s | 99.9% | ✨ Low |

### 4. Error Handling
> Always implement robust error handling to ensure workflow reliability

**Best Practices:**
1. Use try-catch blocks
2. Log errors for debugging
3. Provide meaningful error messages
4. Implement fallback strategies

---

*Remember: Small optimizations can lead to significant improvements in overall performance.*`,
            fakeStream: true,
        });
    });

    // Stream With Citations
    controls.streamWithCitations?.addEventListener('click', () => {
        const messageId = 'stream-citations-' + Date.now();
        let unsubscribe;
        let isStreamingChunk = true;
        let streamIndex = 0;

        const streamingParts = [
            {
                index: 0,
                text: 'Based on our analysis of UiPath automation processes',
                citation: null,
            },
            {
                index: 0,
                text: ', organizations typically see significant ROI improvements. ',
                citation: {
                    id: 1,
                    title: 'UiPath ROI Study 2023.pdf',
                    download_url: 'https://www.uipath.com/resources/automation-roi-study-2023.pdf',
                    page_number: 12,
                },
            },
            {
                index: 1,
                text: 'For implementation timeline',
                citation: null,
            },
            {
                index: 1,
                text: ', most enterprises follow a structured approach:',
                citation: null,
            },
            {
                index: 1,
                text: '\n\n1. **Assessment Phase** (2-4 weeks)\n2. **Design Phase** (3-6 weeks)\n3. **Development Phase** (4-12 weeks)',
                citation: {
                    id: 2,
                    title: 'Implementation Guidelines v2.1.pdf',
                    download_url: 'https://docs.uipath.com/implementation-guide',
                    page_number: 5,
                },
            },
            {
                index: 2,
                text: 'Security requirements',
                citation: null,
            },
            {
                index: 2,
                text: ' must include **256-bit AES encryption** for data at rest and **TLS 1.3** for data in transit.',
                citation: {
                    id: 3,
                    title: 'Enterprise Security Guidelines v4.1.pdf',
                    download_url: 'https://docs.uipath.com/orchestrator/docs/security-guidelines',
                    page_number: 23,
                },
            },
            {
                index: 3,
                text: '\n\n## Table Test',
                citation: null,
            },
            {
                index: 4,
                text: '| Column 1 | Column 2 |',
                citation: null,
            },
            {
                index: 5,
                text: '|----------|----------|',
                citation: null,
            },
            {
                index: 6,
                text: '| Row 1 | Data 1 |',
                citation: {
                    id: 4,
                    title: 'Table Citation',
                    url: 'https://tabletest.com',
                },
            },
            {
                index: 7,
                text: '| Row 2 | Data 2 |',
                citation: {
                    id: 5,
                    title: 'Table Citation 2',
                    url: 'https://tabletest2.com',
                },
            },
        ];

        // Listen for stop response event
        const stopHandler = () => {
            isStreamingChunk = false;
            unsubscribe();
        };
        unsubscribe = chatService.on('stopResponse', stopHandler);

        const streamChunk = () => {
            if (!isStreamingChunk || streamIndex >= streamingParts.length) {
                // Send final chunk to mark completion
                chatService.sendResponse({
                    id: messageId,
                    contentPartChunk: {
                        index: 7,
                        text: '',
                    },
                    stream: true,
                    done: true,
                });
                return;
            }

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
            setTimeout(streamChunk, 100); // Stream chunk every 100ms
        };

        streamChunk();
    });

    // Widget Controls - Trace Span
    controls.sendTraceSpan?.addEventListener('click', () => {
        // Register trace span widget
        chatService.injectMessageRenderer({
            name: 'trace-span-view',
            render: (container, message) => {
                const traceSpanView = document.createElement('ap-execution-trace-span-view');
                const span = {
                    id: 'completion-1',
                    parentId: 'agent-1',
                    name: 'LLM Completion',
                    startTime: new Date('2024-03-20T10:01:00Z'),
                    endTime: new Date('2024-03-20T10:01:10Z'),
                    status: 'ok',
                    attributes: {
                        type: 'completion',
                        settings: {
                            id: 'settings-1',
                            parentId: null,
                            name: 'Completion Settings',
                            startTime: new Date('2024-03-20T10:01:00Z'),
                            endTime: new Date('2024-03-20T10:01:10Z'),
                            status: 'ok',
                            attributes: {
                                type: 'agentRun',
                                systemPrompt: 'Settings system prompt',
                                userPrompt: 'Settings user prompt',
                                inputSchema: {},
                                input: {},
                            },
                        },
                        response: {
                            message: {
                                toolCalls: [],
                                content: 'Example completion response',
                            },
                        },
                        usage: {
                            completionTokens: 50,
                            promptTokens: 100,
                            totalTokens: 150,
                        },
                        output: 'Final completion output',
                    },
                };

                traceSpanView.span = span;
                container.innerHTML = '';
                container.appendChild(traceSpanView);
            },
        });

        chatService.sendResponse({
            content: 'Trace span response',
            widget: 'trace-span-view',
            toCopy: 'Trace span response',
        });
    });

    // Widget Controls - Trace Tree
    controls.sendTraceTree?.addEventListener('click', () => {
        // Register trace tree widget
        chatService.injectMessageRenderer({
            name: 'trace-tree-view',
            render: (container, message) => {
                const traceTreeView = document.createElement('ap-execution-trace-tree');
                const trace = [
                    {
                        key: 'root',
                        name: 'Agent Execution Flow',
                        data: {
                            id: 'agent-1',
                            parentId: null,
                            name: 'Agent Run Workflow',
                            startTime: new Date('2024-04-04T12:00:00Z'),
                            endTime: new Date('2024-04-04T12:02:00Z'),
                            status: 'ok',
                            type: 'agentRun',
                            attributes: {
                                systemPrompt: 'Executing agent workflow',
                                userPrompt: 'Perform multiple operations with different tools',
                                inputSchema: {},
                                input: {},
                            },
                        },
                        expandedByDefault: true,
                        children: [
                            {
                                key: 'child-1',
                                name: 'Tool Call 1',
                                data: {
                                    id: 'process-1',
                                    parentId: 'agent-1',
                                    name: 'Tool Call Example',
                                    startTime: new Date('2024-04-04T12:00:10Z'),
                                    endTime: new Date('2024-04-04T12:00:30Z'),
                                    status: 'ok',
                                    type: 'toolCall',
                                    attributes: {},
                                },
                                children: [
                                    {
                                        key: 'child-1-1',
                                        name: 'Pre-Process Run',
                                        data: {
                                            id: 'sub-tool-1',
                                            parentId: 'process-1',
                                            name: 'Data Transformation',
                                            startTime: new Date('2024-04-04T12:00:15Z'),
                                            endTime: new Date('2024-04-04T12:00:25Z'),
                                            status: 'ok',
                                            type: 'ProcessRun',
                                            attributes: {},
                                        },
                                    },
                                ],
                            },
                            {
                                key: 'child-2',
                                name: 'LLM Call',
                                data: {
                                    id: 'completion-1',
                                    parentId: 'agent-1',
                                    name: 'AI Text Completion',
                                    startTime: new Date('2024-04-04T12:00:45Z'),
                                    endTime: new Date('2024-04-04T12:00:50Z'),
                                    status: 'ok',
                                    type: 'completion',
                                    attributes: {},
                                },
                            },
                        ],
                    },
                ];

                traceTreeView.trace = trace;
                container.innerHTML = '';
                container.style.height = '250px'; // Required for proper rendering
                container.appendChild(traceTreeView);
            },
        });

        chatService.sendResponse({
            content: 'Trace tree response',
            widget: 'trace-tree-view',
            toCopy: 'Trace tree response',
        });
    });

    // Model Configuration Controls
    controls.setModels?.addEventListener('click', () => {
        chatService.setModels([
            {
                id: '1',
                name: 'Gemini',
                icon: 'accessibility',
                // eslint-disable-next-line max-len
                description: 'Gemini is a general-purpose AI model developed by Google. It can understand and generate text, images, and audio.',
            },
            {
                id: '2',
                name: 'GPT-4o',
                icon: 'apps',
                // eslint-disable-next-line max-len
                description: 'GPT-4o is a general-purpose AI model developed by OpenAI. It can understand and generate text, images, and audio.',
            },
            {
                id: '3',
                name: 'claude-3.5-sonnet',
                icon: 'call',
                // eslint-disable-next-line max-len
                description: 'claude-3.5-sonnet is a general-purpose AI model developed by Anthropic. It can understand and generate text, images, and audio.',
            },
        ]);
    });

    controls.setSelectedModel?.addEventListener('click', () => {
        chatService.setSelectedModel('3');
    });

    controls.setAllowedAttachments?.addEventListener('click', () => {
        chatService.setAllowedAttachments({
            types: { 'text/csv': [ '.csv' ] },
            maxSize: 1024 * 1024, // 1MB
            multiple: false,
        });
    });

    // First Run Experience
    controls.setFirstRunExperience?.addEventListener('click', () => {
        chatService.setFirstRunExperience({
            title: 'Welcome to Automation Assistant',
            description: 'I can help you with workflow optimization, error handling, and automation best practices.',
            suggestions: [
                {
                    label: 'Get Started',
                    prompt: 'How do I begin automating my processes?',
                },
                {
                    label: 'Best Practices',
                    prompt: 'What are automation best practices?',
                },
                {
                    label: 'Troubleshooting',
                    prompt: 'Help me troubleshoot workflow issues',
                },
                {
                    label: 'Integration',
                    prompt: 'How do I integrate with external systems?',
                },
            ],
        });
        chatService.newChat(); // Trigger first run experience
    });

    // Pre-hook Configuration
    const allPreHookActions = [ 'new-chat', 'toggle-history', 'toggle-chat', 'close-chat' ];

    controls.setPreHook?.addEventListener('click', () => {
        allPreHookActions.forEach((action) => {
            chatService.setPreHook(action, async (data) => {
                // eslint-disable-next-line no-alert
                return confirm(`${action} pre-hook. Current state is ${JSON.stringify(data)} Continue?`);
            });
        });
    });

    // Feature Toggle Controls
    controls.disableResize?.addEventListener('valueChanged', () => {
        chatService.setDisabledFeatures({ resize: controls.disableResize.checked });
    });

    controls.disableFullscreen?.addEventListener('valueChanged', () => {
        chatService.setDisabledFeatures({ fullScreen: controls.disableFullscreen.checked });
    });

    controls.disableAttachments?.addEventListener('valueChanged', () => {
        chatService.setDisabledFeatures({ attachments: controls.disableAttachments.checked });
    });

    controls.disableHistory?.addEventListener('valueChanged', () => {
        chatService.setDisabledFeatures({ history: controls.disableHistory.checked });
    });

    controls.disableSettings?.addEventListener('valueChanged', () => {
        chatService.setDisabledFeatures({ settings: controls.disableSettings.checked });
    });

    controls.disableClose?.addEventListener('valueChanged', () => {
        chatService.setDisabledFeatures({ close: controls.disableClose.checked });
    });

    controls.useLocalHistory?.addEventListener('valueChanged', () => {
        chatService.initialize({
            ...chatService.getConfig(),
            useLocalHistory: controls.useLocalHistory.checked,
        });
    });

    controls.embedMode?.addEventListener('valueChanged', () => {
        const embedContainer = canvasElement.querySelector('#autopilot-chat-embedded-container');
        const chatPanel = canvasElement.querySelector(`#chat-panel-${storyId}`);

        embedContainer.style.display = controls.embedMode.checked ? 'block' : 'none';
        chatPanel.style.display = controls.embedMode.checked ? 'none' : 'flex';

        chatService.open({
            mode: controls.embedMode.checked ? 'embedded' : 'side-by-side',
            ...(controls.embedMode.checked ? { embeddedContainer: canvasElement.querySelector('#autopilot-chat-embedded-content') } : {}),
        });
    });

    controls.sendOnClick?.addEventListener('valueChanged', () => {
        chatService.setFirstRunExperience({
            ...chatService.getConfig().firstRunExperience,
            sendOnClick: controls.sendOnClick.checked,
        });
    });

    controls.paginatedMessages?.addEventListener('valueChanged', () => {
        chatService.patchConfig({ paginatedMessages: controls.paginatedMessages.checked });
    });

    controls.showLoadingState?.addEventListener('valueChanged', () => {
        if (controls.showLoadingState.checked) {
            controls.useLocalHistory.checked = false;
            chatService.initialize({
                ...(chatService.getConfig() || {}),
                useLocalHistory: false,
            });
            chatService.openConversation();
        } else {
            controls.useLocalHistory.checked = true;
            chatService.initialize({
                ...(chatService.getConfig() || {}),
                useLocalHistory: true,
            });
            // Clear the conversation by setting it to empty
            chatService.setConversation([]);
        }
    });

    // Handle paginated messages loading
    let moreCount = 3;
    let timeoutId = null;

    const resetMoreCount = () => {
        moreCount = 3;
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    };

    chatService.on('newChat', resetMoreCount);
    chatService.on('openConversation', resetMoreCount);

    chatService.on('conversationLoadMore', () => {
        timeoutId = setTimeout(() => {
            moreCount--;
            chatService.prependOlderMessages([
                {
                    id: crypto.randomUUID(),
                    content: 'Older message 1',
                    role: 'user',
                    created_at: new Date().toISOString(),
                },
                {
                    id: crypto.randomUUID(),
                    content: 'Older message 2',
                    role: 'assistant',
                    created_at: new Date().toISOString(),
                },
                {
                    id: crypto.randomUUID(),
                    content: 'Older message 3',
                    role: 'user',
                    created_at: new Date().toISOString(),
                },
                {
                    id: crypto.randomUUID(),
                    content: 'Older message 4',
                    role: 'assistant',
                    created_at: new Date().toISOString(),
                },
            ], moreCount <= 0);
        }, 2000);
    });

    // Set up sample history
    chatService.setHistory([
        {
            id: 'playground-1',
            name: 'Workflow Optimization Session',
            timestamp: new Date().toISOString(),
        },
        {
            id: 'playground-2',
            name: 'Error Handling Discussion',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
            id: 'playground-3',
            name: 'Best Practices Guide',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
    ]);
};
