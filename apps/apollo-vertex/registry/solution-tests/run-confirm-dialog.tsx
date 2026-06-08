"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface RunConfirmDialogProps {
  open: boolean;
  /** Label for the confirm button, e.g. "Run" or "Run all". */
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RunConfirmDialog = ({
  open,
  confirmLabel,
  onConfirm,
  onCancel,
}: RunConfirmDialogProps) => {
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
          <DialogTitle>{t("are_you_sure")}</DialogTitle>
          <DialogDescription>
            {t("confirm_run_tests_description")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button variant="warning" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
