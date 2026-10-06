"use client";

import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useId } from "react";

interface LockedProps {
  /** Why it can't be chosen; null when it can. */
  reason: string | null;
  /** Renders the control; spread what it's given onto it. */
  children: (described: { "aria-describedby"?: string }) => ReactNode;
}

/** A control, with why it's locked under it when it is. */
export function Locked({ reason, children }: LockedProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      {children(reason ? { "aria-describedby": id } : {})}
      {reason && (
        <p
          id={id}
          data-slot="workbench-contents-reason"
          className="flex items-start gap-1.5 text-xs text-muted-foreground"
        >
          <Lock aria-hidden className="mt-0.5 size-3 shrink-0" />
          {reason}
        </p>
      )}
    </div>
  );
}
