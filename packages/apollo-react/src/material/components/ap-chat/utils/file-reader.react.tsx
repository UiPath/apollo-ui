import { FileInfo } from '../models/chat.model';
import { fileToIcon } from './file-to-icon.react';
/**
 * Parses files and returns an array of file information.
 *
 * @param files - The files to parse.
 * @param expectedFormat - The expected format of the files.
 * @returns An array of file information.
 */
export const parseFiles = async (files: File[] | null, expectedFormat: 'text' | 'binary' | 'base64') => {
    if (!files || files.length === 0) {
        return [];
    }

    const fileResults = await Promise.all(Array.from(files).map(async (file) => {
        const result = await new Promise<FileInfo>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                const {
                    friendlyType, icon,
                } = fileToIcon(file);

                try {
                    const content = e.target?.result;
                    const fileInfo: FileInfo = {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        lastModified: file.lastModified,
                        content: typeof content === 'string'
                            ? content
                            : new Uint8Array(content as ArrayBuffer),
                        icon,
                        friendlyType,
                    };
                    resolve(fileInfo);
                } catch (err) {
                    reject('Error processing files');
                }
            };

            reader.onerror = () => {
                reject('Error reading files');
            };

            if (expectedFormat === 'text') {
                reader.readAsText(file);
            } else if (expectedFormat === 'binary') {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsDataURL(file);
            }
        });

        return result;
    }));

    return fileResults;
};
