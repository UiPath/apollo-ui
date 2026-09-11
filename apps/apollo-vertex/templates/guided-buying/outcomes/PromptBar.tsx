"use client";

import { MessagesSquare, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { ph } from "../data/placeholders";
import type { InsightCardData } from "./dashboard-data";
import { useDashboardData } from "./dashboard-data-context";
import { type CardConfig, cardBgStyle } from "./glow-config";

// A short pause before the scripted answer reveals, so it reads as a
// response rather than a lookup. No token by token stream (prompt 90).
const ANSWER_DELAY_MS = 900;

interface AskTranscriptEntry {
  title: string;
  answer: string;
  followUps?: string[];
}

export function PromptBar({
  shared,
  cards,
  isExpanded = false,
  onSubmit,
  onExpand,
  onCollapse,
  activeCard,
  onAskSubmit,
  transcript = [],
}: {
  shared: string;
  cards: CardConfig;
  isExpanded?: boolean;
  onSubmit?: (query: string) => void;
  onExpand?: () => void;
  onCollapse?: () => void;
  activeCard?: InsightCardData | null;
  onAskSubmit?: () => void;
  transcript?: AskTranscriptEntry[];
}) {
  const { data } = useDashboardData();
  const [value, setValue] = useState("");
  const [answering, setAnswering] = useState(false);
  const hasInput = value.trim().length > 0;
  const answerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearAnswerTimeout = () => {
    if (answerTimeout.current) {
      clearTimeout(answerTimeout.current);
      answerTimeout.current = null;
    }
  };
  useEffect(() => clearAnswerTimeout, []);

  const triggerAnswer = () => {
    clearAnswerTimeout();
    setValue("");
    setAnswering(true);
    answerTimeout.current = setTimeout(() => {
      setAnswering(false);
      onAskSubmit?.();
    }, ANSWER_DELAY_MS);
  };

  // The mark's own click grounds the composer and asks in one motion, no
  // separate submit required. Toggling the mark off before the delay
  // completes cancels the pending answer rather than letting a stale
  // timer add it to the transcript later.
  const autoAskedFor = useRef<InsightCardData | null>(null);
  useEffect(() => {
    if (activeCard?.askAnswer && activeCard !== autoAskedFor.current) {
      autoAskedFor.current = activeCard;
      triggerAnswer();
    }
    if (!activeCard) {
      autoAskedFor.current = null;
      clearAnswerTimeout();
      setAnswering(false);
    }
    // oxlint-disable-next-line react-hooks(exhaustive-deps) -- triggerAnswer runs once per card via the autoAskedFor ref, not this list
  }, [activeCard]);

  const handleSubmit = () => {
    if (!hasInput) return;
    if (activeCard?.askAnswer) {
      triggerAnswer();
      return;
    }
    onSubmit?.(value);
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
              <AiMark size={16} gradientId="gb-ai-mark" />
              <span className="text-sm font-bold tracking-tight">
                AI Assistant
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
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
            {transcript.length === 0 && !answering ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground/50">
                  Responses will appear here
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {transcript.map((entry, i) => {
                  const isLast = i === transcript.length - 1;
                  return (
                    <div
                      key={`${entry.title}-${entry.answer}`}
                      className="animate-in fade-in duration-300"
                    >
                      <div className="flex justify-end">
                        <span className="w-fit rounded-full border-2 border-primary/40 bg-ai-chat-bubble-user px-2.5 py-1 text-xs font-medium text-ai-chat-bubble-user-foreground">
                          {entry.title}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-foreground">
                        {entry.answer}
                      </p>
                      {isLast &&
                        !answering &&
                        entry.followUps &&
                        entry.followUps.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {entry.followUps.map((question) => (
                              <Badge
                                key={question}
                                status="ai"
                                variant="secondary"
                                className="cursor-pointer text-xs"
                                onClick={triggerAnswer}
                              >
                                {question}
                              </Badge>
                            ))}
                          </div>
                        )}
                    </div>
                  );
                })}
                {answering && (
                  <div className="flex flex-col gap-2">
                    <div className="h-3 w-2/3 rounded-full bg-muted/50 animate-pulse" />
                    <div className="h-3 w-1/2 rounded-full bg-muted/50 animate-pulse" />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="border-t border-border" />
        </div>
      )}
      {/* Suggestion badges, hidden when expanded */}
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
                    data.promptSuggestions[1] ?? "Compare Q1 vs Q2 performance",
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
        className={`flex flex-col !bg-white/80 backdrop-blur-sm transition-colors ${shared} ${
          isExpanded ? "rounded-b-[14px]" : "rounded-[14px]"
        }`}
        style={cardBgStyle(
          cards.promptBg,
          cards.promptOpacity,
          cards.promptGradient,
        )}
      >
        <div className="flex items-center px-4 py-3">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder={
              activeCard
                ? ph("PH-100", "grounded composer placeholder")
                : data.promptPlaceholder
            }
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
    </div>
  );
}
