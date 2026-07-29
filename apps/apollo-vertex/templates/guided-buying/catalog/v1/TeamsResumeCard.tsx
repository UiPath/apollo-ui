"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeamsResumeCardProps {
  onResume: () => void;
  onDismiss: () => void;
}

export function TeamsResumeCard({ onResume, onDismiss }: TeamsResumeCardProps) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl border-2 border-input px-3 pt-0.5 pb-4"
      style={{ backgroundImage: "var(--ai-gradient)" }}
    >
      {/* Microsoft Teams icon — vectorised two-person figure */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <rect width="20" height="20" rx="5" fill="#5059C9" />
        {/* Secondary person — behind the primary, lighter purple */}
        <circle cx="14.5" cy="6" r="2" fill="#7B83EB" />
        <rect x="12" y="9.5" width="6" height="5.5" rx="1.5" fill="#7B83EB" />
        {/* Primary person — circle head */}
        <circle cx="8.5" cy="5.5" r="2.5" fill="white" />
        {/* Primary person — T-body: wide crossbar + narrow stem overlap to form T */}
        <rect x="3" y="9" width="12" height="2.5" rx="1.2" fill="white" />
        <rect x="7" y="9" width="3.5" height="6" rx="1.2" fill="white" />
      </svg>

      {/* Title + inline meta, single truncating row */}
      <p className="min-w-0 flex-1 truncate text-sm text-foreground">
        <span className="font-medium">
          15 laptops for Fusion Event contractors
        </span>
        <span className="ml-2 text-xs text-muted-foreground">
          Teams · 9:12 AM
        </span>
      </p>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Button variant="ghost" size="sm" onClick={onResume}>
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
