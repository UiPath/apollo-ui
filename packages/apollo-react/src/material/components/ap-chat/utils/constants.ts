import { AutopilotChatMarkdownRenderer } from '../components/message/markdown/markdown.react';

export const DEFAULT_MESSAGE_RENDERER = 'apollo-markdown-renderer';
export const ACCEPTED_FILES = {
    'text/csv': [ '.csv' ],
    'application/json': [ '.json' ],
    'text/plain': [ '.txt' ],
    'application/pdf': [ '.pdf' ],
    'image/png': [ '.png' ],
    'image/jpeg': [ '.jpg', '.jpeg' ],
    'image/tiff': [ '.tif', '.tiff' ],
    'application/msword': [ '.doc' ],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [ '.docx' ],
    'application/vnd.ms-excel': [ '.xls' ],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [ '.xlsx' ],
    'application/vnd.ms-powerpoint': [ '.ppt' ],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': [ '.pptx' ],
    'application/x-bpmn': [ '.bpmn' ],
} as const;

export const ACCEPTED_FILE_EXTENSIONS = Object.values(ACCEPTED_FILES)
    .flat()
    .join(',');

export const CHAT_WIDTH_FULL_SCREEN = '100vw';
export const CHAT_WIDTH_SIDE_BY_SIDE_MIN = 440;
export const CHAT_WIDTH_SIDE_BY_SIDE_MAX = 800;
export const CHAT_MESSAGE_MIN_PADDING = 32;
export const CHAT_MESSAGE_MAX_PADDING = 72;
export const CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH = '960px';
export const CHAT_INPUT_MAX_ROWS = 12;
export const CHAT_STORAGE_PREFIX = 'autopilot-chat-';
export const CHAT_WIDTH_KEY = 'width';

export const APOLLO_MESSAGE_RENDERERS = [ {
    name: DEFAULT_MESSAGE_RENDERER,
    component: AutopilotChatMarkdownRenderer,
} ];
