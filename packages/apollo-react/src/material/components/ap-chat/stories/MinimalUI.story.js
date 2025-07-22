import { defaultArgs } from './base.js';
import { createStandardPlay } from './helpers';
import { template } from './template';

export const MinimalUI = (args) => template(args, 'minimal-ui');

MinimalUI.args = {
    ...defaultArgs,
    headerDisabled: true,
    footerDisabled: true,
    previewDisabled: true,
    attachmentsDisabled: true,
    historyDisabled: true,
    newChatDisabled: true,
};

MinimalUI.play = createStandardPlay('minimal-ui');
