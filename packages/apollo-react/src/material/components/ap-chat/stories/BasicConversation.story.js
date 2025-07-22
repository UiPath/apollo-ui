import { defaultArgs } from './base.js';
import { createStandardPlay } from './helpers';
import { template } from './template';

export const BasicConversation = (args) => template(args, 'basic-conversation');

BasicConversation.args = {
    ...defaultArgs,
    demoMode: 'basic',
    showFirstRun: false,
};

BasicConversation.play = createStandardPlay('basic-conversation');
