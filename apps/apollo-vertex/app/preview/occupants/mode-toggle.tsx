"use client";

import { useTranslation } from "react-i18next";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SELECTED_SEGMENT } from "./segment";

const MODES = [
  { value: "preview", label: "workbench_mode_preview" },
  { value: "edit", label: "workbench_mode_edit" },
] as const;

interface ModeToggleProps {
  editing: boolean;
  onEditing: (editing: boolean) => void;
}

/**
 * Preview or Edit, in the header in the template view: a segmented
 * control, labeled, with the chosen one filled, neutral. Preview is the page as
 * people use it; Edit outlines every slot, and a click selects one for
 * the inspector.
 */
export function ModeToggle({ editing, onEditing }: ModeToggleProps) {
  const { t } = useTranslation();
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-label={t("workbench_mode")}
      data-slot="workbench-mode"
      className="shrink-0"
      value={editing ? "edit" : "preview"}
      onValueChange={(next) => {
        if (next) onEditing(next === "edit");
      }}
    >
      {MODES.map(({ value, label }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          className={`px-3 ${SELECTED_SEGMENT}`}
        >
          {t(label)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
