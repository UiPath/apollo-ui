import type { ComponentType } from "react";
import {
  ContentAreaHost,
  PageHeaderHost,
  SidePanelHost,
  type SurfaceHostProps,
} from "./surface-hosts-components";

/** The parts of the page map the occupant workbench draws: a template outline. */
export const MAP_REGIONS = [
  "header",
  "start-panel",
  "main",
  "end-panel",
] as const;
export type MapRegion = (typeof MAP_REGIONS)[number];

interface SurfaceHost {
  /** Renders the surface on its own, holding one occupant. */
  Host: ComponentType<SurfaceHostProps>;
  /** The element that holds the surface's padding: where overflow is measured. */
  inner: string;
  /** Where the surface sits on the workbench's page map. */
  regions: readonly MapRegion[];
}

/**
 * How previews render each registered surface on its own, by name, in the
 * order pickers list them: the occupant fixture, the docs demos, and the
 * occupant workbench.
 *
 * To add a surface (a dashboard tile, say): register it in registry.json
 * with meta.layer "surface" and its <name>.surface.ts spec, give it a label
 * in lib/surface-labels.ts, and add its host here. The workbench picks it
 * up with no other change. A unit test fails until every registered
 * surface has all of them.
 */
export const SURFACE_HOSTS: Record<string, SurfaceHost> = {
  "page-header": {
    Host: PageHeaderHost,
    inner: "[data-slot=page-header]",
    regions: ["header"],
  },
  "side-panel": {
    Host: SidePanelHost,
    inner: "[data-slot=side-panel-body]",
    regions: ["start-panel", "end-panel"],
  },
  "content-area": {
    Host: ContentAreaHost,
    inner: "[data-slot=content-area-body]",
    regions: ["main"],
  },
};
