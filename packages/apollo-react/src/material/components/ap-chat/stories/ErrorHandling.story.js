import { defaultArgs } from './base.js';
import { initializeChatService } from './helpers';
import { template } from './template';

export const ErrorHandling = (args) => template(args, 'error-handling');

ErrorHandling.args = {
    ...defaultArgs,
    demoMode: 'none',
    showFirstRun: false,
};

ErrorHandling.play = async ({
    canvasElement, args,
}) => {
    const storyId = 'error-handling';
    const container = args.mode === 'embedded' ?
        canvasElement.querySelector('#embedded-chat-container') : null;

    const chatService = initializeChatService(args, container, storyId, canvasElement);

    // Set the chat service instance on the component
    const chatElement = canvasElement.querySelector(`#chat-${storyId}`);
    if (chatElement) {
        chatElement.chatServiceInstance = chatService;
    }

    // Add initial welcome message
    setTimeout(() => {
        // eslint-disable-next-line max-len
        chatService.sendResponse({ content: '🛠️ **Error Handling Demo**\n\nThis demo showcases error state management. Use the buttons in the documentation panel to test setting and clearing errors.' });
    }, 500);

    // Set up error control handlers
    const setupErrorControls = () => {
        // Set Error button
        const setErrorButton = canvasElement.querySelector('#set-error-demo');
        if (setErrorButton) {
            setErrorButton.addEventListener('click', () => {
                chatService.setError('❌ Something went wrong! Please try again.');
                chatService.sendResponse({
                    content: '🔴 **Error Set!** Check the chat interface - an error message should now appear above the prompt box.',
                    groupId: 'error-demo',
                });
            });
        }

        // Clear Error button
        const clearErrorButton = canvasElement.querySelector('#clear-error-demo');
        if (clearErrorButton) {
            clearErrorButton.addEventListener('click', () => {
                chatService.clearError();
                chatService.sendResponse({
                    content: '✅ **Error Cleared!** The error message has been removed from above the prompt box.',
                    groupId: 'error-demo',
                });
            });
        }
    };

    // Initialize controls after a short delay to ensure DOM is ready
    setTimeout(setupErrorControls, 500);
};
