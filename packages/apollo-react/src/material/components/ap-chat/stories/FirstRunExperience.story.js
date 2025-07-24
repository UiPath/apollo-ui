import { defaultArgs } from './base.js';
import { initializeChatService } from './helpers';
import { template } from './template';

export const FirstRunExperience = (args) => template(args, 'first-run-experience');

FirstRunExperience.args = {
    ...defaultArgs,
    demoMode: 'none',
    showFirstRun: true,
    firstRunTitle: 'Welcome to Autopilot Chat!',
    // eslint-disable-next-line max-len
    firstRunDescription: 'I\'m here to help you with automation questions, process guidance, and UiPath best practices. Get started by asking a question or choosing from the suggestions below.',
};

FirstRunExperience.play = async ({
    canvasElement, args,
}) => {
    const storyId = 'first-run-experience';
    const container = args.mode === 'embedded' ?
        canvasElement.querySelector('#embedded-chat-container') : null;

    const chatService = initializeChatService(args, container, storyId, canvasElement);

    // Set the chat service instance on the component
    const chatElement = canvasElement.querySelector(`#chat-${storyId}`);
    if (chatElement) {
        chatElement.chatServiceInstance = chatService;
    }

};
