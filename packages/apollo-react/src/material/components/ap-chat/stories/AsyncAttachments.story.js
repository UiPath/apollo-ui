import { defaultArgs } from './base.js';
import { createStandardPlay } from './helpers';
import { template } from './template';

export const AsyncAttachments = (args) => template(args, 'async-attachments');

AsyncAttachments.args = {
    ...defaultArgs,
    demoMode: 'async-attachments',
    showFirstRun: false,
};

AsyncAttachments.play = createStandardPlay('async-attachments');

