"use client";

import { useState } from "react";
import { MessagesSquare, Minimize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CardConfig, CardGradient } from "./glow-config";
import { useDashboardData } from "./DashboardDataProvider";

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
  isExpanded = false,
  onSubmit,
  onExpand,
  onCollapse,
}: {
  shared: string;
  cards: CardConfig;
  isExpanded?: boolean;
  onSubmit?: (query: string) => void;
  onExpand?: () => void;
  onCollapse?: () => void;
}) {
  const { data } = useDashboardData();
  const [value, setValue] = useState("");
  const hasInput = value.trim().length > 0;

  const handleSubmit = () => {
    if (hasInput && onSubmit) {
      onSubmit(value);
    }
  };

  const handleChipClick = (suggestion: string) => {
    setValue(suggestion);
    onSubmit?.(suggestion);
  };

  return (
    <div
      className={`group flex flex-col rounded-2xl p-[2px] transition-all duration-300 ${
        isExpanded
          ? "flex-1 bg-gradient-to-r from-insight-500/75 to-primary-400/75"
          : "focus-within:bg-gradient-to-r focus-within:from-insight-500/75 focus-within:to-primary-400/75"
      }`}
    >
      {/* Expanded response area */}
      {isExpanded && (
        <div className="flex-1 flex flex-col rounded-t-[14px] !bg-white/90 dark:!bg-card/90 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <img
                src="/Autopilot_dark.svg"
                alt="Autopilot"
                className="size-4 block dark:hidden"
              />
              <img
                src="/Autopilot_light.svg"
                alt="Autopilot"
                className="size-4 hidden dark:block"
              />
              <span className="text-sm font-bold tracking-tight">
                Autopilot
              </span>
            </div>
            {onCollapse && (
              <button
                type="button"
                onClick={onCollapse}
                className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <Minimize2 className="size-4" />
              </button>
            )}
          </div>
          <div className="flex-1 flex items-center justify-center px-6 pb-4">
            <p className="text-sm text-muted-foreground/50">
              Responses will appear here
            </p>
          </div>
          <div className="border-t border-border" />
        </div>
      )}
      {/* Suggestion badges — hidden when expanded */}
      {!isExpanded && (
        <div className="grid grid-rows-[0fr] focus-within:grid-rows-[1fr] group-focus-within:grid-rows-[1fr] transition-[grid-template-rows] duration-300">
          <div className="overflow-hidden">
            <div className="px-3 pt-2 pb-2 flex gap-2">
              <Badge
                variant="secondary"
                status="info"
                className="!bg-white/35 !text-foreground opacity-0 translate-y-2 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-300 cursor-pointer"
                onClick={() =>
                  handleChipClick(
                    data.promptSuggestions[0] ?? "Show me top risk factors",
                  )
                }
              >
                {data.promptSuggestions[0] ?? "Show me top risk factors"}
              </Badge>
              <Badge
                variant="secondary"
                status="info"
                className="!bg-white/35 !text-foreground opacity-0 translate-y-2 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-300 delay-75 cursor-pointer"
                onClick={() =>
                  handleChipClick(
                    data.promptSuggestions[1] ??
                      "Compare Q1 vs Q2 performance",
                  )
                }
              >
                {data.promptSuggestions[1] ?? "Compare Q1 vs Q2 performance"}
              </Badge>
            </div>
          </div>
        </div>
      )}
      {/* Input bar */}
      <div
        className={`flex items-center px-4 py-3 !bg-white/80 backdrop-blur-sm transition-colors ${shared} ${
          isExpanded ? "rounded-b-[14px]" : "rounded-[14px]"
        }`}
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
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder={data.promptPlaceholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center gap-2 ml-3">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onExpand}
            className="size-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            aria-label="Open chat"
          >
            <MessagesSquare className="size-4" />
          </button>
          <button
            type="button"
            disabled={!hasInput}
            onClick={handleSubmit}
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
