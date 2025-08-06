import { defaultArgs } from './base.js';
import { createStandardPlay } from './helpers';
import { template } from './template';

export const WithCitations = (args) => template(args, 'with-citations');

WithCitations.args = {
    ...defaultArgs,
    demoMode: 'citations',
    showFirstRun: false,
};

WithCitations.play = createStandardPlay('with-citations');
