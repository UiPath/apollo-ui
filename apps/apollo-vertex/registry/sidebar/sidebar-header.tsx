"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 pt-6 px-2 pb-2", className)}
      {...props}
    />
  );
}

export { SidebarHeader };
