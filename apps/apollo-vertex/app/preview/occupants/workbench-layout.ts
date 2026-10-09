import type { LocaleKey, TemplateSpec } from "@/lib/composition";
import {
  type LayoutChoices,
  type SlotOption,
  slotControls,
} from "@/lib/layout";

/*
 * The template view's layout rules, for any template: what a slot's
 * inspector offers for its layout comes from the slot choices the
 * template declares, and what's locked comes from the template's own
 * layout. Nothing here names a template or a slot.
 */

/** Why a layout option can't be chosen: the template's layout won't allow it. */
export type LayoutLock = "refused";

/** A layout option, and why it's locked, or null when it can be chosen. */
export interface MenuOption<T> {
  value: T;
  lock: LayoutLock | null;
}

/** One slot's layout choices: only what the slot declares. */
export interface MenuSlot {
  slot: string;
  present?: readonly MenuOption<boolean>[];
  open?: readonly MenuOption<boolean>[];
  placement?: readonly MenuOption<string>[];
}

/** An option, locked when the template's layout refuses it. */
const lockOn = <T>(option: SlotOption<T>): MenuOption<T> => ({
  value: option.value,
  lock: option.refused ? "refused" : null,
});

/** The layout choices for a template: each slot's, locked where its layout refuses them. */
export function layoutMenu(
  spec: TemplateSpec,
  choices: LayoutChoices,
): MenuSlot[] {
  return slotControls(spec, choices).map((controls) => ({
    slot: controls.slot,
    ...(controls.present && { present: controls.present.map(lockOn) }),
    ...(controls.open && { open: controls.open.map(lockOn) }),
    ...(controls.placement && { placement: controls.placement.map(lockOn) }),
  }));
}

/** Whether a slot declares any layout choice at all. */
export const hasLayout = (spec: TemplateSpec, slot: string) =>
  Boolean(spec.layout.options?.[slot]);

/** Whether the page has left the slot out. */
export const leftOut = (layout: LayoutChoices, slot: string) =>
  layout[slot]?.present === false;

/**
 * What the workbench says for a reason code when a template declares no
 * copy of its own: neutral, naming no template. "rule": the template's
 * rules closed a slot; "refused": its layout won't allow a choice.
 */
const NEUTRAL_REASONS: Readonly<Record<string, LocaleKey>> = {
  rule: "workbench_layout_closed_by_layout_rule",
  refused: "workbench_layout_refused",
  // The composer's (see ComposeLock).
  "fill-alone": "workbench_compose_reason_fill_alone",
  "tab-cap": "workbench_compose_reason_tab_cap",
  "no-fit": "workbench_compose_reason_no_fit",
  "on-page": "workbench_compose_reason_on_page",
};

/** The copy for why a template closed or refused something: its own, else neutral. */
export function reasonCopy(spec: TemplateSpec, code: string): LocaleKey {
  return (
    spec.layout.copy?.reasons?.[code] ??
    NEUTRAL_REASONS[code] ??
    "workbench_layout_closed_by_layout_rule"
  );
}

/** A placement's name in the template's own words, or null when it gives none. */
export const placementCopy = (
  spec: TemplateSpec,
  placement: string,
): LocaleKey | null => spec.layout.copy?.placements?.[placement] ?? null;
