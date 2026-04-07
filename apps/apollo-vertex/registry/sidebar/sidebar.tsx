"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-provider";

const SIDEBAR_WIDTH_MOBILE = "18rem";

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const { t } = useTranslation();
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
          /* oxlint-disable typescript-eslint(no-unsafe-type-assertion) -- CSS custom property not in React.CSSProperties */
          style={
            { "--sidebar-width": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties
          }
          /* oxlint-enable typescript-eslint(no-unsafe-type-assertion) */
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{t("sidebar")}</SheetTitle>
            <SheetDescription>{t("displays_mobile_sidebar")}</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block relative"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-300 ease-in-out",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "absolute inset-y-0 z-10 hidden h-full w-(--sidebar-width) transition-[left,right,width] duration-300 ease-in-out md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
          variant === "sidebar" &&
            "group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export { Sidebar };
export { SidebarContent } from "./sidebar-content";
export { SidebarFooter } from "./sidebar-footer";
export { SidebarGroup } from "./sidebar-group";
export { SidebarGroupAction } from "./sidebar-group-action";
export { SidebarGroupContent } from "./sidebar-group-content";
export { SidebarGroupLabel } from "./sidebar-group-label";
export { SidebarHeader } from "./sidebar-header";
export { SidebarInput } from "./sidebar-input";
export { SidebarInset } from "./sidebar-inset";
export { SidebarMenu } from "./sidebar-menu";
export { SidebarMenuAction } from "./sidebar-menu-action";
export { SidebarMenuBadge } from "./sidebar-menu-badge";
export {
  SidebarMenuButton,
  sidebarMenuButtonVariants,
} from "./sidebar-menu-button";
export { SidebarMenuItem } from "./sidebar-menu-item";
export { SidebarMenuSkeleton } from "./sidebar-menu-skeleton";
export { SidebarMenuSub } from "./sidebar-menu-sub";
export { SidebarMenuSubButton } from "./sidebar-menu-sub-button";
export { SidebarMenuSubItem } from "./sidebar-menu-sub-item";
export { SidebarProvider, useSidebar } from "./sidebar-provider";
export { SidebarRail } from "./sidebar-rail";
export { SidebarSeparator } from "./sidebar-separator";
export { SidebarTrigger } from "./sidebar-trigger";
