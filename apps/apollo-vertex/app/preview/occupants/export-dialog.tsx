"use client";

import { Copy, Download, Share } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
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
import { isLocalLink, shareLink } from "./export-link";
import { type PictureColors, pictureSvg, svgToPng } from "./export-picture";
import {
  type ComposedPage,
  holdings,
  type ReviewSummary,
  reviewSummary,
  summaryMarkdown,
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

/** The picture's size, in px, before it's drawn at twice that. */
const PICTURE = { width: 1200, height: 720 };

/** The summary as formatted text: a heading, the page, and each slot. */
function SummaryPreview({ summary }: { summary: ReviewSummary }) {
  return (
    <>
      <h4 className="text-sm font-semibold">{summary.title}</h4>
      <p className="mt-1 text-muted-foreground">{summary.page}</p>
      <ul className="mt-2 flex flex-col gap-1">
        {summary.entries.map((entry) => (
          <li key={entry.slot} data-entry={entry.slot}>
            <strong className="font-medium">{entry.name}</strong>
            {entry.rest}
          </li>
        ))}
      </ul>
    </>
  );
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
  // The picture, drawn as the dialog opens, for its thumbnail.
  const [picture, setPicture] = useState("");
  const copyLink = useRef<HTMLButtonElement>(null);
  const words: Translate = (key, values) => t(key, values);
  const shellName = (shell: PreviewShellVariant) =>
    t(`workbench_shell_${shell}`);
  const slotsInUse = Object.values(page.contents).filter(
    (panel) => occupantsIn(panel).length > 0,
  ).length;
  const occupants = onPage(page.contents).size;
  const summary = reviewSummary(host, page, words, shellName);
  const link = open ? shareLink(window.location) : "";
  const renamed = Object.keys(page.renames).length > 0;

  const copy = async (text: string, done: string) => {
    await navigator.clipboard.writeText(text);
    said(done);
  };
  const draw = () =>
    pictureSvg({
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
      ...PICTURE,
    });
  const download = async () => {
    const png = await svgToPng(draw(), PICTURE.width, PICTURE.height);
    const url = URL.createObjectURL(png);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${host.spec.name}.png`;
    anchor.click();
    URL.revokeObjectURL(url);
    said(t("workbench_export_picture_downloaded"));
  };
  const openChange = (next: boolean) => {
    if (next) setPicture(draw());
    setOpen(next);
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
              />
              <Button
                ref={copyLink}
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
            {isLocalLink(link) && (
              <p
                data-slot="workbench-export-local-note"
                className="text-xs text-muted-foreground"
              >
                {t("workbench_export_local_note")}
              </p>
            )}
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
                  void copy(
                    summaryMarkdown(summary),
                    t("workbench_export_summary_copied"),
                  )
                }
              >
                <Copy aria-hidden />
                {t("workbench_export_copy_summary")}
              </Button>
            </div>
            {/* Readable by screen readers: a focusable region of formatted text. */}
            <div
              data-slot="workbench-export-summary"
              role="region"
              aria-label={t("workbench_export_summary_preview")}
              tabIndex={0}
              className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <SummaryPreview summary={summary} />
            </div>
          </section>
          <section
            aria-labelledby="export-picture"
            className="flex items-center justify-between gap-2"
          >
            <h3 id="export-picture" className="text-sm font-medium">
              {t("workbench_export_picture")}
            </h3>
            <div className="flex items-center gap-3">
              {picture && (
                // Drawn the same way as the download, from the same SVG.
                <img
                  data-slot="workbench-export-thumbnail"
                  src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(picture)}`}
                  alt={t("workbench_export_picture_preview")}
                  width={80}
                  height={48}
                  className="h-12 w-20 rounded-sm border border-border"
                />
              )}
              <Button
                variant="outline"
                size="sm"
                aria-label={t("workbench_export_download_name")}
                onClick={() => void download()}
              >
                <Download aria-hidden />
                {t("workbench_export_download")}
              </Button>
            </div>
          </section>
        </div>
      ),
    },
  ];
  const [shown, setShown] = useState(sections[0]?.id ?? "");
  const section = sections.find((s) => s.id === shown) ?? sections[0];

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-slot="workbench-export">
          <Share aria-hidden />
          {t("workbench_export")}
        </Button>
      </DialogTrigger>
      <DialogContent
        data-slot="workbench-export-dialog"
        className="sm:max-w-xl"
        // Into the dialog at Copy link, not the read-only field.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          copyLink.current?.focus();
        }}
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
