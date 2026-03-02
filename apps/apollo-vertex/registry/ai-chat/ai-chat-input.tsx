"use client";

import { Paperclip, Send, Square, Trash2, X } from "lucide-react";
import {
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

interface AiChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (files?: File[]) => void;
  onStop: () => void;
  onClear?: () => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  showClearButton?: boolean;
  hasMessages?: boolean;
  allowFileAttachments?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
}

export interface AiChatInputHandle {
  focus: () => void;
}

export const AiChatInput = forwardRef<AiChatInputHandle, AiChatInputProps>(
  function AiChatInput(
    {
      value,
      onChange,
      onSubmit,
      onStop,
      onClear,
      isLoading,
      disabled = false,
      placeholder,
      showClearButton = true,
      hasMessages = false,
      allowFileAttachments = true,
      maxFiles = 5,
      maxFileSize = 10 * 1024 * 1024,
      acceptedFileTypes,
    },
    ref,
  ) {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const displayPlaceholder = placeholder ?? t("type_a_message");

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      if ((!value.trim() && selectedFiles.length === 0) || isLoading) return;
      onSubmit(selectedFiles.length > 0 ? selectedFiles : undefined);
      setSelectedFiles([]);
      setFileError(null);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const validateFile = (file: File): string | null => {
      if (maxFileSize && file.size > maxFileSize) {
        return t("file_too_large", {
          name: file.name,
          maxSize: formatFileSize(maxFileSize),
        });
      }

      if (acceptedFileTypes && acceptedFileTypes.length > 0) {
        const isAccepted = acceptedFileTypes.some((type) => {
          if (type.startsWith(".")) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          if (type.endsWith("/*")) {
            const category = type.split("/")[0];
            return file.type.startsWith(category + "/");
          }
          return file.type === type;
        });

        if (!isAccepted) {
          return t("file_type_not_accepted", { name: file.name });
        }
      }

      return null;
    };

    const handleFilesSelect = (files: File[]) => {
      setFileError(null);

      if (selectedFiles.length + files.length > maxFiles) {
        setFileError(t("too_many_files", { max: maxFiles }));
        return;
      }

      const validFiles: File[] = [];
      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          setFileError(error);
          return;
        }
        validFiles.push(file);
      }

      setSelectedFiles((prev) => [...prev, ...validFiles]);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        handleFilesSelect(files);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const handleRemoveFile = (index: number) => {
      setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
      setFileError(null);
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files || []);
      if (files.length > 0) {
        handleFilesSelect(files);
      }
    };

    return (
      <div className="p-3">
        {allowFileAttachments && selectedFiles.length > 0 && (
          <div className="mb-2 px-3">
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border"
                >
                  <Paperclip className="size-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="ml-2 size-5 rounded-full flex items-center justify-center hover:bg-background transition-colors"
                    title={t("remove_file")}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {fileError && (
          <div className="mb-2 px-3">
            <p className="text-sm text-destructive">{fileError}</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <form
            onSubmit={handleSubmit}
            onDragOver={allowFileAttachments ? handleDragOver : undefined}
            onDragLeave={allowFileAttachments ? handleDragLeave : undefined}
            onDrop={allowFileAttachments ? handleDrop : undefined}
            className={
              allowFileAttachments && isDragging
                ? "flex-1 flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-colors bg-primary/10 border-dashed border-primary"
                : "flex-1 flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-colors bg-muted/50 border-transparent"
            }
          >
            {allowFileAttachments && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInputChange}
                  accept={acceptedFileTypes?.join(",")}
                  multiple={maxFiles > 1}
                  className="hidden"
                  disabled={isLoading || disabled}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="size-8 rounded-full flex-shrink-0 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                  disabled={
                    isLoading || disabled || selectedFiles.length >= maxFiles
                  }
                  title={
                    selectedFiles.length >= maxFiles
                      ? t("max_files_reached")
                      : t("attach_file")
                  }
                >
                  <Paperclip className="size-4" />
                </button>
              </>
            )}
            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={displayPlaceholder}
              className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline-none min-h-[32px] max-h-[120px] py-1"
              rows={1}
              disabled={isLoading || disabled}
            />
            {isLoading ? (
              <button
                type="button"
                className="size-8 rounded-full flex-shrink-0 flex items-center justify-center hover:bg-muted transition-colors"
                onClick={onStop}
                title={t("stop")}
              >
                <Square className="size-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="size-8 rounded-full flex-shrink-0 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  (!value.trim() && selectedFiles.length === 0) || disabled
                }
                title={t("send")}
              >
                <Send className="size-4" />
              </button>
            )}
          </form>
          {showClearButton && hasMessages && onClear && (
            <button
              type="button"
              className="size-8 rounded-full flex-shrink-0 flex items-center justify-center hover:bg-muted transition-colors"
              onClick={onClear}
              title={t("clear_conversation")}
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>
    );
  },
);
