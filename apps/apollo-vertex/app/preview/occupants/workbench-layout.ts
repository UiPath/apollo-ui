import type { TemplateSpec } from "@/lib/composition";
import {
  type LayoutChoices,
  type SlotOption,
  slotControls,
} from "@/lib/layout";

/*
 * The template view's layout rules, for any template: what its Layout menu
 * offers comes from the slot choices the template declares, and what's
 * locked comes from the template's own layout or the focus rule. Nothing
 * here names a template or a slot.
 */

/**
 * Why a Layout menu option can't be chosen. "refused": the template's
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

/** A Layout menu option, and why it's locked, or null when it can be chosen. */
export interface MenuOption<T> {
  value: T;
  lock: LayoutLock | null;
}

/** One slot's section of the Layout menu: only what the slot declares. */
export interface MenuSlot {
  slot: string;
  present?: readonly MenuOption<boolean>[];
  open?: readonly MenuOption<boolean>[];
  placement?: readonly MenuOption<string>[];
}

/**
 * The Layout menu for a template: each slot's declared choices, locked by
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
