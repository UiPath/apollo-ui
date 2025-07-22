import { defaultArgs } from './base.js';
import { createStandardPlay } from './helpers';
import { template } from './template';

export const WithHistory = (args) => template(args, 'with-history');

WithHistory.args = {
    ...defaultArgs,
    demoMode: 'history',
    useLocalHistory: true,
};

WithHistory.play = createStandardPlay('with-history');
