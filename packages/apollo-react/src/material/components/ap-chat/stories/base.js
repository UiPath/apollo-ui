export const argTypes = {
    // Chat Controls
    mode: {
        options: [ 'side-by-side', 'full-screen', 'embedded', 'closed' ],
        control: { type: 'select' },
        description: 'The display mode of the chat interface',
    },

    // Feature Toggles
    settingsDisabled: {
        control: 'boolean',
        description: 'Disable the settings panel',
    },
    resizeDisabled: {
        control: 'boolean',
        description: 'Disable the resize handle',
    },
    fullScreenDisabled: {
        control: 'boolean',
        description: 'Disable full screen mode',
    },
    attachmentsDisabled: {
        control: 'boolean',
        description: 'Disable file attachments',
    },
    historyDisabled: {
        control: 'boolean',
        description: 'Disable conversation history',
    },
    closeDisabled: {
        control: 'boolean',
        description: 'Disable the close button',
    },
    headerDisabled: {
        control: 'boolean',
        description: 'Disable the header',
    },
    footerDisabled: {
        control: 'boolean',
        description: 'Disable the footer',
    },
    previewDisabled: {
        control: 'boolean',
        description: 'Disable the preview badge',
    },
    newChatDisabled: {
        control: 'boolean',
        description: 'Disable the new chat button',
    },
    audioDisabled: {
        control: 'boolean',
        description: 'Disable audio features',
    },

    // First Run Experience
    showFirstRun: {
        control: 'boolean',
        description: 'Show the first run experience',
    },
    firstRunTitle: {
        control: 'text',
        description: 'Title for the first run experience',
    },
    firstRunDescription: {
        control: 'text',
        description: 'Description for the first run experience',
    },

    // Local Storage
    useLocalHistory: {
        control: 'boolean',
        description: 'Enable local history storage using IndexedDB',
    },

    // Pagination
    paginatedMessages: {
        control: 'boolean',
        description: 'Enable message pagination for large conversations',
    },

    // Models
    showModels: {
        control: 'boolean',
        description: 'Show model selection',
    },

    // Label Overrides
    inputPlaceholder: {
        control: 'text',
        description: 'Custom placeholder text for the input field',
    },
    footerDisclaimer: {
        control: 'text',
        description: 'Custom disclaimer text for the footer',
    },
    title: {
        control: 'text',
        description: 'Custom title for the chat',
    },

    // Demo Options
    demoMode: {
        options: [ 'none', 'basic', 'streaming', 'attachments', 'history', 'interactive' ],
        control: { type: 'select' },
        description: 'Pre-configured demo scenarios',
    },

    // Disable the slot controls
    slotContent: { table: { disable: true } },
};

export const defaultArgs = {
    mode: 'side-by-side',
    settingsDisabled: true,
    resizeDisabled: false,
    fullScreenDisabled: false,
    attachmentsDisabled: false,
    historyDisabled: false,
    closeDisabled: false,
    headerDisabled: false,
    footerDisabled: false,
    previewDisabled: false,
    newChatDisabled: false,
    audioDisabled: true,
    showFirstRun: true,
    firstRunTitle: 'Welcome to Autopilot Chat',
    // eslint-disable-next-line max-len
    firstRunDescription: 'Ask me anything about your automation projects. I can help with building, troubleshooting, and understanding your workflows.',
    useLocalHistory: false,
    paginatedMessages: false,
    showModels: true,
    inputPlaceholder: '',
    footerDisclaimer: '',
    title: '',
    demoMode: 'none',
};

// Sample conversations for different demo modes
export const sampleConversations = {
    basic: [
        {
            id: '1',
            role: 'user',
            content: 'How do I create a new automation project?',
        },
        {
            id: '2',
            role: 'assistant',
            // eslint-disable-next-line max-len
            content: 'To create a new automation project in UiPath Studio:\n\n1. Open UiPath Studio\n2. Click on "New Project" from the home screen\n3. Choose your project type (Process, Library, etc.)\n4. Give your project a meaningful name\n5. Select the appropriate dependencies\n6. Click "Create" to initialize your project\n\nWould you like me to explain any of these steps in more detail?',
        },
    ],
    streaming: [
        {
            id: '1',
            role: 'user',
            content: 'Explain BPMN in detail',
        },
        {
            id: '2',
            role: 'assistant',
            content: 'BPMN (Business Process Model and Notation) is a standardized graphical notation...',
            streaming: true,
        },
    ],
    attachments: [
        {
            id: '1',
            role: 'user',
            content: 'Can you analyze this workflow file?',
            attachments: [ {
                name: 'workflow.xaml',
                size: 12450,
                type: 'application/xml',
            } ],
        },
        {
            id: '2',
            role: 'assistant',
            // eslint-disable-next-line max-len
            content: 'I\'ve analyzed your workflow file. Here are my findings:\n\n**Workflow Overview:**\n- Process Name: Invoice Processing\n- Activities Count: 47\n- Decision Points: 5\n- Error Handlers: 3\n\n**Recommendations:**\n1. Consider adding more error handling for the data extraction section\n2. The retry mechanism could be optimized\n3. Add logging for better debugging\n\nWould you like me to provide more specific suggestions?',
        },
    ],
    history: [
        {
            id: 'conv1',
            name: 'Invoice Processing Help',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
            id: 'conv2',
            name: 'Document Understanding Setup',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
        },
        {
            id: 'conv3',
            name: 'API Integration Questions',
            timestamp: new Date(Date.now() - 259200000).toISOString(),
        },
    ],
};

// Helper function to generate first run suggestions
export const generateSuggestions = (type = 'default') => {
    const suggestionSets = {
        default: [
            {
                label: 'Get started',
                prompt: 'How do I get started with UiPath Studio?',
            },
            {
                label: 'Best practices',
                prompt: 'What are the best practices for RPA development?',
            },
            {
                label: 'Debug workflow',
                prompt: 'How can I debug my automation workflow?',
            },
        ],
        document: [
            {
                label: 'Extract from PDF',
                prompt: 'How do I extract data from PDF documents?',
            },
            {
                label: 'Document Understanding',
                prompt: 'Explain Document Understanding and its capabilities',
            },
            {
                label: 'OCR setup',
                prompt: 'How do I set up OCR for document processing?',
            },
        ],
        api: [
            {
                label: 'REST API calls',
                prompt: 'How do I make REST API calls in UiPath?',
            },
            {
                label: 'Authentication',
                prompt: 'What are the authentication methods for APIs?',
            },
            {
                label: 'JSON parsing',
                prompt: 'How do I parse JSON responses in workflows?',
            },
        ],
        troubleshooting: [
            {
                label: 'Selector issues',
                prompt: 'How do I fix unreliable selectors?',
            },
            {
                label: 'Performance',
                prompt: 'How can I optimize workflow performance?',
            },
            {
                label: 'Error handling',
                prompt: 'What are the best practices for error handling?',
            },
        ],
    };

    return suggestionSets[type] || suggestionSets.default;
};

// Model configurations
export const modelConfigs = [
    {
        id: '1',
        name: 'GPT-4',
        icon: 'smart_toy',
        description: 'Advanced reasoning and code generation',
    },
    {
        id: '2',
        name: 'Claude 3.5',
        icon: 'psychology',
        description: 'Excellent for analysis and explanations',
    },
    {
        id: '3',
        name: 'Gemini Pro',
        icon: 'auto_awesome',
        description: 'Multimodal understanding and generation',
    },
];

// Attachment configurations
export const attachmentConfigs = {
    basic: {
        types: {
            'text/plain': [ '.txt' ],
            'application/json': [ '.json' ],
            'text/csv': [ '.csv' ],
        },
        maxSize: 5 * 1024 * 1024, // 5MB
        multiple: true,
    },
    documents: {
        types: {
            'application/pdf': [ '.pdf' ],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [ '.docx' ],
            'application/vnd.ms-excel': [ '.xls', '.xlsx' ],
        },
        maxSize: 10 * 1024 * 1024, // 10MB
        multiple: true,
    },
    workflows: {
        types: {
            'application/xml': [ '.xaml' ],
            'application/json': [ '.json' ],
            'text/plain': [ '.txt', '.log' ],
        },
        maxSize: 2 * 1024 * 1024, // 2MB
        multiple: false,
    },
};
