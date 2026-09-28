import type { SurfacePadding } from "@/lib/composition";
import type { SlotPaddings } from "./DetailPageExample";
import type {
  DetailPageConfig,
  DetailPagePanels,
  DetailPageSlotName,
  PanelPlacement,
  PanelSide,
  PanelWidth,
} from "./detail-page.template";
import {
  detailPageTemplate,
  END_PANEL_DEFAULT_PX,
  END_PANEL_MIN_PX,
} from "./detail-page.template";

export type ShellVariant = "sidebar" | "minimal";

/**
 * Preview-only. The whole preview configuration as readable query params,
 * so any combination can be shared as a link and survives a reload:
 *
 *   shell         sidebar | minimal
 *   panels        none | start | end | both
 *   start, end    below-header | beside-header
 *   start-state,  open | closed   (the user's choice, not the rule's result)
 *   end-state
 *   end-width     the end panel width the user chose: px (min 280) or max
 *   <slot>-padding  padded | flush, e.g. main-padding=flush
 *
 * Only values that differ from the defaults are written. Unknown or invalid
 * values fall back to the defaults. Whether the configuration card is open
 * is deliberately not stored, so shared links open looking like a real page.
 */
export interface PreviewSettings {
  shellVariant: ShellVariant;
  /**
   * `defaultOpen` carries the user's open or closed choice per panel, and
   * `end.defaultWidth` the end panel width they chose.
   */
  config: DetailPageConfig;
  paddings: SlotPaddings;
}

export const DEFAULT_PREVIEW_SETTINGS: PreviewSettings = {
  shellVariant: "sidebar",
  config: {
    panels: "both",
    start: { placement: "below-header", defaultOpen: true },
    end: {
      placement: "below-header",
      defaultOpen: true,
      defaultWidth: END_PANEL_DEFAULT_PX,
    },
  },
  paddings: {
    header: "padded",
    "start-panel": "padded",
    main: "padded",
    "end-panel": "padded",
  },
};

const SHELLS: readonly ShellVariant[] = ["sidebar", "minimal"];
const PANELS: readonly DetailPagePanels[] = ["none", "start", "end", "both"];
const PLACEMENTS: readonly PanelPlacement[] = ["below-header", "beside-header"];
const PADDINGS: readonly SurfacePadding[] = ["padded", "flush"];
const SIDES: readonly PanelSide[] = ["start", "end"];

function oneOf<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.find((option) => option === value) ?? fallback;
}

const paddingKey = (slot: DetailPageSlotName) => `${slot}-padding`;

/** "max", a whole number of px at or above the minimum, or the default. */
function parseWidth(value: string | null): PanelWidth {
  if (value === "max") return "max";
  const width = Number(value);
  return Number.isInteger(width) && width >= END_PANEL_MIN_PX
    ? width
    : END_PANEL_DEFAULT_PX;
}
const stateKey = (side: PanelSide) => `${side}-state`;

export function parsePreviewSettings(search: string): PreviewSettings {
  const params = new URLSearchParams(search);
  const defaults = DEFAULT_PREVIEW_SETTINGS;

  const panel = (side: PanelSide) => ({
    placement: oneOf(
      params.get(side),
      PLACEMENTS,
      defaults.config[side].placement,
    ),
    defaultOpen:
      oneOf(
        params.get(stateKey(side)),
        ["open", "closed"],
        defaults.config[side].defaultOpen ? "open" : "closed",
      ) === "open",
  });

  const paddings = { ...defaults.paddings };
  for (const { name } of detailPageTemplate.slots) {
    paddings[name] = oneOf(
      params.get(paddingKey(name)),
      PADDINGS,
      defaults.paddings[name],
    );
  }

  return {
    shellVariant: oneOf(params.get("shell"), SHELLS, defaults.shellVariant),
    config: {
      panels: oneOf(params.get("panels"), PANELS, defaults.config.panels),
      start: panel("start"),
      end: {
        ...panel("end"),
        defaultWidth: parseWidth(params.get("end-width")),
      },
    },
    paddings,
  };
}

export function serializePreviewSettings(settings: PreviewSettings): string {
  const defaults = DEFAULT_PREVIEW_SETTINGS;
  const params = new URLSearchParams();
  const setIfChanged = (key: string, value: string, fallback: string) => {
    if (value !== fallback) params.set(key, value);
  };

  setIfChanged("shell", settings.shellVariant, defaults.shellVariant);
  setIfChanged("panels", settings.config.panels, defaults.config.panels);
  for (const side of SIDES) {
    const panel = settings.config[side];
    const fallback = defaults.config[side];
    setIfChanged(side, panel.placement, fallback.placement);
    setIfChanged(
      stateKey(side),
      panel.defaultOpen ? "open" : "closed",
      fallback.defaultOpen ? "open" : "closed",
    );
  }
  setIfChanged(
    "end-width",
    String(settings.config.end.defaultWidth ?? END_PANEL_DEFAULT_PX),
    String(END_PANEL_DEFAULT_PX),
  );
  for (const { name } of detailPageTemplate.slots) {
    setIfChanged(
      paddingKey(name),
      settings.paddings[name],
      defaults.paddings[name],
    );
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
