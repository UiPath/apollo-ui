import type { AutopilotChatFileInfo } from '../service';

/**
 * Mapping of file extensions to MIME types for cases where browsers don't detect them properly
 */
const EXTENSION_TO_MIME_TYPE: Record<string, string> = {
  // Microsoft Visio
  '.vsdx': 'application/vnd.ms-visio.drawing',
  '.vdx': 'application/vnd.visio',
  '.vsd': 'application/vnd.visio',
  '.vss': 'application/vnd.visio',
  '.vst': 'application/vnd.visio',
  '.vsw': 'application/vnd.visio',
  '.vsx': 'application/vnd.visio',
  '.vtx': 'application/vnd.visio',

  // Microsoft Office (newer formats that might not be detected)
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.docm': 'application/vnd.ms-word.document.macroEnabled.12',
  '.dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  '.dotm': 'application/vnd.ms-word.template.macroEnabled.12',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xlsm': 'application/vnd.ms-excel.sheet.macroEnabled.12',
  '.xltx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
  '.xltm': 'application/vnd.ms-excel.template.macroEnabled.12',
  '.xlsb': 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.pptm': 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
  '.potx': 'application/vnd.openxmlformats-officedocument.presentationml.template',
  '.potm': 'application/vnd.ms-powerpoint.template.macroEnabled.12',
  '.ppsx': 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
  '.ppsm': 'application/vnd.ms-powerpoint.slideshow.macroEnabled.12',
  '.pub': 'application/x-mspublisher',
  '.xps': 'application/vnd.ms-xpsdocument',
  '.mpp': 'application/vnd.ms-project',

  // OpenDocument formats
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.odp': 'application/vnd.oasis.opendocument.presentation',
  '.odg': 'application/vnd.oasis.opendocument.graphics',
  '.odf': 'application/vnd.oasis.opendocument.formula',

  // Archive formats
  '.7z': 'application/x-7z-compressed',
  '.rar': 'application/vnd.rar',
  '.tar': 'application/x-tar',
  '.bz2': 'application/x-bzip2',
  '.xz': 'application/x-xz',

  // CAD formats
  '.dwg': 'application/acad',
  '.dxf': 'application/dxf',
  '.step': 'application/step',
  '.stp': 'application/step',
  '.iges': 'application/iges',
  '.igs': 'application/iges',

  // Adobe formats
  '.ai': 'application/illustrator',
  '.indd': 'application/x-indesign',
  '.fla': 'application/x-shockwave-flash',

  // Programming/Development files
  '.py': 'text/x-python',
  '.rb': 'application/x-ruby',
  '.go': 'text/x-go',
  '.rs': 'text/x-rust',
  '.kt': 'text/x-kotlin',
  '.swift': 'text/x-swift',
  '.scala': 'text/x-scala',
  '.r': 'text/x-r',
  '.m': 'text/x-matlab',
  '.pl': 'text/x-perl',
  '.sh': 'application/x-sh',
  '.ps1': 'application/x-powershell',
  '.bat': 'application/x-bat',
  '.cmd': 'application/x-bat',

  // Data formats
  '.parquet': 'application/parquet',
  '.avro': 'application/avro',
  '.orc': 'application/orc',
  '.jsonl': 'application/jsonlines',
  '.ndjson': 'application/x-ndjson',
  '.csv': 'text/csv',
  '.tsv': 'text/tab-separated-values',

  // Design formats
  '.sketch': 'application/sketch',
  '.fig': 'application/figma',
  '.xd': 'application/vnd.adobe.xd',
  '.afdesign': 'application/x-affinity-designer',
  '.afphoto': 'application/x-affinity-photo',
  '.afpub': 'application/x-affinity-publisher',

  // Database files
  '.sqlite': 'application/x-sqlite3',
  '.db': 'application/x-sqlite3',
  '.mdb': 'application/x-msaccess',
  '.accdb': 'application/x-msaccess',

  // Email formats
  '.eml': 'message/rfc822',
  '.msg': 'application/vnd.ms-outlook',
  '.pst': 'application/vnd.ms-outlook-pst',

  // Font formats
  '.otf': 'font/otf',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.eot': 'application/vnd.ms-fontobject',

  // Less common media formats
  '.flac': 'audio/flac',
  '.ape': 'audio/ape',
  '.m4a': 'audio/mp4',
  '.m4v': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.webm': 'video/webm',
  '.ogv': 'video/ogg',
  '.oga': 'audio/ogg',

  // Configuration files
  '.yaml': 'application/x-yaml',
  '.yml': 'application/x-yaml',
  '.toml': 'application/toml',
  '.ini': 'text/plain',
  '.cfg': 'text/plain',
  '.conf': 'text/plain',

  // Markup and documentation
  '.md': 'text/markdown',
  '.rst': 'text/x-rst',
  '.adoc': 'text/asciidoc',
  '.tex': 'application/x-latex',

  // Virtual machine and container formats
  '.ova': 'application/x-virtualbox-ova',
  '.ovf': 'application/x-virtualbox-ovf',
  '.vmdk': 'application/x-virtualbox-vmdk',
  '.vdi': 'application/x-virtualbox-vdi',
  '.docker': 'application/x-docker',
};

/**
 * Gets the correct MIME type for a file, falling back to extension mapping if needed
 */
const getCorrectMimeType = (file: File): string => {
  // If browser detected a valid MIME type, use it
  if (file.type && file.type !== 'application/octet-stream') {
    return file.type;
  }

  // Extract file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

  // Return mapped MIME type or fallback to octet-stream
  return EXTENSION_TO_MIME_TYPE[extension] || file.type || 'application/octet-stream';
};

/**
 * Parses files and returns an array of file information with all content formats.
 *
 * @param files - The files to parse.
 * @returns An array of file information containing all content formats.
 */
export const parseFiles = async (files: File[] | null) => {
  if (!files || files.length === 0) {
    return [];
  }

  const fileResults = await Promise.all(
    Array.from(files).map(async (file) => {
      const result = await new Promise<AutopilotChatFileInfo>((resolve, reject) => {
        // Create separate promises for each format
        const readAsText = () =>
          new Promise<string>((res, rej) => {
            const reader = new FileReader();
            reader.onload = (e) => res(e.target?.result as string);
            reader.onerror = () => rej('Error reading file as text');
            reader.readAsText(file);
          });

        const readAsBinary = () =>
          new Promise<Uint8Array>((res, rej) => {
            const reader = new FileReader();
            reader.onload = (e) => res(new Uint8Array(e.target?.result as ArrayBuffer));
            reader.onerror = () => rej('Error reading file as binary');
            reader.readAsArrayBuffer(file);
          });

        const readAsBase64 = () =>
          new Promise<string>((res, rej) => {
            const reader = new FileReader();
            reader.onload = (e) => res(e.target?.result as string);
            reader.onerror = () => rej('Error reading file as base64');

            // Create a new File object with the correct MIME type
            const correctMimeType = getCorrectMimeType(file);
            const fileWithCorrectType = new File([file], file.name, {
              type: correctMimeType,
              lastModified: file.lastModified,
            });

            reader.readAsDataURL(fileWithCorrectType);
          });

        // Execute all three reading methods
        Promise.all([
          readAsText().catch(() => null),
          readAsBinary().catch(() => null),
          readAsBase64().catch(() => null),
        ])
          .then(([text, binary, base64]) => {
            try {
              const correctMimeType = getCorrectMimeType(file);
              const fileInfo: AutopilotChatFileInfo = {
                name: file.name,
                type: correctMimeType,
                size: file.size,
                lastModified: file.lastModified,
                content: {
                  text,
                  binary,
                  base64,
                },
              };

              resolve(fileInfo);
            } catch (err) {
              reject('Error processing files');
            }
          })
          .catch(() => {
            reject('Error reading files');
          });
      });

      return result;
    })
  );

  return fileResults;
};
