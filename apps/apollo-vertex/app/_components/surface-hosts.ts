import type { ComponentType } from "react";
import {
  ContentAreaHost,
  PageHeaderHost,
  SidePanelHost,
  type SurfaceHostProps,
} from "./surface-hosts-components";

/**
 * How previews render each registered surface on its own, by name: the
 * occupant fixture, the docs demos, and the occupant workbench.
 *
 * To add a surface (a dashboard tile, say): register it in registry.json
 * with meta.layer "surface" and its <name>.surface.ts spec, give it a label
 * in lib/surface-labels.ts, and add its host here. A unit test fails until
 * every registered surface has both.
 */
export const SURFACE_HOSTS: Record<string, ComponentType<SurfaceHostProps>> = {
  "page-header": PageHeaderHost,
  "side-panel": SidePanelHost,
  "content-area": ContentAreaHost,
};
