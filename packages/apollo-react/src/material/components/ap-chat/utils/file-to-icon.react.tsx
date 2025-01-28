import FileIcon from '../assets/default-file.svg';
import PowerPointFileIcon from '../assets/ppt-file.svg';
import WordFileIcon from '../assets/word-file.svg';
import { FileType } from '../models/chat.model';

export const fileToIcon = (file: File) => {
    const extension = file.name.split('.').pop();

    switch (extension) {
        case 'doc':
            return {
                icon: WordFileIcon,
                friendlyType: FileType.Word,
            };
        case 'docx':
            return {
                icon: WordFileIcon,
                friendlyType: FileType.Word,
            };
        case 'ppt':
            return {
                icon: PowerPointFileIcon,
                friendlyType: FileType.PowerPoint,
            };
        case 'pptx':
            return {
                icon: PowerPointFileIcon,
                friendlyType: FileType.PowerPoint,
            };
        default:
            return {
                icon: FileIcon,
                friendlyType: FileType.File,
            };
    }
};
