import type React from 'react';

import FileIcon from '../assets/default-file.svg';
import PowerPointFileIcon from '../assets/ppt-file.svg';
import WordFileIcon from '../assets/word-file.svg';
import { AutopilotChatFileType } from '../service';

export const fileToIcon = (
  name: string
): { icon: React.ComponentType; friendlyType: AutopilotChatFileType } => {
  const extension = name.split('.').pop();

  switch (extension) {
    case 'doc':
      return {
        icon: WordFileIcon as unknown as React.ComponentType,
        friendlyType: AutopilotChatFileType.Word,
      };
    case 'docx':
      return {
        icon: WordFileIcon as unknown as React.ComponentType,
        friendlyType: AutopilotChatFileType.Word,
      };
    case 'ppt':
      return {
        icon: PowerPointFileIcon as unknown as React.ComponentType,
        friendlyType: AutopilotChatFileType.PowerPoint,
      };
    case 'pptx':
      return {
        icon: PowerPointFileIcon as unknown as React.ComponentType,
        friendlyType: AutopilotChatFileType.PowerPoint,
      };
    default:
      return {
        icon: FileIcon as unknown as React.ComponentType,
        friendlyType: AutopilotChatFileType.File,
      };
  }
};
