"use client";

import { PanelLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TemplateHost } from "@/app/_components/template-hosts";
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
import { type LayoutChoices, resolveLayout } from "@/lib/layout";
import type { PreviewShellVariant } from "@/templates/shell/PreviewShell";
import { PictureChoice } from "./picture-choice";
import { SHELL_WIDTH } from "./workbench-url-state";

const SHELLS: readonly PreviewShellVariant[] = ["sidebar", "minimal"];

interface ShellMenuProps {
  shell: PreviewShellVariant;
  onShell: (shell: PreviewShellVariant) => void;
  /** The template and its layout, for each shell's picture of the page. */
  host: TemplateHost;
  layout: LayoutChoices;
  /** The page's width, shell included, for the shell's share of it. */
  pageWidth: number;
}

/**
 * The shell around the template, the one setting that isn't a slot's: in
 * a popover so the dock doesn't grow. Each shell is a picture of the page
 * with it, its column as wide as the shell is of the page, drawn from
 * the shell's width and the template's layout, as the inspector's
 * layout choices are.
 */
export function ShellMenu({
  shell,
  onShell,
  host,
  layout,
  pageWidth,
}: ShellMenuProps) {
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
        className="flex w-72 flex-col gap-1.5"
        data-slot="workbench-shell-menu"
      >
        <span className="text-sm">{t("workbench_shell")}</span>
        <PictureChoice
          name={t("workbench_shell")}
          slot="shell"
          value={shell}
          onChange={(next) => {
            const chosen = SHELLS.find((s) => s === next);
            if (chosen) onShell(chosen);
          }}
          options={SHELLS.map((value) => ({
            value,
            label: t(`workbench_shell_${value}`),
            layout: resolveLayout(host.spec, layout),
            lock: null,
            shell: { width: SHELL_WIDTH[value], page: pageWidth },
          }))}
        />
      </PopoverContent>
    </Popover>
  );
}
