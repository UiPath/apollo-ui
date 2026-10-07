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
 * The page as composed, in words, for review: a plain-language Markdown
 * summary built from the composition and the template's spec alone, so
 * it reads the same for any template. Each slot in the template's order,
 * its state and placement, and what it holds, its tabs and stacks, with
 * preview-only names marked.
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

const refName = (ref: OccupantRef) =>
  typeof ref === "string" ? ref : ref.occupant;

/** An occupant's title as the page shows it: renamed, marked so, or declared. */
function titleOf(occupant: string, renames: Renames, t: Translate) {
  const renamed = renames[occupantTarget(occupant)];
  if (renamed) return t("workbench_summary_preview_name", { name: t(renamed) });
  const key = specFor(occupant)?.titleKey;
  return key ? t(key) : (specFor(occupant)?.label ?? occupant);
}

/** A slot's contents, a line each: its tabs, or its one occupant. */
export function holdings(
  slot: string,
  panel: PanelSpec,
  renames: Renames,
  t: Translate,
  holdsTabs: boolean,
): string[] {
  if (!holdsTabs) return occupantsIn(panel).map((o) => titleOf(o, renames, t));
  return panel.tabs.map((tab) => {
    const names = tab.occupants.map((ref) => titleOf(refName(ref), renames, t));
    if (tab.occupants.length < 2)
      return t("workbench_summary_tab", { name: names[0] ?? tab.id });
    const renamed = renames[stackTarget(slot, tab.id)];
    const label = renamed
      ? t("workbench_summary_preview_name", { name: t(renamed) })
      : tab.label
        ? t(tab.label)
        : tab.id;
    return t("workbench_summary_stack", {
      label,
      occupants: names.join(", "),
    });
  });
}

/** The page as composed, as Markdown, for a review. */
export function exportSummary(
  host: TemplateHost,
  page: ComposedPage,
  t: Translate,
  shellName: (shell: PreviewShellVariant) => string,
): string {
  const lines: string[] = [
    `# ${host.label}`,
    "",
    t("workbench_summary_page", {
      width: page.pageWidth,
      shell: shellName(page.shell),
    }),
  ];
  const contents: SlotContents = page.contents;
  for (const slot of host.spec.slots) {
    const name = slot.name;
    const choice = page.layout[name] ?? {};
    const options = host.spec.layout.options?.[name];
    const panel = contents[name];
    const holds = panel ? occupantsIn(panel).length > 0 : false;
    const hidden = choice.present === false;
    const state = hidden
      ? t(holds ? "workbench_summary_hidden_kept" : "workbench_summary_hidden")
      : choice.open === false
        ? t("workbench_summary_closed")
        : t("workbench_summary_open");
    // A hidden slot has no place on the page to name.
    const placement =
      options?.placements && !hidden
        ? placementCopy(
            host.spec,
            choice.placement ?? defaultPlacement(host.spec, name),
          )
        : null;
    lines.push(
      "",
      `## ${host.slotLabels[name] ?? name}`,
      "",
      placement
        ? t("workbench_summary_state_placed", {
            state,
            placement: t(placement).toLowerCase(),
          })
        : t("workbench_summary_state", { state }),
    );
    if (!panel || !holds) lines.push(t("workbench_summary_empty"));
    else
      lines.push(
        "",
        ...holdings(name, panel, page.renames, t, slot.holds === "panel").map(
          (line) => `- ${line}`,
        ),
      );
  }
  return `${lines.join("\n")}\n`;
}
