"use client";

import { useTranslation } from "react-i18next";
import type { TemplateHost } from "@/app/_components/template-hosts";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { LayoutChoices } from "@/lib/layout";
import type { PreviewShellVariant } from "@/templates/shell/PreviewShell";
import { Dock, DockSlider } from "./dock-parts";
import { SELECTED_SEGMENT } from "./segment";
import { ShellMenu } from "./shell-menu";
import {
  PAGE_WIDTH_MAX,
  pageWidthMin,
  type WorkbenchZoom,
} from "./workbench-url-state";

const ZOOMS: readonly WorkbenchZoom[] = ["fit", "actual"];

/** The page width moves in larger steps than a surface's. */
const PAGE_WIDTH_STEP = 8;

interface TemplateDockProps {
  host: TemplateHost;
  shell: PreviewShellVariant;
  onShell: (shell: PreviewShellVariant) => void;
  /** The page's layout choices, for the shells' pictures. */
  layout: LayoutChoices;
  pageWidth: number;
  onPageWidth: (width: number) => void;
  zoom: WorkbenchZoom;
  onZoom: (zoom: WorkbenchZoom) => void;
  /** The page's current scale on the stage, for the zoom level. */
  scale: number;
}

/**
 * The template view's dock: the shell, the page width (the whole window,
 * shell included), and the zoom. Slots are selected on the stage, and
 * edited in the inspector.
 */
export function TemplateDock({
  host,
  shell,
  onShell,
  layout,
  pageWidth,
  onPageWidth,
  zoom,
  onZoom,
  scale,
}: TemplateDockProps) {
  const { t } = useTranslation();
  return (
    <Dock>
      <ShellMenu
        shell={shell}
        onShell={onShell}
        host={host}
        layout={layout}
        pageWidth={pageWidth}
      />
      <Separator orientation="vertical" className="h-8" />
      <div className="flex items-center gap-3">
        <DockSlider
          label={t("workbench_page_width")}
          valueText={t("workbench_px", { width: pageWidth })}
          min={pageWidthMin(host, shell)}
          max={PAGE_WIDTH_MAX}
          step={PAGE_WIDTH_STEP}
          value={pageWidth}
          onChange={onPageWidth}
          measures="page-width"
        />
      </div>
      <Separator orientation="vertical" className="h-8" />
      <div className="flex items-center gap-3">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          aria-label={t("workbench_zoom")}
          value={zoom}
          onValueChange={(next) => {
            const chosen = ZOOMS.find((z) => z === next);
            if (chosen) onZoom(chosen);
          }}
        >
          {ZOOMS.map((z) => (
            <ToggleGroupItem key={z} value={z} className={SELECTED_SEGMENT}>
              {t(`workbench_zoom_${z}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <output
          data-slot="workbench-zoom-level"
          aria-label={t("workbench_zoom_level")}
          className="w-10 text-sm tabular-nums text-muted-foreground"
        >
          {t("workbench_percent", { percent: Math.round(scale * 100) })}
        </output>
      </div>
    </Dock>
  );
}
