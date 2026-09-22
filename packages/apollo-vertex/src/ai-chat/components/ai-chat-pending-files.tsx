"use client";

import { FileText, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { PendingFile } from "../hooks/use-pending-files";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface AiChatPendingFilesProps {
  files: PendingFile[];
  onRemove: (uid: string) => void;
  onPreview: (url: string) => void;
}

export function AiChatPendingFiles({
  files,
  onRemove,
  onPreview,
}: AiChatPendingFilesProps) {
  const { t } = useTranslation();
  if (files.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 px-3 pt-2">
      {files.map((pf) => {
        const label = (
          <>
            <span className="max-w-[120px] truncate">{pf.name}</span>
            <span className="text-ai-chat-muted-foreground">
              {formatFileSize(pf.size)}
            </span>
          </>
        );
        return (
          <div
            key={pf.uid}
            className="flex items-center gap-1.5 rounded-lg border border-ai-chat-border bg-ai-chat-muted pl-2 pr-1 py-1 text-xs text-ai-chat-foreground"
          >
            {pf.thumbnailUrl ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => pf.thumbnailUrl && onPreview(pf.thumbnailUrl)}
                className="h-auto p-0 gap-1.5 hover:bg-transparent font-normal text-xs text-ai-chat-foreground"
                aria-label={t("preview_file", { name: pf.name })}
              >
                <img
                  src={pf.thumbnailUrl}
                  alt=""
                  className="size-5 rounded-sm flex-shrink-0 object-cover"
                />
                {label}
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <FileText
                  className="size-4 flex-shrink-0 text-ai-chat-muted-foreground"
                  aria-hidden="true"
                />
                {label}
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onRemove(pf.uid)}
              aria-label={t("remove_file", { name: pf.name })}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
