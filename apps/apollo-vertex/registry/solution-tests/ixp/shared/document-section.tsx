"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export const DocumentSection = ({
  title,
  titleAccessory,
  summary,
  defaultOpen = false,
  children,
}: {
  title: ReactNode;
  titleAccessory?: ReactNode;
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-md border"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-2 p-3 text-left hover:bg-muted/30">
        <ChevronRight
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden="true"
        />
        <div className="flex flex-1 items-center gap-2 truncate">
          <span className="truncate text-sm font-medium">{title}</span>
          {titleAccessory}
        </div>
        {summary}
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t p-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};
