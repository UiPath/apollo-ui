import { defaultArgs } from './base.js';
import { createStandardPlay } from './helpers';
import { template } from './template';

export const FullScreenMode = (args) => template(args, 'full-screen-mode');

FullScreenMode.args = {
    ...defaultArgs,
    mode: 'full-screen',
};

FullScreenMode.play = createStandardPlay('full-screen-mode');
