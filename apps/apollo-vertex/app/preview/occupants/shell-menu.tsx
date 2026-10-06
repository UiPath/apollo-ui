"use client";

import { PanelLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" data-slot="workbench-shell">
          <PanelLeft aria-hidden />
          {t("workbench_shell")}
        </Button>
      </PopoverTrigger>
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
