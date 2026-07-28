"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeamsResumeCardProps {
  onResume: () => void;
  onDismiss: () => void;
}

export function TeamsResumeCard({ onResume, onDismiss }: TeamsResumeCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-(--gb-teal) bg-background p-4">
      {/* Teams icon area */}
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--gb-indigobg)">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path
            d="M10 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3.75 7.5a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 .75.75v1.25a5 5 0 0 1-10 0V7.5Z"
            fill="var(--gb-indigo)"
          />
          <path
            d="M12.5 5.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM12.75 7.5h1.5a.75.75 0 0 1 .75.75V9.5a3 3 0 0 1-2.25 2.91V7.5Z"
            fill="var(--gb-indigo)"
            opacity="0.5"
          />
        </svg>
      </div>

      {/* Text content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          15 laptops for Fusion Event contractors
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Started in Teams · 9:12 AM · Picks up at Details
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" onClick={onResume}>
          Resume
        </Button>
        <button
          type="button"
          onClick={onDismiss}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
