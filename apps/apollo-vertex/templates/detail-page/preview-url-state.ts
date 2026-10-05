import type { ScrollOwner, SurfacePadding } from "@/lib/composition";
import type {
  ScrollableSlotName,
  SlotContents,
  SlotPaddings,
  SlotScrolls,
} from "./DetailPageExample";
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
import {
  type Arrangement,
  PANEL_SLOTS,
  type PanelSlotName,
  parseArrangement,
} from "./preview-panels";

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
 *   <slot>-content  short | long   (start-panel, main, end-panel)
 *   <slot>-scroll   surface | occupant   (who owns scrolling there)
 *   <slot>-arrangement  single | stack | tabs | overflow: how a panel
 *                   arranges its occupants (start-panel, end-panel). See
 *                   preview-panels.ts. An unknown value is single.
 *   <slot>-tab      the tab a panel shows first, by id (start-panel,
 *                   end-panel). An unknown id shows the first tab.
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
  contents: SlotContents;
  scrolls: SlotScrolls;
  /** How each panel arranges its occupants. */
  arrangements: PanelArrangements;
  /** Each panel's tab to show first, by id. Empty shows the first tab. */
  tabs: PanelTabs;
}

export type { PanelSlotName };

export type PanelTabs = Record<PanelSlotName, string>;

export type PanelArrangements = Record<PanelSlotName, Arrangement>;

const tabKey = (slot: PanelSlotName) => `${slot}-tab`;
const arrangementKey = (slot: PanelSlotName) => `${slot}-arrangement`;

/** Slots whose surface can scroll, in page order. */
const SCROLLABLE_SLOTS: readonly ScrollableSlotName[] = [
  "start-panel",
  "main",
  "end-panel",
];

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
  contents: { "start-panel": "short", main: "short", "end-panel": "short" },
  scrolls: {
    "start-panel": "surface",
    main: "surface",
    "end-panel": "surface",
  },
  arrangements: { "start-panel": "single", "end-panel": "single" },
  tabs: { "start-panel": "", "end-panel": "" },
};

const SHELLS: readonly ShellVariant[] = ["sidebar", "minimal"];
const PANELS: readonly DetailPagePanels[] = ["none", "start", "end", "both"];
const PLACEMENTS: readonly PanelPlacement[] = ["below-header", "beside-header"];
const PADDINGS: readonly SurfacePadding[] = ["padded", "flush"];
const CONTENTS: readonly ("short" | "long")[] = ["short", "long"];
const SCROLLS: readonly ScrollOwner[] = ["surface", "occupant"];
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

  const contents = { ...defaults.contents };
  const scrolls = { ...defaults.scrolls };
  for (const slot of SCROLLABLE_SLOTS) {
    contents[slot] = oneOf(
      params.get(`${slot}-content`),
      CONTENTS,
      defaults.contents[slot],
    );
    scrolls[slot] = oneOf(
      params.get(`${slot}-scroll`),
      SCROLLS,
      defaults.scrolls[slot],
    );
  }

  const tabs = { ...defaults.tabs };
  const arrangements = { ...defaults.arrangements };
  for (const slot of PANEL_SLOTS) {
    tabs[slot] = params.get(tabKey(slot)) ?? "";
    arrangements[slot] = parseArrangement(params.get(arrangementKey(slot)));
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
    contents,
    scrolls,
    arrangements,
    tabs,
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

  for (const slot of SCROLLABLE_SLOTS) {
    setIfChanged(
      `${slot}-content`,
      settings.contents[slot],
      defaults.contents[slot],
    );
    setIfChanged(
      `${slot}-scroll`,
      settings.scrolls[slot],
      defaults.scrolls[slot],
    );
  }

  for (const slot of PANEL_SLOTS) {
    setIfChanged(
      arrangementKey(slot),
      settings.arrangements[slot],
      defaults.arrangements[slot],
    );
    setIfChanged(tabKey(slot), settings.tabs[slot], defaults.tabs[slot]);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
