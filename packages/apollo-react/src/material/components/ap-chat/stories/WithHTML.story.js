import { defaultArgs } from './base.js';
import { createStandardPlay } from './helpers.js';
import { template } from './template.js';

export const WithHTML = (args) => template(args, 'with-html');

WithHTML.args = {
    ...defaultArgs,
    demoMode: 'html',
    showFirstRun: false,
};

WithHTML.play = createStandardPlay('with-html');
