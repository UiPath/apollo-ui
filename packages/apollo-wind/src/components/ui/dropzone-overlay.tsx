'use client';

import { Upload } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib';
import { type FileRejection, type FileValidationOptions, validateFiles } from './file-validation';

/**
 * Turns a region, such as a chat panel or a composer, into a file drop target. While files are
 * dragged over it an overlay covers the region with a hint; dropped (or, with `enablePaste`,
 * pasted) files are checked against `accept`, `maxSize` and `maxFiles` and handed to `onFiles`.
 */

export interface DropzoneOverlayStrings {
  /** Shown on the overlay while files are dragged over the region. */
  dropHint: string;
}

export const DEFAULT_DROPZONE_OVERLAY_STRINGS: DropzoneOverlayStrings = {
  dropHint: 'Drop files to attach',
};

export interface DropzoneOverlayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    FileValidationOptions {
  /**
   * Called once per drop or paste, with the files that passed the checks and those that did not.
   * `maxFiles` counts each drop or paste on its own; pass what is left of a total cap.
   */
  onFiles?: (accepted: File[], rejected: FileRejection[]) => void;
  /** Ignores drags, drops and pastes. */
  disabled?: boolean;
  /** Also takes files pasted anywhere inside the region. Pastes without files are left alone. */
  enablePaste?: boolean;
  /** Overrides for any subset of the English strings. */
  strings?: Partial<DropzoneOverlayStrings>;
}

function hasFiles(dataTransfer: DataTransfer | null): boolean {
  return Array.from(dataTransfer?.types ?? []).includes('Files');
}

function filesFrom(data: DataTransfer | null): File[] {
  if (!data) return [];
  const files = Array.from(data.files ?? []);
  if (files.length > 0) return files;
  // Some browsers only expose pasted images through `items`.
  return Array.from(data.items ?? [])
    .filter((item) => item.kind === 'file')
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
}

const DropzoneOverlay = React.forwardRef<HTMLDivElement, DropzoneOverlayProps>(
  (
    {
      className,
      children,
      onFiles,
      accept,
      maxSize,
      maxFiles,
      disabled = false,
      enablePaste = false,
      strings,
      onDragEnter,
      onDragOver,
      onDragLeave,
      onDrop,
      onPaste,
      ...props
    },
    ref
  ) => {
    const text = React.useMemo(
      () => ({ ...DEFAULT_DROPZONE_OVERLAY_STRINGS, ...strings }),
      [strings]
    );
    const [dragging, setDragging] = React.useState(false);
    // dragenter and dragleave fire for every child crossed, so count depth instead of toggling.
    const depth = React.useRef(0);

    React.useEffect(() => {
      if (disabled) {
        depth.current = 0;
        setDragging(false);
      }
    }, [disabled]);

    const deliver = (files: File[]) => {
      if (files.length === 0) return;
      const { accepted, rejected } = validateFiles(files, { accept, maxSize, maxFiles });
      onFiles?.(accepted, rejected);
    };

    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: a drop and paste target around other content; keyboard users attach through the composer's own button
      <div
        ref={ref}
        data-slot="dropzone"
        data-dragging={dragging ? '' : undefined}
        className={cn('relative', className)}
        onDragEnter={(event) => {
          onDragEnter?.(event);
          if (disabled || !hasFiles(event.dataTransfer)) return;
          event.preventDefault();
          depth.current += 1;
          setDragging(true);
        }}
        onDragOver={(event) => {
          onDragOver?.(event);
          if (disabled || !hasFiles(event.dataTransfer)) return;
          // Without this the browser refuses the drop and opens the file instead.
          event.preventDefault();
          if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
        }}
        onDragLeave={(event) => {
          onDragLeave?.(event);
          if (disabled || !hasFiles(event.dataTransfer)) return;
          depth.current = Math.max(0, depth.current - 1);
          if (depth.current === 0) setDragging(false);
        }}
        onDrop={(event) => {
          onDrop?.(event);
          // Any drop ends the drag, including one the consumer handled itself.
          depth.current = 0;
          setDragging(false);
          if (disabled || event.defaultPrevented || !hasFiles(event.dataTransfer)) return;
          event.preventDefault();
          deliver(filesFrom(event.dataTransfer));
        }}
        onPaste={(event) => {
          onPaste?.(event);
          if (disabled || !enablePaste || event.defaultPrevented) return;
          const files = filesFrom(event.clipboardData);
          if (files.length === 0) return;
          // Keeps the browser from also pasting the file's name as text.
          event.preventDefault();
          deliver(files);
        }}
        {...props}
      >
        {children}
        {dragging && (
          <div
            data-slot="dropzone-overlay"
            className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 rounded-[inherit] border-2 border-dashed border-primary bg-background/85 text-sm font-medium text-foreground backdrop-blur-sm animate-in fade-in-0 motion-reduce:animate-none"
          >
            <Upload className="size-6 text-primary" aria-hidden="true" />
            <span>{text.dropHint}</span>
          </div>
        )}
      </div>
    );
  }
);
DropzoneOverlay.displayName = 'DropzoneOverlay';

export { DropzoneOverlay };
