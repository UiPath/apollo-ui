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
