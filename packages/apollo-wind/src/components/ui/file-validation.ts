/**
 * File checks shared by FileUpload, ChatComposerAttachButton and DropzoneOverlay. `accept` matches
 * MIME wildcards (`image/*`), exact MIME types (`image/png`) and extensions (`.pdf`).
 */

export type FileRejectionReason = 'type' | 'size' | 'count';

export interface FileRejection {
  file: File;
  reason: FileRejectionReason;
}

export interface FileValidationOptions {
  /** A comma-separated `accept` string, or a list of its entries. Omit to accept any type. */
  accept?: string | string[];
  /** Largest accepted size, in bytes. */
  maxSize?: number;
  /** Most files accepted in one batch; the rest are rejected with `count`. */
  maxFiles?: number;
}

function acceptEntries(accept: string | string[]): string[] {
  const list = Array.isArray(accept) ? accept : accept.split(',');
  return list.map((entry) => entry.trim().toLowerCase()).filter(Boolean);
}

export function isFileTypeAccepted(file: File, accept?: string | string[]): boolean {
  if (!accept) return true;
  const entries = acceptEntries(accept);
  if (entries.length === 0) return true;

  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return entries.some((entry) => {
    if (entry.endsWith('/*')) return type.startsWith(entry.slice(0, -1));
    if (entry.includes('/')) return type === entry;
    if (entry.startsWith('.')) return name.endsWith(entry);
    return false;
  });
}

/** Splits a batch into accepted files and rejections, checking type, then size, then count. */
export function validateFiles(
  files: File[],
  { accept, maxSize, maxFiles }: FileValidationOptions = {}
): { accepted: File[]; rejected: FileRejection[] } {
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];

  for (const file of files) {
    if (!isFileTypeAccepted(file, accept)) {
      rejected.push({ file, reason: 'type' });
    } else if (maxSize !== undefined && file.size > maxSize) {
      rejected.push({ file, reason: 'size' });
    } else if (maxFiles !== undefined && accepted.length >= maxFiles) {
      rejected.push({ file, reason: 'count' });
    } else {
      accepted.push(file);
    }
  }

  return { accepted, rejected };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}
