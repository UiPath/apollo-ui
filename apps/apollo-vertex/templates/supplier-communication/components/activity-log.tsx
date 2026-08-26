"use client";

import { User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import type { AuditActor, SupplierCase } from "../data/supplier-cases";
import { GUTTER, GUTTER_ROW } from "./pane-grid";

function AuditMarker({ actor }: { actor: AuditActor }) {
  if (actor === "agent") {
    return (
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full text-white"
        style={{ background: "var(--ai-gradient-strong)" }}
      >
        <AiMark size={12} />
      </span>
    );
  }

  if (actor === "person") {
    return (
      <Avatar className="size-6 shrink-0">
        <AvatarFallback className="text-muted-foreground">
          <User className="size-3" aria-hidden />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
      <span className="size-1.5 rounded-full bg-muted-foreground/50" />
    </span>
  );
}

const ACTOR_LABEL: Record<AuditActor, string> = {
  agent: "Agent",
  person: "Person",
  system: "System",
};

interface ActivityLogProps {
  audit: SupplierCase["audit"];
}

/** Provenance trail. Agent steps carry the mark, people appear as avatars. */
export function ActivityLog({ audit }: ActivityLogProps) {
  return (
    <ol className="pt-5">
      {audit.map(([time, entry, actor = "system"], i) => {
        const last = i === audit.length - 1;

        return (
          <li key={`${time}-${entry}`} className={GUTTER_ROW}>
            <div className={cn(GUTTER, "flex flex-col items-center")}>
              <AuditMarker actor={actor} />
              {!last && <span className="my-1 w-px flex-1 bg-border" />}
            </div>
            <div className={cn("min-w-0 flex-1", last ? "pb-0" : "pb-4")}>
              <div className="flex min-h-6 items-baseline justify-between gap-4">
                <p className="min-w-0 text-sm leading-relaxed text-foreground">
                  <span className="sr-only">{`${ACTOR_LABEL[actor]}: `}</span>
                  {entry}
                </p>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {time}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
