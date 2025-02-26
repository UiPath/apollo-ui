import { AutopilotChatFileType } from '@uipath/portal-shell-util';

import FileIcon from '../assets/default-file.svg';
import PowerPointFileIcon from '../assets/ppt-file.svg';
import WordFileIcon from '../assets/word-file.svg';

export const fileToIcon = (file: File) => {
    const extension = file.name.split('.').pop();

    switch (extension) {
        case 'doc':
            return {
                icon: WordFileIcon,
                friendlyType: AutopilotChatFileType.Word,
            };
        case 'docx':
            return {
                icon: WordFileIcon,
                friendlyType: AutopilotChatFileType.Word,
            };
        case 'ppt':
            return {
                icon: PowerPointFileIcon,
                friendlyType: AutopilotChatFileType.PowerPoint,
            };
        case 'pptx':
            return {
                icon: PowerPointFileIcon,
                friendlyType: AutopilotChatFileType.PowerPoint,
            };
        default:
            return {
                icon: FileIcon,
                friendlyType: AutopilotChatFileType.File,
            };
    }
};
