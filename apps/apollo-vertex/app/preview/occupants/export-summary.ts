import type { TemplateHost } from "@/app/_components/template-hosts";
import type { LocaleKey } from "@/lib/composition";
import { defaultPlacement } from "@/lib/layout";
import { specFor } from "@/lib/occupant-lookup";
import type { OccupantRef, PanelSpec } from "@/lib/panel";
import type { PreviewShellVariant } from "@/templates/shell/PreviewShell";
import { occupantsIn, type SlotContents } from "./workbench-compose";
import { placementCopy } from "./workbench-layout";
import { occupantTarget, type Renames, stackTarget } from "./workbench-renames";
import type { WorkbenchView } from "./workbench-url-state";

/*
 * The page as composed, in words, for review: a plain-language summary
 * built from the composition and the template's spec alone, so it reads
 * the same for any template. One entry per slot in the template's order:
 * its name, its state and placement where the slot declares them, and
 * what it holds, with preview-only names marked. The dialog shows it as
 * formatted text; it copies as Markdown.
 */

/** A translator: a locale key and its values, in words. */
export type Translate = (
  key: LocaleKey,
  values?: Readonly<Record<string, string | number>>,
) => string;

/** What the summary reads from the view. */
export type ComposedPage = Pick<
  WorkbenchView,
  "contents" | "layout" | "renames" | "shell" | "pageWidth"
>;

/** A slot's entry: "End panel", then " · closed, below header: Queue". */
export interface SummaryEntry {
  slot: string;
  /** The slot's name. */
  name: string;
  /** What follows the name: its state and placement, if any, and contents. */
  rest: string;
}

/** The page in words: its title, a line about the page, and each slot. */
export interface ReviewSummary {
  title: string;
  page: string;
  entries: readonly SummaryEntry[];
}

const refName = (ref: OccupantRef) =>
  typeof ref === "string" ? ref : ref.occupant;

/** An occupant's title as the page shows it: renamed, marked so, or declared. */
function titleOf(occupant: string, renames: Renames, t: Translate) {
  const renamed = renames[occupantTarget(occupant)];
  if (renamed) return t("workbench_summary_preview_name", { name: t(renamed) });
  const key = specFor(occupant)?.titleKey;
  return key ? t(key) : (specFor(occupant)?.label ?? occupant);
}

/**
 * What a slot holds, one item each: a tab's occupant ("Queue"), a stack
 * ("Overview: Queue, Key facts"), or a single-occupant slot's occupant.
 */
function holdings(
  slot: string,
  panel: PanelSpec,
  renames: Renames,
  t: Translate,
  holdsTabs: boolean,
): string[] {
  if (!holdsTabs) return occupantsIn(panel).map((o) => titleOf(o, renames, t));
  return panel.tabs.map((tab) => {
    const names = tab.occupants.map((ref) => titleOf(refName(ref), renames, t));
    if (tab.occupants.length < 2) return names[0] ?? tab.id;
    const renamed = renames[stackTarget(slot, tab.id)];
    const label = renamed
      ? t("workbench_summary_preview_name", { name: t(renamed) })
      : tab.label
        ? t(tab.label)
        : tab.id;
    return t("workbench_summary_stack", { label, occupants: names.join(", ") });
  });
}

/**
 * A slot's contents on one line. Tabs are joined by commas, or by
 * semicolons once one is a stack, whose occupants take the commas; more
 * than one tab says how many.
 */
function contentsLine(
  slot: string,
  panel: PanelSpec | undefined,
  renames: Renames,
  t: Translate,
  holdsTabs: boolean,
): string {
  if (!panel || occupantsIn(panel).length === 0)
    return t("workbench_summary_empty");
  const items = holdings(slot, panel, renames, t, holdsTabs);
  const stacked =
    holdsTabs && panel.tabs.some((tab) => tab.occupants.length > 1);
  const line = items.join(stacked ? "; " : ", ");
  return holdsTabs && panel.tabs.length > 1
    ? t("workbench_summary_tabs", { contents: line, tabs: panel.tabs.length })
    : line;
}

/** A slot's state, where it declares one: hidden, or open or closed. */
function stateOf(
  host: TemplateHost,
  slot: string,
  page: ComposedPage,
  t: Translate,
): string | null {
  const own = host.spec.layout.options?.[slot];
  const choice = page.layout[slot] ?? {};
  if (own?.optional && choice.present === false)
    return t("workbench_summary_hidden");
  if (own?.closable)
    return t(
      choice.open === false
        ? "workbench_summary_closed"
        : "workbench_summary_open",
    );
  return null;
}

/** The page as composed, in words, for a review. */
export function reviewSummary(
  host: TemplateHost,
  page: ComposedPage,
  t: Translate,
  shellName: (shell: PreviewShellVariant) => string,
): ReviewSummary {
  const contents: SlotContents = page.contents;
  const entries = host.spec.slots.map(({ name: slot, holds }) => {
    const choice = page.layout[slot] ?? {};
    const state = stateOf(host, slot, page, t);
    // A hidden slot has no place on the page to name.
    const placementKey =
      host.spec.layout.options?.[slot]?.placements && choice.present !== false
        ? placementCopy(
            host.spec,
            choice.placement ?? defaultPlacement(host.spec, slot),
          )
        : null;
    const placement = placementKey ? t(placementKey).toLowerCase() : null;
    const details =
      state && placement
        ? t("workbench_summary_details", { state, placement })
        : (state ?? placement);
    const line = contentsLine(
      slot,
      contents[slot],
      page.renames,
      t,
      holds === "panel",
    );
    return {
      slot,
      name: host.slotLabels[slot] ?? slot,
      rest: details
        ? t("workbench_summary_holds_details", { details, contents: line })
        : t("workbench_summary_holds", { contents: line }),
    };
  });
  return {
    title: host.label,
    page: t("workbench_summary_page", {
      width: page.pageWidth,
      shell: shellName(page.shell),
    }),
    entries,
  };
}

/** The summary as Markdown: a heading, the page line, and a list of slots. */
export const summaryMarkdown = (summary: ReviewSummary) =>
  [
    `# ${summary.title}`,
    "",
    summary.page,
    "",
    ...summary.entries.map((entry) => `- **${entry.name}**${entry.rest}`),
    "",
  ].join("\n");
