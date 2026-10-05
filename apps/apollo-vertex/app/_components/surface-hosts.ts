import type { ComponentType } from "react";
import {
  ContentAreaHost,
  PageHeaderHost,
  SidePanelHost,
  type SurfaceHostProps,
} from "./surface-hosts-components";

interface SurfaceHost {
  /** Renders the surface on its own, holding one occupant. */
  Host: ComponentType<SurfaceHostProps>;
  /** The element that holds the surface's padding: where overflow is measured. */
  inner: string;
}

/**
 * How previews render each registered surface on its own, in picker order.
 * Adding a surface: Creating occupants, "Add a surface or template".
 */
export const SURFACE_HOSTS: Record<string, SurfaceHost> = {
  "page-header": {
    Host: PageHeaderHost,
    inner: "[data-slot=page-header]",
  },
  "side-panel": {
    Host: SidePanelHost,
    inner: "[data-slot=side-panel-body]",
  },
  "content-area": {
    Host: ContentAreaHost,
    inner: "[data-slot=content-area-body]",
  },
};
