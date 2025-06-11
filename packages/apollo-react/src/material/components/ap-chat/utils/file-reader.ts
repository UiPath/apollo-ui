import type { AutopilotChatFileInfo } from '@uipath/portal-shell-util';

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

    const fileResults = await Promise.all(Array.from(files).map(async (file) => {
        const result = await new Promise<AutopilotChatFileInfo>((resolve, reject) => {
            // Create separate promises for each format
            const readAsText = () => new Promise<string>((res, rej) => {
                const reader = new FileReader();
                reader.onload = (e) => res(e.target?.result as string);
                reader.onerror = () => rej('Error reading file as text');
                reader.readAsText(file);
            });

            const readAsBinary = () => new Promise<Uint8Array>((res, rej) => {
                const reader = new FileReader();
                reader.onload = (e) => res(new Uint8Array(e.target?.result as ArrayBuffer));
                reader.onerror = () => rej('Error reading file as binary');
                reader.readAsArrayBuffer(file);
            });

            const readAsBase64 = () => new Promise<string>((res, rej) => {
                const reader = new FileReader();
                reader.onload = (e) => res(e.target?.result as string);
                reader.onerror = () => rej('Error reading file as base64');
                reader.readAsDataURL(file);
            });

            // Execute all three reading methods
            Promise.all([
                readAsText().catch(() => null),
                readAsBinary().catch(() => null),
                readAsBase64().catch(() => null),
            ]).then(([ text, binary, base64 ]) => {
                try {
                    const fileInfo: AutopilotChatFileInfo = {
                        name: file.name,
                        type: file.type,
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
    }));

    return fileResults;
};
