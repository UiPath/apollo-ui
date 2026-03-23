"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { CardConfig, CardGradient } from "./glow-config";

function cardBgStyle(
  bg: string,
  opacity: number,
  gradient: CardGradient,
): React.CSSProperties {
  if (gradient.enabled) {
    const alpha = gradient.opacity / 100;
    return {
      "--card-bg-override": `linear-gradient(${gradient.angle}deg, color-mix(in srgb, ${gradient.start} ${alpha * 100}%, transparent), color-mix(in srgb, ${gradient.end} ${alpha * 100}%, transparent))`,
      borderColor: "transparent",
    } as React.CSSProperties;
  }
  const value =
    bg === "white"
      ? `rgba(255,255,255,${opacity / 100})`
      : `color-mix(in srgb, var(--${bg}) ${opacity}%, transparent)`;
  return { "--card-bg-override": value } as React.CSSProperties;
}

export function PromptBar({
  shared,
  cards,
}: {
  shared: string;
  cards: CardConfig;
}) {
  const [value, setValue] = useState("");
  const hasInput = value.trim().length > 0;

  return (
    <div className="group rounded-2xl p-[2px] focus-within:bg-gradient-to-r focus-within:from-insight-500/75 focus-within:to-primary-400/75 transition-all">
      <div className="grid grid-rows-[0fr] focus-within:grid-rows-[1fr] group-focus-within:grid-rows-[1fr] transition-[grid-template-rows] duration-300">
        <div className="overflow-hidden">
          <div className="px-3 pt-2 pb-2 flex gap-2">
            <Badge
              variant="secondary"
              status="info"
              className="!bg-white/35 !text-foreground opacity-0 translate-y-2 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-300 cursor-pointer"
            >
              Show me top risk factors
            </Badge>
            <Badge
              variant="secondary"
              status="info"
              className="!bg-white/35 !text-foreground opacity-0 translate-y-2 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-300 delay-75 cursor-pointer"
            >
              Compare Q1 vs Q2 performance
            </Badge>
          </div>
        </div>
      </div>
      <div
        className={`flex items-center rounded-[14px] px-4 py-3 !bg-white/80 backdrop-blur-sm transition-colors ${shared}`}
        style={cardBgStyle(
          cards.promptBg,
          cards.promptOpacity,
          cards.promptGradient,
        )}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="What would you like to understand about loan performance?"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center gap-2 ml-3">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Voice input"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>
          <button
            type="button"
            disabled={!hasInput}
            className="size-8 rounded-full bg-gradient-to-br from-insight-500 to-primary-400 flex items-center justify-center text-white transition-opacity disabled:opacity-30"
            aria-label="Submit"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="m5 12 7-7 7 7" />
              <path d="M12 19V5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
