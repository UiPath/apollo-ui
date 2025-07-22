import { defaultArgs } from './base.js';
import { createStandardPlay } from './helpers';
import { template } from './template';

export const Default = (args) => template(args, 'default');

Default.args = {
    ...defaultArgs,
    demoMode: 'none',
};

Default.play = createStandardPlay('default');
