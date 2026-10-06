"use client";

import { Eye, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MODES = [
  { value: "preview", icon: Eye, label: "workbench_mode_preview" },
  { value: "edit", icon: Pencil, label: "workbench_mode_edit" },
] as const;

interface ModeToggleProps {
  editing: boolean;
  onEditing: (editing: boolean) => void;
}

/**
 * Preview or Edit, in the header in the template view. Preview is the
 * page as people use it; Edit outlines every slot and opens one with a
 * click. Two icons, named, with tooltips.
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
      value={editing ? "edit" : "preview"}
      onValueChange={(next) => {
        if (next) onEditing(next === "edit");
      }}
    >
      {MODES.map(({ value, icon: Icon, label }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value={value}
              aria-label={t(label)}
              className="data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Icon aria-hidden />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>{t(label)}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}
