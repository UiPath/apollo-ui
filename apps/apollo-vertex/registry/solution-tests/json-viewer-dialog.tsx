"use client";

import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface JsonViewerDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  data: unknown;
  loading?: boolean;
}

export const JsonViewerDialog = ({
  open,
  onClose,
  title,
  data,
  loading,
}: JsonViewerDialogProps) => {
  const { t } = useTranslation();
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-hidden"
        style={{ maxWidth: "75vw", width: "fit-content", minWidth: "30vw" }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("json_viewer_description")}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto rounded-md border bg-muted/50 p-4">
          {loading ? (
            <div className="flex flex-col gap-2 py-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-words text-xs">
              {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
