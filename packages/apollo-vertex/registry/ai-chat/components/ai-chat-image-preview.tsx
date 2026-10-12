"use client";

import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export interface AiChatImagePreviewProps {
  url: string | null;
  onClose: () => void;
}

export function AiChatImagePreview({ url, onClose }: AiChatImagePreviewProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={!!url} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        fullscreen
        className="bg-black/80 border-0 flex items-center justify-center"
      >
        <DialogTitle className="sr-only">{t("image_preview")}</DialogTitle>
        <DialogDescription className="sr-only">
          {t("image_preview")}
        </DialogDescription>
        {url && (
          <img
            src={url}
            alt={t("image_preview")}
            className="max-w-[90vw] max-h-[90vh] rounded-lg object-contain"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
