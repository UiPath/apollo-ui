"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useVertexTranslation } from "@/lib/vertex-translation";
import { TEST_NAME_MAX_LENGTH } from "./constants";

interface RenameTestDialogProps {
  currentName: string;
  renaming: boolean;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export const RenameTestDialog = ({
  currentName,
  renaming,
  onConfirm,
  onCancel,
}: RenameTestDialogProps) => {
  const { t } = useVertexTranslation();
  const inputId = useId();
  const [name, setName] = useState(currentName);
  const trimmed = name.trim();
  const isUnchanged = trimmed === currentName.trim();
  const canSave = !renaming && trimmed !== "" && !isUnchanged;

  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen && !renaming) {
          onCancel();
        }
      }}
    >
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSave) {
              onConfirm(trimmed);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("rename_test")}</DialogTitle>
            <DialogDescription>
              {t("rename_test_description")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-4">
            <Label htmlFor={inputId}>{t("test_name")}</Label>
            <Input
              id={inputId}
              data-vs-track="solution_test_rename_name"
              value={name}
              maxLength={TEST_NAME_MAX_LENGTH}
              disabled={renaming}
              autoFocus
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={renaming}
              data-vs-track="solution_test_rename_cancel"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!canSave}
              data-vs-track="solution_test_rename_save"
            >
              {renaming ? <Spinner className="size-4" /> : null}
              {t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
