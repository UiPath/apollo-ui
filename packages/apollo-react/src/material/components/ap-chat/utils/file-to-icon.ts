import { getAttachmentFileType } from '@uipath/apollo-react/chat/headless/utils/file-type';
import { AutopilotChatFileType } from '@uipath/apollo-react/chat/service';
import type React from 'react';
import FileIcon from '../assets/default-file.svg';
import PowerPointFileIcon from '../assets/ppt-file.svg';
import WordFileIcon from '../assets/word-file.svg';

const ICONS: Record<AutopilotChatFileType, React.ComponentType> = {
  [AutopilotChatFileType.Word]: WordFileIcon as unknown as React.ComponentType,
  [AutopilotChatFileType.PowerPoint]: PowerPointFileIcon as unknown as React.ComponentType,
  [AutopilotChatFileType.File]: FileIcon as unknown as React.ComponentType,
};

export const fileToIcon = (
  name: string
): { icon: React.ComponentType; friendlyType: AutopilotChatFileType } => {
  const friendlyType = getAttachmentFileType(name);

  return { icon: ICONS[friendlyType], friendlyType };
};
