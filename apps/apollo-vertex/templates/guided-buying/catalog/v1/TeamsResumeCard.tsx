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
      className="mx-2 mt-1 flex translate-y-2 items-center gap-2.5 rounded-t-xl px-3 pt-1 pb-3 shadow-[inset_0_-8px_10px_-6px_rgba(0,0,0,0.35)]"
      style={{ backgroundImage: "var(--ai-gradient)" }}
    >
      {/* Microsoft Teams icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <rect width="20" height="20" rx="5" fill="#5059C9" />
        <g transform="translate(3.25 3.25) scale(0.84)" fill="white">
          <path d="M9.186 4.797a2.42 2.42 0 1 0-2.86-2.448h1.178c.929 0 1.682.753 1.682 1.682v.766Zm-4.295 7.738h2.613c.929 0 1.682-.753 1.682-1.682V5.58h2.783a.7.7 0 0 1 .682.716v4.294a4.197 4.197 0 0 1-4.093 4.293c-1.618-.04-3-.99-3.667-2.35Zm10.737-9.372a1.674 1.674 0 1 1-3.349 0 1.674 1.674 0 0 1 3.349 0Zm-2.238 9.488c-.04 0-.08 0-.12-.002a5.19 5.19 0 0 0 .381-2.07V6.306a1.692 1.692 0 0 0-.15-.725h1.792c.39 0 .707.317.707.707v3.765a2.598 2.598 0 0 1-2.598 2.598h-.013Z" />
          <path d="M.682 3.349h6.822c.377 0 .682.305.682.682v6.822a.682.682 0 0 1-.682.682H.682A.682.682 0 0 1 0 10.853V4.03c0-.377.305-.682.682-.682Zm5.206 2.596v-.72h-3.59v.72h1.357V9.66h.87V5.945h1.363Z" />
        </g>
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

      {/* Actions — Resume and dismiss sit as a tight pair at the right edge */}
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="px-2 text-sm hover:bg-background dark:hover:bg-background"
          onClick={onResume}
        >
          Resume
        </Button>
        <button
          type="button"
          onClick={onDismiss}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground dark:hover:bg-background"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
