import { defaultArgs } from './base.js';
import { initializeChatService } from './helpers';
import { template } from './template';

export const CustomMenus = (args) => template(args, 'custom-menus');

CustomMenus.args = {
    ...defaultArgs,
    showModels: true,
    settingsDisabled: false,
};

CustomMenus.play = async ({
    canvasElement, args,
}) => {
    const storyId = 'custom-menus';
    const container = args.mode === 'embedded' ?
        canvasElement.querySelector('#embedded-chat-container') : null;

    const chatService = initializeChatService(args, container, storyId, canvasElement);

    // Set the chat service instance on the component
    const chatElement = canvasElement.querySelector(`#chat-${storyId}`);
    if (chatElement) {
        chatElement.chatServiceInstance = chatService;
    }

    // Configure Models
    chatService.setModels([
        {
            id: 'gpt-4',
            name: 'GPT-4',
            description: 'Advanced reasoning and complex problem solving',
            icon: 'smart_toy',
        },
        {
            id: 'claude',
            name: 'Claude 3.5',
            description: 'Long context and detailed analysis',
            icon: 'psychology',
        },
        {
            id: 'gemini',
            name: 'Gemini Pro',
            description: 'Multimodal AI with visual understanding',
            icon: 'auto_awesome',
        },
    ]);
    chatService.setSelectedModel('claude');

    // Configure Agent Modes with different options
    chatService.setAgentModes([
        {
            id: 'agent',
            name: 'Agent Mode',
            description: 'AI acts as an autonomous agent that can plan and execute multi-step tasks',
            icon: 'smart_toy',
        },
        {
            id: 'plan',
            name: 'Plan Mode',
            description: 'AI creates a detailed plan before execution and waits for approval',
            icon: 'list_alt',
        },
        {
            id: 'execute',
            name: 'Execute Mode',
            description: 'AI immediately executes commands without planning',
            icon: 'play_arrow',
        },
        {
            id: 'research',
            name: 'Research Mode',
            description: 'AI focuses on gathering information and analysis',
            icon: 'search',
        },
    ]);
    chatService.setAgentMode('agent');

    // Configure Custom Header Actions with nested menus
    chatService.setCustomHeaderActions([
        {
            id: 'export',
            name: 'Export',
            icon: 'download',
            description: 'Export conversation in various formats',
            children: [
                {
                    id: 'export-pdf',
                    name: 'Export as PDF',
                    icon: 'picture_as_pdf',
                    description: 'Download conversation as PDF file',
                },
                {
                    id: 'export-docx',
                    name: 'Export as DOCX',
                    icon: 'description',
                    description: 'Download conversation as Word document',
                },
                {
                    id: 'export-json',
                    name: 'Export as JSON',
                    icon: 'data_object',
                    description: 'Download conversation as JSON file',
                },
                {
                    id: 'export-txt',
                    name: 'Export as Text',
                    icon: 'text_snippet',
                    description: 'Download conversation as plain text',
                },
            ],
        },
        {
            id: 'share',
            name: 'Share Conversation',
            icon: 'share',
            description: 'Share this conversation with others',
        },
        {
            id: 'translate',
            name: 'Translate',
            icon: 'translate',
            description: 'Translate conversation to different languages',
            children: [
                {
                    id: 'translate-es',
                    name: 'Spanish',
                    icon: 'language',
                    description: 'Translate to Spanish',
                },
                {
                    id: 'translate-fr',
                    name: 'French',
                    icon: 'language',
                    description: 'Translate to French',
                },
                {
                    id: 'translate-de',
                    name: 'German',
                    icon: 'language',
                    description: 'Translate to German',
                },
                {
                    id: 'translate-ja',
                    name: 'Japanese',
                    icon: 'language',
                    description: 'Translate to Japanese',
                },
                {
                    id: 'translate-zh',
                    name: 'Chinese',
                    icon: 'language',
                    description: 'Translate to Chinese',
                },
            ],
        },
        {
            id: 'print',
            name: 'Print',
            icon: 'print',
            description: 'Print conversation',
        },
        {
            id: 'advanced',
            name: 'Advanced Settings',
            icon: 'tune',
            description: 'Advanced configuration options',
            disabled: true,
        },
    ]);

    // Listen for custom header action selection
    chatService.on('customHeaderActionClicked', (action) => {
        // eslint-disable-next-line no-console
        console.log('Custom header action selected:', action);

        let responseContent = '';
        switch (action.id) {
            case 'export-pdf':
                responseContent = '📄 **Exporting as PDF...**\n\n'
                    + 'Your conversation has been exported to a PDF file. '
                    + 'The download should start automatically.';
                break;
            case 'export-docx':
                responseContent = '📝 **Exporting as DOCX...**\n\n'
                    + 'Your conversation has been exported to a Word document. '
                    + 'The download should start automatically.';
                break;
            case 'export-json':
                responseContent = '💾 **Exporting as JSON...**\n\n'
                    + 'Your conversation has been exported as JSON data. '
                    + 'This format is useful for data processing and integrations.';
                break;
            case 'export-txt':
                responseContent = '📋 **Exporting as Text...**\n\n'
                    + 'Your conversation has been exported as plain text. '
                    + 'The download should start automatically.';
                break;
            case 'share':
                responseContent = '🔗 **Share Conversation**\n\n'
                    + 'A shareable link has been generated:\n`https://example.com/chat/abc123`\n\n'
                    + 'This link will expire in 7 days. Anyone with this link can view the conversation.';
                break;
            case 'translate-es':
                responseContent = '🇪🇸 **Traduciendo al español...**\n\n'
                    + 'Su conversación ha sido traducida al español. '
                    + 'Los mensajes ahora se mostrarán en español.';
                break;
            case 'translate-fr':
                responseContent = '🇫🇷 **Traduction en français...**\n\n'
                    + 'Votre conversation a été traduite en français. '
                    + 'Les messages s\'afficheront maintenant en français.';
                break;
            case 'translate-de':
                responseContent = '🇩🇪 **Übersetzung ins Deutsche...**\n\n'
                    + 'Ihre Unterhaltung wurde ins Deutsche übersetzt. '
                    + 'Die Nachrichten werden nun auf Deutsch angezeigt.';
                break;
            case 'translate-ja':
                responseContent = '🇯🇵 **日本語に翻訳中...**\n\n'
                    + '会話が日本語に翻訳されました。メッセージは日本語で表示されます。';
                break;
            case 'translate-zh':
                responseContent = '🇨🇳 **正在翻译成中文...**\n\n'
                    + '您的对话已翻译成中文。消息现在将以中文显示。';
                break;
            case 'print':
                responseContent = '🖨️ **Print Conversation**\n\nPreparing conversation for printing...\n\nThe print dialog will open in a moment.';
                break;
            default:
                responseContent = `✅ Action selected: **${action.name}** (ID: ${action.id})`;
        }

        chatService.sendResponse({
            content: responseContent,
            groupId: `action-response-${action.id}`,
        });
    });

    // Listen for agent mode changes
    chatService.on('setAgentMode', ({ agentMode }) => {
        // eslint-disable-next-line no-console
        console.log('Agent mode changed:', agentMode);

        const modeDescriptions = {
            agent: '🤖 **Agent Mode Activated**\n\nI\'ll act as an autonomous agent that can plan and execute multi-step tasks. I\'ll break down complex requests into actionable steps and execute them systematically.',
            plan: '📋 **Plan Mode Activated**\n\nI\'ll create detailed plans before execution and wait for your approval. You\'ll have full control over what gets executed.',
            execute: '⚡ **Execute Mode Activated**\n\nI\'ll immediately execute your commands without detailed planning. This is best for straightforward tasks.',
            research: '🔍 **Research Mode Activated**\n\nI\'ll focus on gathering information and providing thorough analysis. I won\'t execute actions, only provide insights.',
        };

        chatService.sendResponse({
            content: modeDescriptions[agentMode] || `Agent mode changed to: ${agentMode}`,
            groupId: 'agent-mode-change',
        });
    });

    // Listen for model selection changes
    chatService.on('setSelectedModel', ({ model }) => {
        // eslint-disable-next-line no-console
        console.log('Model changed:', model);

        chatService.sendResponse({
            content: `✨ **Model Changed**\n\nNow using: **${model.name}**\n\n${model.description || 'This model will be used for all subsequent interactions.'}`,
            groupId: 'model-change',
        });
    });

    // Send initial welcome message explaining the demo
    setTimeout(() => {
        chatService.sendResponse({
            content: `👋 **Welcome to the Header Menus Demo!**

This demo showcases the three customizable dropdown menus available in the chat header:

## 1. Model Picker (Left Side)
Select different AI models with varying capabilities. Each model has different strengths and performance characteristics.

## 2. Agent Mode Selector (Left Side)
Choose how the AI should operate:
- **Agent Mode**: Autonomous planning and execution
- **Plan Mode**: Creates plans and waits for approval
- **Execute Mode**: Immediate execution without planning
- **Research Mode**: Information gathering and analysis

## 3. Custom Header Actions (Right Side - "..." Button)
Access custom actions with nested menus:
- **Export**: Save conversation in PDF, DOCX, JSON, or text format
- **Share**: Generate shareable links
- **Translate**: Convert conversation to different languages
- **Print**: Print the conversation
- **Advanced**: Additional configuration (currently disabled)

Try interacting with these menus to see how they work! All selections will be logged and trigger appropriate responses.`,
            groupId: 'welcome-message',
        });
    }, 500);

    // Add sample conversation to demonstrate the menus in context
    setTimeout(() => {
        chatService.sendRequest({
            content: 'Can you help me understand automation workflows?',
            groupId: 'sample-request',
        });
    }, 1500);

    setTimeout(() => {
        chatService.sendResponse({
            content: `Of course! **Automation workflows** are sequences of tasks that execute automatically without manual intervention.

### Key Components:

1. **Triggers**: Events that start the workflow (time-based, user actions, system events)
2. **Actions**: Tasks performed by the workflow (data processing, API calls, notifications)
3. **Conditions**: Logic that determines the workflow path
4. **Integrations**: Connections to external systems and services

### Best Practices:

- Start simple and iterate
- Include error handling and logging
- Test thoroughly before production deployment
- Document your workflows clearly

Try using the **Agent Mode** selector to switch between different interaction styles, or use the **Custom Actions** menu (⋮) to export this conversation for reference!`,
            groupId: 'sample-response',
        });
    }, 2500);
};
