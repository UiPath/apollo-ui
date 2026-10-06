"use client";

import { PanelLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PreviewShellVariant } from "@/templates/shell/PreviewShell";
import { Choice } from "./layout-choice";

const SHELLS: readonly PreviewShellVariant[] = ["sidebar", "minimal"];

interface ShellMenuProps {
  shell: PreviewShellVariant;
  onShell: (shell: PreviewShellVariant) => void;
}

/**
 * The shell around the template, the one setting that isn't a slot's: in
 * a popover so the dock doesn't grow. Each slot's own settings are in its
 * popover.
 */
export function ShellMenu({ shell, onShell }: ShellMenuProps) {
  const { t } = useTranslation();
  return (
    <Popover>
      {/* An icon alone, so the dock fits one row on a laptop screen. */}
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              data-slot="workbench-shell"
              aria-label={t("workbench_shell")}
            >
              <PanelLeft aria-hidden />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("workbench_shell")}</TooltipContent>
      </Tooltip>
      <PopoverContent
        side="top"
        align="start"
        className="flex w-80 flex-col gap-4"
        data-slot="workbench-shell-menu"
      >
        <Choice
          label={t("workbench_shell")}
          value={shell}
          onChange={onShell}
          options={SHELLS.map((value) => ({
            value,
            label: t(`workbench_shell_${value}`),
          }))}
        />
      </PopoverContent>
    </Popover>
  );
}
