import { defaultArgs } from './base.js';
import { createStandardPlay } from './helpers';
import { template } from './template';

export const StreamingResponse = (args) => template(args, 'streaming-response');

StreamingResponse.args = {
    ...defaultArgs,
    demoMode: 'streaming',
    showFirstRun: false,
};

StreamingResponse.play = createStandardPlay('streaming-response');
