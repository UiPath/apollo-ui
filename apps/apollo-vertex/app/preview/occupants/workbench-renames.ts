import i18n, { exists } from "i18next";
import type { LocaleKey } from "@/lib/composition";
import type { PanelSpec } from "@/lib/panel";

/*
 * Preview-only renames, for this session: an occupant's title or a
 * stack's label, typed in the inspector. Each new name is registered as a
 * translation under a workbench-only key, and the page's panel points at
 * that key, so the frame takes no string title. Renames aren't written to
 * the link, Reset layout clears them, and a reload shows the declared
 * titles again.
 */

/** What's renamed, by target, as the key its text is registered under. */
export type Renames = Readonly<Record<string, LocaleKey>>;

/** An occupant's title: it's on the page once, so its name is its target. */
export const occupantTarget = (occupant: string) => `occupant:${occupant}`;
/** A stack's label, by its slot and its tab's id. */
export const stackTarget = (slot: string, tab: string) =>
  `stack:${slot}:${tab}`;

/** Registered keys are real ones: they translate, as any declared key does. */
const isLocaleKey = (key: string): key is LocaleKey => exists(key);

let registered = 0;

/**
 * Registers a name under a new workbench-only key, in the languages in
 * use, and returns the key. A key is never reused, so an Undo that brings
 * back an earlier rename brings back its text too.
 */
function register(text: string): LocaleKey | null {
  registered += 1;
  const key = `workbench_renamed_${registered}`;
  for (const language of new Set([i18n.language, ...(i18n.languages ?? [])]))
    i18n.addResource(language, "translation", key, text);
  return isLocaleKey(key) ? key : null;
}

/** The renames with a target renamed; an empty name restores the default. */
export function rename(
  renames: Renames,
  target: string,
  text: string,
): Renames {
  const name = text.trim();
  const { [target]: _, ...rest } = renames;
  if (!name) return rest;
  const key = register(name);
  return key ? { ...rest, [target]: key } : rest;
}

/** The renames without a target's: its default name again. */
export const restore = (renames: Renames, target: string): Renames => {
  const { [target]: _, ...rest } = renames;
  return rest;
};

/** A slot's panel as the page shows it, its renamed titles and labels pointing at their keys. */
export function withRenames(
  slot: string,
  panel: PanelSpec,
  renames: Renames,
): PanelSpec {
  return {
    ...panel,
    tabs: panel.tabs.map((tab) => {
      const label = renames[stackTarget(slot, tab.id)];
      return {
        ...tab,
        ...(label && tab.occupants.length > 1 && { label }),
        occupants: tab.occupants.map((ref) => {
          const occupant = typeof ref === "string" ? ref : ref.occupant;
          const title = renames[occupantTarget(occupant)];
          return title ? { occupant, title } : ref;
        }),
      };
    }),
  };
}
