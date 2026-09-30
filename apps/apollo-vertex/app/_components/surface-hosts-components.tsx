"use client";

import type { ReactNode } from "react";
import { ContentArea } from "@/components/ui/content-area";
import { PageHeader } from "@/components/ui/page-header";
import { SidePanel } from "@/components/ui/side-panel";
import type { ScrollOwner, SurfacePadding } from "@/lib/composition";

/** What a preview gives a surface to host one occupant, with no template. */
export interface SurfaceHostProps {
  padding: SurfacePadding;
  scroll: ScrollOwner;
  /** The occupant's label, for surfaces that need an accessible name. */
  label: string;
  children: ReactNode;
}

export function PageHeaderHost({ padding, children }: SurfaceHostProps) {
  return <PageHeader padding={padding}>{children}</PageHeader>;
}

export function SidePanelHost({
  padding,
  scroll,
  label,
  children,
}: SurfaceHostProps) {
  return (
    <SidePanel
      side="end"
      aria-label={label}
      padding={padding}
      scroll={scroll}
      className="w-full [--side-panel-width:100%]"
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
