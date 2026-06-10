"use client";

import { useRouterState } from "@tanstack/react-router";
import { ArrowUp } from "lucide-react";
import { useState } from "react";
import { AutopilotIcon } from "@/registry/ai-chat/components/icons/autopilot";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAutopilotChat } from "./autopilot-chat-context";
import { useConversation } from "./catalog/v1/conversation-context";

const AI_GRADIENT = { background: "var(--ai-gradient-strong)" };

// Temporarily hidden — the FAB stays fully wired; flip to false to bring it back.
const HIDDEN = true;

interface SurfaceContext {
  placeholder: string;
  chips: string[];
}

// What the popover asks about depends on where you are. Returns null on surfaces
// without an agent ask (Intake is itself a chat; review/track/dashboard have none).
function useSurfaceContext(): SurfaceContext | null {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { phase } = useConversation();

  if (pathname.startsWith("/configure")) {
    return {
      placeholder: "Ask about this configuration",
      chips: ["Why Business Pro?", "Can we mix tiers?"],
    };
  }
  if (pathname.startsWith("/workbench")) {
    return {
      placeholder: "Ask about this request",
      chips: [
        "Why Business Pro?",
        "Show the MSA terms",
        "Adjust the configuration",
      ],
    };
  }
  if (pathname.startsWith("/catalog")) {
    return {
      placeholder: "Ask about catalog items",
      chips: ["Compare two", "Narrow by spec"],
    };
  }
  if (pathname.startsWith("/buy")) {
    if (phase === "bridge" || phase === "service") {
      return {
        placeholder: "Ask about this request",
        chips: ["Why this approver?", "Change the cost center"],
      };
    }
    if (phase === "selection") {
      return {
        placeholder: "Ask about these matches",
        chips: ["Compare these", "Cheapest option"],
      };
    }
  }
  return null;
}

/** Small Autopilot avatar for assistant lines. */
function Mark({ size = 13 }: { size?: number }) {
  return (
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded-full text-white"
      style={AI_GRADIENT}
    >
      <AutopilotIcon size={size} aria-hidden />
    </span>
  );
}

/**
 * The one Autopilot home: a signature gradient orb fixed in the bottom-right
 * corner of every guided surface (the only place that gradient lives at rest, so
 * it reads as the agent). Quiet at rest; clicking opens a compact, context-aware
 * mini-chat in an elevated popover. The thread persists across steps. This is the
 * tertiary escape hatch — it dismisses on click-away/esc and doesn't trap focus.
 */
export function AutopilotFab() {
  const context = useSurfaceContext();
  const { open, setOpen, messages, unread, send } = useAutopilotChat();
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);

  // No ask affordance on Intake (a chat already), review, track, dashboard.
  if (!context) return null;

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    send(text);
    setDraft("");
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", HIDDEN && "hidden")}>
      <Popover open={HIDDEN ? false : open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Ask AI Assistant"
            className="relative flex size-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            style={AI_GRADIENT}
          >
            <AutopilotIcon size={26} aria-hidden />
            {unread && !open && (
              <span className="absolute right-1 top-1 size-2.5 rounded-full bg-white shadow" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          sideOffset={12}
          className="w-[360px] overflow-hidden rounded-2xl p-0 shadow-xl"
          // Quiet escape hatch — opening it shouldn't yank focus into the panel.
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Mark size={16} />
            <span className="font-semibold text-foreground">AI Assistant</span>
          </div>

          {/* Thread */}
          <div className="max-h-[320px] min-h-[88px] space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ask me anything about this — I have the context.
              </p>
            ) : (
              messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-muted px-3 py-2 text-sm text-foreground">
                      {m.text}
                    </p>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-2.5">
                    <Mark />
                    <p className="pt-0.5 text-sm leading-6 text-foreground">
                      {m.text}
                    </p>
                  </div>
                ),
              )
            )}
          </div>

          {/* Context-aware chips + composer */}
          <div className="space-y-2 border-t px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              {context.chips.map((chip) => (
                <Button
                  key={chip}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full text-muted-foreground"
                  onClick={() => setDraft(chip)}
                >
                  {chip}
                </Button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="flex items-center gap-2 rounded-[10px]"
              style={
                focused
                  ? {
                      border: "2px solid transparent",
                      background:
                        "linear-gradient(var(--background), var(--background)) padding-box, var(--ai-gradient-strong) border-box",
                      padding: "6px 6px 6px 14px",
                    }
                  : {
                      border: "2px solid var(--input)",
                      padding: "6px 6px 6px 14px",
                    }
              }
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={context.placeholder}
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Send"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white transition-all disabled:opacity-40"
                style={AI_GRADIENT}
              >
                <ArrowUp className="size-[18px]" />
              </button>
            </form>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
