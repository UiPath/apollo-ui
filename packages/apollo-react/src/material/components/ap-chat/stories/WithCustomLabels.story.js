import { defaultArgs } from './base.js';
import { createStandardPlay } from './helpers';
import { template } from './template';

export const WithCustomLabels = (args) => template(args, 'with-custom-labels');

WithCustomLabels.args = {
    ...defaultArgs,
    inputPlaceholder: 'Ask me anything about automation...',
    footerDisclaimer: 'AI responses may contain errors. Always verify important information.',
    title: 'Custom Title',
};

WithCustomLabels.play = createStandardPlay('with-custom-labels');
