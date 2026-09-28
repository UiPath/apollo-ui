import type { SurfacePadding } from "@/lib/composition";
import {
  PADDED_SLOTS,
  type PaddedSlotName,
  type SlotPaddings,
  START_OCCUPANTS,
  type StartOccupantName,
} from "./preview-options";
import type {
  DetailPageConfig,
  DetailPagePanels,
  PanelPlacement,
  PanelSide,
  StartPanelControls,
} from "./detail-page.template";
export type ShellVariant = "sidebar" | "minimal";
export type SidebarState = "expanded" | "collapsed";
export type OccupantCount = "one" | "two";

/**
 * Preview-only. The whole preview configuration as readable query params,
 * so any combination can be shared as a link and survives a reload:
 *
 *   shell           sidebar | minimal
 *   sidebar         expanded | collapsed   (sidebar shell only)
 *   panels          none | start | end | both
 *   start-controls  in-panel | rail        (experimental)
 *   occupants       one | two              (start panel placeholders)
 *   start-occupant  queue | assistant
 *   start, end      below-header | beside-header
 *   start-state,    open | closed   (the user's choice, not the rule's result)
 *   end-state
 *   <slot>-padding  padded | flush, e.g. main-padding=flush
 *
 * Only values that differ from the defaults are written. Unknown or invalid
 * values fall back to the defaults. Whether the configuration card is open
 * is deliberately not stored, so shared links open looking like a real page.
 */
export interface PreviewSettings {
  shellVariant: ShellVariant;
  sidebar: SidebarState;
  /** `defaultOpen` carries the user's open or closed choice per panel. */
  config: DetailPageConfig;
  occupants: OccupantCount;
  startOccupant: StartOccupantName;
  paddings: SlotPaddings;
}

export const DEFAULT_PREVIEW_SETTINGS: PreviewSettings = {
  shellVariant: "sidebar",
  sidebar: "expanded",
  config: {
    panels: "both",
    start: { placement: "below-header", defaultOpen: true },
    end: { placement: "below-header", defaultOpen: true },
    startControls: "in-panel",
  },
  occupants: "two",
  startOccupant: "queue",
  paddings: {
    header: "padded",
    "start-panel": "padded",
    main: "padded",
    "end-panel": "padded",
  },
};

const SHELLS: readonly ShellVariant[] = ["sidebar", "minimal"];
const SIDEBAR_STATES: readonly SidebarState[] = ["expanded", "collapsed"];
const PANELS: readonly DetailPagePanels[] = ["none", "start", "end", "both"];
const CONTROLS: readonly StartPanelControls[] = ["in-panel", "rail"];
const OCCUPANT_COUNTS: readonly OccupantCount[] = ["one", "two"];
const OCCUPANT_NAMES: readonly StartOccupantName[] = START_OCCUPANTS.map(
  (o) => o.name,
);
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

const paddingKey = (slot: PaddedSlotName) => `${slot}-padding`;
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
  for (const slot of PADDED_SLOTS) {
    paddings[slot] = oneOf(
      params.get(paddingKey(slot)),
      PADDINGS,
      defaults.paddings[slot],
    );
  }

  return {
    shellVariant: oneOf(params.get("shell"), SHELLS, defaults.shellVariant),
    sidebar: oneOf(params.get("sidebar"), SIDEBAR_STATES, defaults.sidebar),
    config: {
      panels: oneOf(params.get("panels"), PANELS, defaults.config.panels),
      start: panel("start"),
      end: panel("end"),
      startControls: oneOf(
        params.get("start-controls"),
        CONTROLS,
        defaults.config.startControls ?? "in-panel",
      ),
    },
    occupants: oneOf(
      params.get("occupants"),
      OCCUPANT_COUNTS,
      defaults.occupants,
    ),
    startOccupant: oneOf(
      params.get("start-occupant"),
      OCCUPANT_NAMES,
      defaults.startOccupant,
    ),
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
  setIfChanged("sidebar", settings.sidebar, defaults.sidebar);
  setIfChanged("panels", settings.config.panels, defaults.config.panels);
  setIfChanged(
    "start-controls",
    settings.config.startControls ?? "in-panel",
    defaults.config.startControls ?? "in-panel",
  );
  setIfChanged("occupants", settings.occupants, defaults.occupants);
  setIfChanged(
    "start-occupant",
    settings.startOccupant,
    defaults.startOccupant,
  );
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
  for (const slot of PADDED_SLOTS) {
    setIfChanged(
      paddingKey(slot),
      settings.paddings[slot],
      defaults.paddings[slot],
    );
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
