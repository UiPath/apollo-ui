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
};

export const ACCEPTED_FILE_MAX_COUNT = 10;
export const ACCEPTED_FILE_MAX_SIZE = 512 * 1024 * 1024; // 512MB -- same as chat gpt (can be overriden by consumer)
export const CHAT_WIDTH_FULL_SCREEN = '100vw';
export const CHAT_CONTAINER_ANIMATION_DURATION = 200;
export const CHAT_HISTORY_WIDTH_FULL_SCREEN = 372;
export const CHAT_WIDTH_SIDE_BY_SIDE_MIN = 440;
export const CHAT_WIDTH_SIDE_BY_SIDE_MAX = 800;
export const CHAT_MESSAGE_MIN_PADDING = 32; // min margin left --> 24 (parent) + 32 = 56
export const CHAT_MESSAGE_MAX_PADDING = 96; // max margin left --> 24 (parent) + 96 = 120
export const CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH = '960px';
export const CHAT_INPUT_MIN_ROWS = 2;
export const CHAT_INPUT_MAX_ROWS = 12;
export const CHAT_WIDTH_KEY = 'width';
export const CHAT_MODE_KEY = 'mode';
export const CHAT_ACTIVE_CONVERSATION_ID_KEY = 'activeConversationId';
export const CHAT_SCROLL_BOTTOM_BUFFER = 200;
