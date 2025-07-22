import { defaultArgs } from './base.js';
import { initializeChatService } from './helpers';
import { template } from './template';

export const InteractiveFeatures = (args) => template(args, 'interactive-features');

InteractiveFeatures.args = {
    ...defaultArgs,
    demoMode: 'interactive',
    paginatedMessages: true,
    showModels: true,
};

InteractiveFeatures.play = async ({
    canvasElement, args,
}) => {
    const storyId = 'interactive-features';
    const container = args.mode === 'embedded' ?
        canvasElement.querySelector('#embedded-chat-container') : null;

    const chatService = initializeChatService(args, container, storyId, canvasElement);

    // Set the chat service instance on the component
    const chatElement = canvasElement.querySelector(`#chat-${storyId}`);
    if (chatElement) {
        chatElement.chatServiceInstance = chatService;
    }

    // Listen for custom actions
    chatService.on('download-action', ({ action }) => {
        // eslint-disable-next-line no-console
        console.log('Download action triggered:', action.details.filename);
        chatService.sendResponse({
            content: `✅ Downloaded: ${action.details.filename}`,
            groupId: 'initial-demo-actions',
        });
    });

    chatService.on('share-action', ({ message }) => {
        // eslint-disable-next-line no-console
        console.log('Share action triggered for message:', message.id);
        chatService.sendResponse({
            content: '✅ Message shared successfully!',
            groupId: 'initial-demo-actions',
        });
    });

    // Set up interactive control handlers
    const setupInteractiveControls = () => {
        // Show Loading Messages button
        const loadingButton = canvasElement.querySelector('#set-loading-demo');
        if (loadingButton) {
            loadingButton.addEventListener('click', () => {
                chatService.setDefaultLoadingMessages([
                    'Analyzing your request...',
                    'Processing data...',
                    'Generating response...',
                    'Almost ready...',
                ], 1500);

                // Simulate a request that triggers loading
                setTimeout(() => {
                    chatService.sendRequest({ content: 'Show me the loading demo' });
                    setTimeout(() => {
                        chatService.sendResponse({
                            content: 'Loading messages demo completed! The system showed different loading states while ' +
                                'processing your request.',
                            groupId: 'loading-demo',
                        });
                    }, 6000); // 4 loading messages * 1.5s each
                }, 100);
            });
        }

        // Set Suggestions button
        const suggestionsButton = canvasElement.querySelector('#set-suggestions-demo');
        if (suggestionsButton) {
            suggestionsButton.addEventListener('click', () => {
                chatService.setSuggestions([
                    {
                        label: 'Create Workflow',
                        prompt: 'Help me create a new automation workflow',
                    },
                    {
                        label: 'Debug Process',
                        prompt: 'I need help debugging my automation process',
                    },
                    {
                        label: 'Best Practices',
                        prompt: 'Show me automation best practices',
                    },
                    {
                        label: 'API Integration',
                        prompt: 'How do I integrate with external APIs?',
                    },
                ], true);

                chatService.sendResponse({
                    content: '💡 New suggestions have been added! You can click on any of the suggestion buttons below to ' +
                        'quickly ask common questions.',
                    groupId: 'suggestions-demo',
                });
            });
        }

        // Send Custom Actions button
        const actionsButton = canvasElement.querySelector('#send-actions-demo');
        if (actionsButton) {
            actionsButton.addEventListener('click', () => {
                chatService.sendResponse({
                    content: 'Here are some interactive actions you can try:',
                    groupId: 'custom-actions-demo',
                    actions: [
                        {
                            name: 'create',
                            label: 'Create Project',
                            icon: 'add_circle',
                            eventName: 'create-project-action',
                            details: { type: 'automation' },
                        },
                        {
                            name: 'analyze',
                            label: 'Analyze Code',
                            icon: 'analytics',
                            eventName: 'analyze-code-action',
                        },
                        {
                            name: 'deploy',
                            label: 'Deploy Process',
                            icon: 'rocket_launch',
                            showInOverflow: true,
                            eventName: 'deploy-process-action',
                        },
                        {
                            name: 'help',
                            label: 'Get Help',
                            icon: 'help',
                            showInOverflow: true,
                            eventName: 'help-action',
                        },
                    ],
                });
            });
        }
    };

    // Set up action event listeners for the new demo actions
    chatService.on('create-project-action', ({ action }) => {
        // eslint-disable-next-line no-console
        console.log('Create project action triggered:', action.details.type);
        chatService.sendResponse({
            content: `🚀 Created new ${action.details.type} project! You can now start building your automation workflow.`,
            groupId: 'create-project-response',
        });
    });

    chatService.on('analyze-code-action', () => {
        // eslint-disable-next-line no-console
        console.log('Analyze code action triggered');
        chatService.sendResponse({
            content: '🔍 Code analysis completed:\n\n✅ No syntax errors found\n⚠️ 2 optimization suggestions\n📊 Code ' +
                'complexity: Medium\n\nWould you like details on the optimization suggestions?',
            groupId: 'analyze-code-response',
        });
    });

    chatService.on('deploy-process-action', () => {
        // eslint-disable-next-line no-console
        console.log('Deploy process action triggered');
        chatService.sendResponse({
            content: '🚀 Deployment initiated...\n\n⏳ Building process...\n✅ Process deployed successfully!\n\n' +
                '**Deployment Details:**\n- Environment: Production\n- Version: 1.2.3\n- Status: Active',
            groupId: 'deploy-process-response',
        });
    });

    chatService.on('help-action', () => {
        // eslint-disable-next-line no-console
        console.log('Help action triggered');
        chatService.sendResponse({
            content: '💡 **Available Commands:**\n\n• Type "create" to start a new project\n• Type "debug" for ' +
                'troubleshooting help\n• Type "examples" to see sample workflows\n• Type "docs" for documentation ' +
                'links\n\nWhat would you like help with?',
            groupId: 'help-response',
        });
    });

    // Initialize controls after a short delay to ensure DOM is ready
    setTimeout(setupInteractiveControls, 500);
};
