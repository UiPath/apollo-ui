import { AutopilotChatFileType } from '../../service';

/** The friendly type the chat shows for an attached file, from its extension. */
export function getAttachmentFileType(name: string): AutopilotChatFileType {
  // Case-sensitive, as the Material renderer has always matched extensions.
  switch (name.split('.').pop()) {
    case 'doc':
    case 'docx':
      return AutopilotChatFileType.Word;
    case 'ppt':
    case 'pptx':
      return AutopilotChatFileType.PowerPoint;
    default:
      return AutopilotChatFileType.File;
  }
}
