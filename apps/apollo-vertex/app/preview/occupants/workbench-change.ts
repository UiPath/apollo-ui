import type { TemplateHost } from "@/app/_components/template-hosts";
import type { LocaleKey } from "@/lib/composition";
import { defaultPlacement } from "@/lib/layout";
import { specFor } from "@/lib/occupant-lookup";
import type { PanelSpec } from "@/lib/panel";
import { occupantsIn } from "./workbench-compose";
import { placementCopy } from "./workbench-layout";
import type { WorkbenchView } from "./workbench-url-state";

/*
 * What a change to the template view did, in words, for its toast: the
 * composition (an occupant added, removed, replaced; a tab renamed), or
 * a slot's layout, with how many occupants a hidden slot keeps. And what
 * Reset layout goes back to.
 */

/** A change in words: its copy, and what fills it in. */
export interface ChangeCopy {
  key: LocaleKey;
  values: Readonly<Record<string, string | number>>;
}

/** The fields a change can touch, so Undo puts back exactly those. */
export type Composition = Pick<WorkbenchView, "contents" | "layout" | "tabs">;

export const compositionOf = (view: WorkbenchView): Composition => ({
  contents: view.contents,
  layout: view.layout,
  tabs: view.tabs,
});

const name = (occupant: string) => specFor(occupant)?.label ?? occupant;
const labelsOf = (panel: PanelSpec | undefined) =>
  (panel?.tabs ?? []).flatMap((tab) =>
    tab.label ? [`${tab.id}:${tab.label}`] : [],
  );

/** What changed in one slot's contents, in words, or null when nothing did. */
function contentsCopy(
  slot: string,
  before: PanelSpec | undefined,
  after: PanelSpec | undefined,
  t: (key: LocaleKey) => string,
): ChangeCopy | null {
  const was = before ? occupantsIn(before) : [];
  const now = after ? occupantsIn(after) : [];
  const first = now.find((o) => !was.includes(o));
  const gone = was.find((o) => !now.includes(o));
  if (first && gone)
    return {
      key: "workbench_change_replaced",
      values: { occupant: name(first), old: name(gone), slot },
    };
  if (first)
    return {
      key: "workbench_change_added",
      values: { occupant: name(first), slot },
    };
  if (gone)
    return {
      key: "workbench_change_removed",
      values: { occupant: name(gone), slot },
    };
  const renamed = after?.tabs.find(
    (tab) => tab.label && !labelsOf(before).includes(`${tab.id}:${tab.label}`),
  );
  if (renamed?.label)
    return {
      key: "workbench_change_relabeled",
      values: { label: t(renamed.label), slot },
    };
  return null;
}

/**
 * What a change did, in words: the first of what changed in a slot's
 * contents, else a slot's layout.
 * Null when it changed none of these.
 */
export function describeChange(
  host: TemplateHost,
  before: WorkbenchView,
  after: WorkbenchView,
  t: (key: LocaleKey) => string,
): ChangeCopy | null {
  const slotName = (slot: string) => host.slotLabels[slot] ?? slot;
  for (const { name: slot } of host.spec.slots) {
    const copy = contentsCopy(
      slotName(slot),
      before.contents[slot],
      after.contents[slot],
      t,
    );
    if (copy) return copy;
  }
  for (const { name: slot } of host.spec.slots) {
    const was = before.layout[slot] ?? {};
    const now = after.layout[slot] ?? {};
    const values = { slot: slotName(slot) };
    // Hiding a slot keeps what it holds, and says so.
    const panel = after.contents[slot];
    const count = panel ? occupantsIn(panel).length : 0;
    if ((was.present !== false) !== (now.present !== false)) {
      if (now.present !== false)
        return { key: "workbench_change_included", values };
      return count > 0
        ? {
            key: "workbench_change_left_out_kept",
            values: { ...values, count },
          }
        : { key: "workbench_change_left_out", values };
    }
    if ((was.open !== false) !== (now.open !== false)) {
      if (now.open !== false) return { key: "workbench_change_opened", values };
      return count > 0
        ? { key: "workbench_change_closed_kept", values: { ...values, count } }
        : { key: "workbench_change_closed", values };
    }
    const placed = (choice: { placement?: string }) =>
      choice.placement ?? defaultPlacement(host.spec, slot);
    if (placed(was) !== placed(now)) {
      const placement = placed(now) ?? "";
      const copy = placementCopy(host.spec, placement);
      return {
        key: "workbench_change_placed",
        values: {
          ...values,
          placement: (copy ? t(copy) : placement).toLowerCase(),
        },
      };
    }
  }
  return null;
}

/**
 * The template's defaults: every slot empty, every layout choice as the
 * template declares it.
 */
export const resetComposition = (): Composition => ({
  contents: {},
  layout: {},
  tabs: {},
});
