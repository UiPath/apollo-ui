import { defaultArgs } from './base.js';
import { createStandardPlay } from './helpers';
import { template } from './template';

export const StreamingWithCitations = (args) => template(args, 'streaming-with-citations');

StreamingWithCitations.args = {
    ...defaultArgs,
    demoMode: 'streaming-citations',
    showFirstRun: false,
};

StreamingWithCitations.play = createStandardPlay('streaming-with-citations');
