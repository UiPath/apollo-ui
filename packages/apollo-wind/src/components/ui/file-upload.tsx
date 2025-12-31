'use client';

import { Upload, X } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib';

export interface FileUploadProps {
  onFilesChange?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  maxSize?: number; // in bytes
  className?: string;
  showPreview?: boolean;
}

export function FileUpload({
  onFilesChange,
  accept,
  multiple = false,
  disabled = false,
  maxSize,
  className,
  showPreview = false,
}: FileUploadProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [previews, setPreviews] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const validateFiles = (fileList: File[]): File[] => {
    setError('');
    const validFiles: File[] = [];

    for (const file of fileList) {
      if (maxSize && file.size > maxSize) {
        setError(`File "${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`);
        continue;
      }
      validFiles.push(file);
    }

    return validFiles;
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    const validFiles = validateFiles(filesArray);

    if (validFiles.length === 0) return;

    const newFiles = multiple ? [...files, ...validFiles] : validFiles;
    setFiles(newFiles);
    onFilesChange?.(newFiles);

    // Generate previews for images
    if (showPreview) {
      const newPreviews: string[] = [];
      validFiles.forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            newPreviews.push(reader.result as string);
            if (
              newPreviews.length === validFiles.filter((f) => f.type.startsWith('image/')).length
            ) {
              setPreviews(multiple ? [...previews, ...newPreviews] : newPreviews);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange?.(newFiles);

    if (showPreview) {
      const newPreviews = previews.filter((_, i) => i !== index);
      setPreviews(newPreviews);
    }
    setError('');
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative flex flex-col items-center justify-center w-full h-32 px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-input bg-background hover:bg-accent/50',
          disabled && 'opacity-50 cursor-not-allowed hover:bg-background',
          error && 'border-destructive',
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleInputChange}
          aria-label="File upload"
        />
        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        {accept && (
          <p className="text-xs text-muted-foreground mt-1">{accept.split(',').join(', ')}</p>
        )}
        {maxSize && (
          <p className="text-xs text-muted-foreground">Max size: {formatFileSize(maxSize)}</p>
        )}
      </div>

      {error && <p className="text-sm text-destructive mt-2">{error}</p>}

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-accent/50 rounded-md"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {showPreview && previews[index] && (
                  <img
                    src={previews[index]}
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Remove ${file.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
