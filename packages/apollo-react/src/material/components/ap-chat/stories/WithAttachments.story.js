import { defaultArgs } from './base.js';
import { createStandardPlay } from './helpers';
import { template } from './template';

export const WithAttachments = (args) => template(args, 'with-attachments');

WithAttachments.args = {
    ...defaultArgs,
    demoMode: 'attachments',
    showFirstRun: false,
};

WithAttachments.play = createStandardPlay('with-attachments');
