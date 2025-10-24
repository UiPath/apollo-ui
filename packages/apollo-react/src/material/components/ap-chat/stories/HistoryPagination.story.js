import { defaultArgs } from './base.js';
import { createStandardPlay } from './helpers';
import { template } from './template';

export const HistoryPagination = (args) => template(args, 'history-pagination');

HistoryPagination.args = {
    ...defaultArgs,
    demoMode: 'history-pagination',
    useLocalHistory: true,
    paginatedHistory: true,
};

HistoryPagination.play = createStandardPlay('history-pagination');
