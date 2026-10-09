import type { TemplateHost } from "@/app/_components/template-hosts";
import {
  defaultPlacement,
  type LayoutChoices,
  type SlotChoice,
} from "@/lib/layout";

/*
 * A template's layout choices in a link: per slot it declares choices
 * for, its <slot>-present, <slot>-state and <slot>-placement params.
 */

/**
 * A template's layout choices from link params: per slot it declares
 * choices for, whether it's left out, closed, and where it's placed. The
 * template's older params count where the link gives no per-slot ones.
 */
export function parseLayout(
  host: TemplateHost | undefined,
  params: URLSearchParams,
): LayoutChoices {
  if (!host) return {};
  const legacy = host.legacyParams?.(params) ?? {};
  const get = (key: string) => params.get(key) ?? legacy[key] ?? null;
  const options = host.spec.layout.options ?? {};
  return Object.fromEntries(
    Object.entries(options).flatMap(([slot, own]) => {
      const choice: SlotChoice = {
        ...(own.optional &&
          get(`${slot}-present`) === "false" && { present: false }),
        ...(own.closable &&
          get(`${slot}-state`) === "closed" && { open: false }),
      };
      const placement = get(`${slot}-placement`);
      const placed =
        placement &&
        placement !== defaultPlacement(host.spec, slot) &&
        own.placements?.[placement]
          ? { placement }
          : {};
      const all = { ...choice, ...placed };
      return Object.keys(all).length > 0 ? [[slot, all]] : [];
    }),
  );
}

/** The params for a template's layout choices: only what isn't the default. */
export function writeLayout(
  host: TemplateHost | undefined,
  layout: LayoutChoices,
  params: URLSearchParams,
) {
  if (!host) return;
  for (const [slot, own] of Object.entries(host.spec.layout.options ?? {})) {
    const choice = layout[slot] ?? {};
    if (own.optional && choice.present === false)
      params.set(`${slot}-present`, "false");
    if (own.closable && choice.open === false)
      params.set(`${slot}-state`, "closed");
    if (
      choice.placement &&
      choice.placement !== defaultPlacement(host.spec, slot) &&
      own.placements?.[choice.placement]
    )
      params.set(`${slot}-placement`, choice.placement);
  }
}
