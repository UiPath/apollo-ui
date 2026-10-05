"use client";

import type { ReactNode } from "react";
import { ContentArea } from "@/components/ui/content-area";
import { PageHeader } from "@/components/ui/page-header";
import { SidePanel, type SidePanelOccupants } from "@/components/ui/side-panel";
import type { ScrollOwner, SurfacePadding } from "@/lib/composition";
import type { PanelSpec } from "@/lib/panel";

/** What a preview gives a surface to host one occupant, with no template. */
export interface SurfaceHostProps {
  padding: SurfacePadding;
  scroll: ScrollOwner;
  /** The occupant's label, for surfaces that need an accessible name. */
  label: string;
  /** A side panel's edge. Defaults to "end". */
  side?: "start" | "end";
  /**
   * Whether a side panel takes the whole width it's given, as on a stage.
   * Defaults to true; in a template, the template sets its width.
   */
  fill?: boolean;
  /**
   * A side panel's tabs and stacks, with the occupants they name and the
   * tab to open on. Without them, it holds `children`.
   */
  panel?: {
    spec: PanelSpec;
    occupants: SidePanelOccupants;
    defaultTab: string;
    onTabChange?: (id: string) => void;
  };
  children?: ReactNode;
}

export function PageHeaderHost({ padding, children }: SurfaceHostProps) {
  return <PageHeader padding={padding}>{children}</PageHeader>;
}

export function SidePanelHost({
  padding,
  scroll,
  label,
  side = "end",
  fill = true,
  panel,
  children,
}: SurfaceHostProps) {
  return (
    <SidePanel
      side={side}
      aria-label={label}
      padding={padding}
      scroll={scroll}
      fill={fill}
      {...(panel && {
        panel: panel.spec,
        occupants: panel.occupants,
        defaultTab: panel.defaultTab,
        ...(panel.onTabChange && { onTabChange: panel.onTabChange }),
      })}
    >
      {children}
    </SidePanel>
  );
}

export function ContentAreaHost({
  padding,
  scroll,
  children,
}: SurfaceHostProps) {
  return (
    <ContentArea padding={padding} scroll={scroll}>
      {children}
    </ContentArea>
  );
}
