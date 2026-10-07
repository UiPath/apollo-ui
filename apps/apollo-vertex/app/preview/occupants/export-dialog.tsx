"use client";

import { Copy, Download, Share } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { TemplateHost } from "@/app/_components/template-hosts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { PreviewShellVariant } from "@/templates/shell/PreviewShell";
import { type PictureColors, pictureSvg, svgToPng } from "./export-picture";
import {
  type ComposedPage,
  exportSummary,
  holdings,
  type Translate,
} from "./export-summary";
import { WORKBENCH_TOASTER } from "./use-change-log";
import { occupantsIn } from "./workbench-compose";
import { onPage } from "./workbench-picker";
import { SHELL_WIDTH } from "./workbench-url-state";

/** A section of the Export dialog. Navigation shows once there are two. */
interface ExportSection {
  id: string;
  label: string;
  content: ReactNode;
}

/** The theme's colors where the workbench is, for the picture. */
function themeColors(): PictureColors {
  const root = document.querySelector("[data-slot=workbench]") ?? document.body;
  const resolve = (name: string) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${name})`;
    root.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  };
  return {
    background: resolve("--background"),
    foreground: resolve("--foreground"),
    muted: resolve("--muted"),
    border: resolve("--border"),
    mutedForeground: resolve("--muted-foreground"),
  };
}

const said = (message: string) =>
  toast(message, { toasterId: WORKBENCH_TOASTER });

interface ExportDialogProps {
  host: TemplateHost;
  page: ComposedPage;
}

/**
 * Export, from the template view's header: a dialog of sections. For now
 * one, Share for review: the page's link, a Markdown summary of it, and
 * a picture of it. With one section there's no navigation.
 */
export function ExportDialog({ host, page }: ExportDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const words: Translate = (key, values) => t(key, values);
  const shellName = (shell: PreviewShellVariant) =>
    t(`workbench_shell_${shell}`);
  const slotsInUse = Object.values(page.contents).filter(
    (panel) => occupantsIn(panel).length > 0,
  ).length;
  const occupants = onPage(page.contents).size;
  const summary = open ? exportSummary(host, page, words, shellName) : "";
  const link = open ? window.location.href : "";
  const renamed = Object.keys(page.renames).length > 0;

  const copy = async (text: string, done: string) => {
    await navigator.clipboard.writeText(text);
    said(done);
  };
  const download = async () => {
    const width = 1200;
    const height = 720;
    const svg = pictureSvg({
      host,
      layout: page.layout,
      pageWidth: page.pageWidth,
      shellWidth: SHELL_WIDTH[page.shell],
      shellName: shellName(page.shell),
      words: (slot) => {
        const panel = page.contents[slot];
        const name = host.slotLabels[slot] ?? slot;
        const holdsTabs =
          host.spec.slots.find((s) => s.name === slot)?.holds === "panel";
        return [
          name,
          ...(panel
            ? holdings(slot, panel, page.renames, words, holdsTabs)
            : []),
        ];
      },
      colors: themeColors(),
      width,
      height,
    });
    const png = await svgToPng(svg, width, height);
    const url = URL.createObjectURL(png);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${host.spec.name}.png`;
    anchor.click();
    URL.revokeObjectURL(url);
    said(t("workbench_export_picture_downloaded"));
  };

  const sections: ExportSection[] = [
    {
      id: "share",
      label: t("workbench_export_share"),
      content: (
        <div className="flex flex-col gap-5">
          <section
            aria-labelledby="export-link"
            className="flex flex-col gap-2"
          >
            <h3 id="export-link" className="text-sm font-medium">
              {t("workbench_export_link")}
            </h3>
            <div className="flex gap-2">
              <Input
                readOnly
                value={link}
                aria-label={t("workbench_export_link")}
                data-slot="workbench-export-link"
                className="font-mono text-xs"
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button
                variant="outline"
                aria-label={t("workbench_export_copy_link_name")}
                onClick={() =>
                  void copy(link, t("workbench_export_link_copied"))
                }
              >
                <Copy aria-hidden />
                {t("workbench_export_copy_link")}
              </Button>
            </div>
            {renamed && (
              <p
                data-slot="workbench-export-renames-note"
                className="text-xs text-muted-foreground"
              >
                {t("workbench_export_renames_note")}
              </p>
            )}
          </section>
          <section
            aria-labelledby="export-summary"
            className="flex flex-col gap-2"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 id="export-summary" className="text-sm font-medium">
                {t("workbench_export_summary")}
              </h3>
              <Button
                variant="outline"
                size="sm"
                aria-label={t("workbench_export_copy_summary_name")}
                onClick={() =>
                  void copy(summary, t("workbench_export_summary_copied"))
                }
              >
                <Copy aria-hidden />
                {t("workbench_export_copy_summary")}
              </Button>
            </div>
            {/* Readable by screen readers: a focusable region of plain text. */}
            <pre
              data-slot="workbench-export-summary"
              role="region"
              aria-label={t("workbench_export_summary_preview")}
              tabIndex={0}
              className="max-h-64 overflow-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {summary}
            </pre>
          </section>
          <section
            aria-labelledby="export-picture"
            className="flex items-center justify-between gap-2"
          >
            <h3 id="export-picture" className="text-sm font-medium">
              {t("workbench_export_picture")}
            </h3>
            <Button
              variant="outline"
              size="sm"
              aria-label={t("workbench_export_download_name")}
              onClick={() => void download()}
            >
              <Download aria-hidden />
              {t("workbench_export_download")}
            </Button>
          </section>
        </div>
      ),
    },
  ];
  const [shown, setShown] = useState(sections[0]?.id ?? "");
  const section = sections.find((s) => s.id === shown) ?? sections[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-slot="workbench-export">
          <Share aria-hidden />
          {t("workbench_export")}
        </Button>
      </DialogTrigger>
      <DialogContent
        data-slot="workbench-export-dialog"
        className="sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle>
            {t("workbench_export_title", { template: host.label })}
          </DialogTitle>
          <DialogDescription data-slot="workbench-export-counts">
            {t("workbench_export_slots", { count: slotsInUse })} ·{" "}
            {t("workbench_export_occupants", { count: occupants })}
          </DialogDescription>
        </DialogHeader>
        {/* Navigation once there's more than one section. */}
        {sections.length > 1 && (
          <nav
            aria-label={t("workbench_export_sections")}
            className="flex gap-1"
          >
            {sections.map((s) => (
              <Button
                key={s.id}
                variant="ghost"
                size="sm"
                {...(s.id === shown && { "aria-current": "page" as const })}
                onClick={() => setShown(s.id)}
              >
                {s.label}
              </Button>
            ))}
          </nav>
        )}
        {section && (
          <div data-slot="workbench-export-section" data-section={section.id}>
            <h2 className="mb-3 text-sm font-semibold">{section.label}</h2>
            {section.content}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
