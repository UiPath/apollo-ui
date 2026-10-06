import type { LocaleKey, TemplateSpec } from "@/lib/composition";
import {
  type LayoutChoices,
  type SlotOption,
  slotControls,
} from "@/lib/layout";

/*
 * The template view's layout rules, for any template: what each slot's
 * popover offers for its layout comes from the slot choices the template
 * declares, and what's locked comes from the template's own layout or the
 * focus rule. Nothing here names a template or a slot.
 */

/**
 * Why a layout option can't be chosen. "refused": the template's
 * layout won't allow it. "focus": the slot holds the occupant.
 */
export type LayoutLock = "refused" | "focus";

/**
 * The focus rule: the slot holding the occupant stays there and stays
 * open. It only fixes what the slot's options let a page change: present,
 * for an optional slot, and open, for a closable one.
 */
export function withFocus(
  spec: TemplateSpec,
  choices: LayoutChoices,
  slot: string,
): LayoutChoices {
  const own = spec.layout.options?.[slot];
  if (!own?.optional && !own?.closable) return choices;
  return {
    ...choices,
    [slot]: {
      ...choices[slot],
      ...(own.optional && { present: true }),
      ...(own.closable && { open: true }),
    },
  };
}

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

/**
 * The layout choices for a template: each slot's declared choices, locked by
 * the focus rule (the focused slot can't be left out or closed) or by the
 * template's layout refusing them.
 */
export function layoutMenu(
  spec: TemplateSpec,
  choices: LayoutChoices,
  focus: string,
): MenuSlot[] {
  return slotControls(spec, choices).map((controls) => {
    const focused = controls.slot === focus;
    const lockOn =
      (focusLocks: boolean) =>
      (option: SlotOption<boolean>): MenuOption<boolean> => ({
        value: option.value,
        lock:
          focusLocks && focused && !option.value
            ? "focus"
            : option.refused
              ? "refused"
              : null,
      });
    return {
      slot: controls.slot,
      ...(controls.present && { present: controls.present.map(lockOn(true)) }),
      ...(controls.open && { open: controls.open.map(lockOn(true)) }),
      ...(controls.placement && {
        placement: controls.placement.map(
          (option): MenuOption<string> => ({
            value: option.value,
            lock: option.refused ? "refused" : null,
          }),
        ),
      }),
    };
  });
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
  focus: "workbench_compose_reason_focus",
  "fill-alone": "workbench_compose_reason_fill_alone",
  "tab-cap": "workbench_compose_reason_tab_cap",
  "no-fit": "workbench_compose_reason_no_fit",
  full: "workbench_compose_reason_full",
  present: "workbench_compose_reason_present",
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
