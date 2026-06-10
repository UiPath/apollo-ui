"use client";

import { ArrowUp, PanelRightClose } from "lucide-react";
import { useRef, useState } from "react";
import { AutopilotIcon } from "@/registry/ai-chat/components/icons/autopilot";
import { Button } from "@/components/ui/button";

const AI_GRADIENT = { background: "var(--ai-gradient-strong)" };

interface ChatRailProps {
  onCollapse: () => void;
  /** Cold browse (no request) vs the request-scoped catalog. */
  cold?: boolean;
}

interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
}

/** Small Autopilot avatar for assistant lines. */
function Mark() {
  return (
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded-full text-white"
      style={AI_GRADIENT}
    >
      <AutopilotIcon size={13} aria-hidden />
    </span>
  );
}

/**
 * Docked assistant rail in the Catalog — an ambient browse helper, not a results
 * panel. The page already carries the agent's work (intent line, Picked-for-you,
 * filter chips), so the rail opens to a short scoped line + composer + chips.
 */
export function ChatRail({ onCollapse, cold = false }: ChatRailProps) {
  const browseLine = cold
    ? "Browsing the full catalog — laptops, monitors, docking, and accessories. Ask me to narrow it down."
    : "All 12, filtered to in-stock and EPP. The ThinkPad X1 is my pick, up top.";
  const chips = ["Compare two", "Narrow by spec", "Find a fit"];

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const idRef = useRef(0);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    idRef.current += 1;
    const uid = `m${idRef.current}`;
    idRef.current += 1;
    const aid = `m${idRef.current}`;
    setMsgs((prev) => [
      ...prev,
      { id: uid, role: "user", text: trimmed },
      {
        id: aid,
        role: "assistant",
        text: "I'd narrow on the specs that matter, then compare the top two — want me to set that up?",
      },
    ]);
    setQuery("");
  };

  return (
    <div className="flex h-full w-[360px] min-h-0 flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="flex size-7 items-center justify-center rounded-full text-white"
            style={AI_GRADIENT}
          >
            <AutopilotIcon size={16} aria-hidden />
          </span>
          <span className="font-semibold text-foreground">AI Assistant</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onCollapse}
          aria-label="Collapse assistant"
        >
          <PanelRightClose className="size-4" />
        </Button>
      </div>

      {/* Body — the scoped line, then any quick Q&A */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="flex gap-2.5">
          <Mark />
          <p className="pt-0.5 text-sm leading-6 text-foreground">
            {browseLine}
          </p>
        </div>
        {msgs.map((m) =>
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
        )}
      </div>

      {/* Scoped chips + composer */}
      <div className="shrink-0 space-y-2 border-t px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <Button
              key={chip}
              variant="outline"
              size="sm"
              className="rounded-full text-muted-foreground"
              onClick={() => setQuery(chip)}
            >
              {chip}
            </Button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(query);
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ask about catalog items…"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          <button
            type="submit"
            disabled={!query.trim()}
            aria-label="Ask AI Assistant"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white transition-all disabled:opacity-40"
            style={AI_GRADIENT}
          >
            <ArrowUp className="size-[18px]" />
          </button>
        </form>
      </div>
    </div>
  );
}
