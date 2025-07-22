import { prettyPrint } from '../../../stories/helper';
import { defaultArgs } from './base.js';
import {
    getStoryDocs,
    initializeChatService,
} from './helpers';

// Custom template for embedded mode with floating chat
export const EmbeddedMode = (args) => {
    const docs = getStoryDocs('embedded-mode');

    const content = prettyPrint(`
        <ap-theme-provider theme="light">
            <div style="display: flex; height: 100vh; gap: 20px; padding: 20px;">
                <!-- Documentation Panel (Full Width) -->
                <div style="
                    flex: 1; 
                    background: white; 
                    border-radius: 8px; 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
                    padding: 30px;
                    overflow-y: auto;
                    max-height: 100%;
                ">
                <div class="story-docs" style="
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #333;
                ">
                    ${docs.split('\\n').map(line => {
        if (line.startsWith('# ')) {
            return `<h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">${line.substring(2)}</h1>`;
        } else if (line.startsWith('## ')) {
            return `<h2 style="color: #34495e; margin-top: 30px; margin-bottom: 15px;">${line.substring(3)}</h2>`;
        } else if (line.startsWith('**') && line.endsWith(':**')) {
            return `<h3 style="color: #7f8c8d; margin-top: 20px; margin-bottom: 10px;">${line.substring(2, line.length - 3)}</h3>`;
        } else if (line.startsWith('- ')) {
            return `<li style="margin-bottom: 5px;">${line.substring(2)}</li>`;
        } else if (line.trim() === '') {
            return '<br>';
        }
        return `<p style="margin-bottom: 15px;">${line}</p>`;
    })
        .join('')}
                </div>
                
                <div style="margin-top: 30px; padding: 20px; background: #e8f4f8; border-radius: 8px; border-left: 4px solid #3498db;">
                    <h3 style="color: #2c3e50; margin-top: 0;">Interactive Demo Controls</h3>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <ap-theme-provider theme="light">
                            <ap-button id="send-demo" label="Send Demo Message"></ap-button>
                        </ap-theme-provider>
                        <ap-theme-provider theme="light">
                            <ap-button id="clear-chat" label="Clear Chat"></ap-button>
                        </ap-theme-provider>
                        <ap-theme-provider theme="light">
                            <ap-button id="toggle-chat" label="Toggle Chat"></ap-button>
                        </ap-theme-provider>
                    </div>
                    
                </div>
            </div>
        
            <!-- Floating Chat Container -->
        <div id="embedded-chat-container" style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 380px;
            height: 600px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 5px 20px rgba(0,0,0,0.15);
            background: white;
            z-index: 1000;
            transition: all 0.3s ease;
        "></div>
        </ap-theme-provider>
    `);

    return content;
};

EmbeddedMode.args = {
    ...defaultArgs,
    mode: 'embedded',
    headerDisabled: false, // Keep header for minimize functionality
    closeDisabled: false, // Allow closing in embedded mode
    resizeDisabled: true,
    fullScreenDisabled: true,
};

EmbeddedMode.play = async ({
    canvasElement, args,
}) => {
    const storyId = 'embedded-mode';
    const container = canvasElement.querySelector('#embedded-chat-container');
    const chatService = initializeChatService(args, container, storyId, canvasElement);

    // Add embedded mode interactions
    const sendButton = canvasElement.querySelector('#send-demo');
    const clearButton = canvasElement.querySelector('#clear-chat');
    const toggleButton = canvasElement.querySelector('#toggle-chat');

    sendButton?.addEventListener('click', () => {
        chatService.sendRequest({ content: 'This is a demo message from the floating chat!' });
        setTimeout(() => {
            // eslint-disable-next-line max-len
            chatService.sendResponse({ content: 'Thanks for trying the floating embedded chat! This widget can be positioned anywhere in your application.' });
        }, 1000);
    });

    clearButton?.addEventListener('click', () => {
        chatService.newChat();
    });

    // Toggle chat visibility
    toggleButton?.addEventListener('click', () => {
        const floatingContainer = canvasElement.querySelector('#embedded-chat-container');
        if (floatingContainer) {
            const isVisible = floatingContainer.style.display !== 'none';
            if (isVisible) {
                floatingContainer.style.display = 'none';
                toggleButton.setAttribute('label', 'Show Chat');
            } else {
                floatingContainer.style.display = 'block';
                toggleButton.setAttribute('label', 'Hide Chat');
                chatService.open({
                    mode: 'embedded',
                    embeddedContainer: floatingContainer,
                });
            }
        }
    });

    // Listen for close events and hide the floating container
    chatService.on('close', () => {
        const floatingContainer = canvasElement.querySelector('#embedded-chat-container');
        if (floatingContainer) {
            floatingContainer.style.display = 'none';
            toggleButton?.setAttribute('label', 'Show Chat');
        }
    });
};

