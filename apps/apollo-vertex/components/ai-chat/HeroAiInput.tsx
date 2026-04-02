"use client";

import { ArrowRight, Mic } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const heroSuggestions = [
  "What's slowing setup time for FHA loans?",
  "Show me top delay factors this quarter",
  "Compare Feb performance vs. last quarter",
];

interface HeroAiInputProps {
  onSubmit: (q: string) => void;
  chatActive: boolean;
}

export function HeroAiInput({ onSubmit, chatActive }: HeroAiInputProps) {
  const [value, setValue] = useState("");

  function submit(q: string) {
    if (!q.trim()) return;
    setValue("");
    onSubmit(q.trim());
  }

  return (
    <div
      className={cn(
        "mt-4 space-y-2 transition-opacity duration-300",
        chatActive && "pointer-events-none opacity-30",
      )}
    >
      <div className="flex flex-wrap gap-1.5">
        {heroSuggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSubmit(s)}
            className="rounded-full border border-border/60 bg-background/50 px-2.5 py-1 text-[11px] text-foreground/65 transition-all hover:border-primary/40 hover:bg-background hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5 transition-all duration-200",
          "border-border focus-within:border-primary/40",
        )}
      >
        <Mic className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit(value);
          }}
          placeholder="Ask a follow-up question about your setup data…"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none"
        />
        <button
          type="button"
          disabled={!value.trim()}
          onClick={() => submit(value)}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
