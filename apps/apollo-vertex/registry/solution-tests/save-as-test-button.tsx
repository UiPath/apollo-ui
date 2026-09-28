"use client";

import { Check, FlaskConical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface SaveAsTestButtonProps {
  isSaved: boolean;
  isSaving: boolean;
  onSave: () => void;
  disabled?: boolean;
}

/** Presentational button for saving the current subject as a solution test. */
export const SaveAsTestButton = ({
  isSaved,
  isSaving,
  onSave,
  disabled = false,
}: SaveAsTestButtonProps) => {
  const { t } = useTranslation();
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled || isSaving || isSaved}
      onClick={onSave}
    >
      {isSaved ? (
        <Check className="size-4" />
      ) : isSaving ? (
        <Spinner className="size-4" />
      ) : (
        <FlaskConical className="size-4" />
      )}
      {isSaved ? t("saved_as_solution_test") : t("save_as_solution_test")}
    </Button>
  );
};
