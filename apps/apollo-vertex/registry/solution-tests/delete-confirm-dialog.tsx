"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmDialog = ({
  open,
  deleting,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("confirm_delete_test")}</DialogTitle>
          <DialogDescription>
            {t("confirm_delete_test_description")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel} disabled={deleting}>
            {t("cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? <Spinner className="size-4" /> : null}
            {t("delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
