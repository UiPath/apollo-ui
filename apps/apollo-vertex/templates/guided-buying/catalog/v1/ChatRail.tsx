import { PanelRightClose, Send } from "lucide-react";
import type { Ref } from "react";
import { AutopilotIcon } from "@/registry/ai-chat/components/icons/autopilot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BuyRequest, RailNote } from "./types";

interface ChatRailProps {
  request: BuyRequest;
  /** Agent notes appended as filters change. */
  notes: RailNote[];
  /** Lets the workspace focus the input (the "ask the agent" hook). */
  inputRef?: Ref<HTMLInputElement>;
  onCollapse: () => void;
}

/**
 * Docked assistant rail. Visual placeholder for the prototype — real chat
 * behavior is out of scope; the input is exposed so "Ask the agent" can focus it.
 */
export function ChatRail({
  request,
  notes,
  inputRef,
  onCollapse,
}: ChatRailProps) {
  return (
    <div className="flex h-full w-[360px] flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="flex size-7 items-center justify-center rounded-full text-white"
            style={{ background: "var(--ai-gradient-strong)" }}
          >
            <AutopilotIcon size={16} aria-hidden />
          </span>
          <span className="font-semibold text-foreground">Autopilot</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onCollapse}
          aria-label="Collapse assistant"
        >
          <PanelRightClose className="size-4" />
        </Button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <p className="text-sm text-muted-foreground">Here’s what I’m on:</p>
        <div className="ml-auto w-fit max-w-[85%] rounded-lg rounded-tr-sm bg-muted px-3 py-2 text-sm text-foreground">
          {request.summary}
        </div>
        <p className="text-sm text-muted-foreground">{request.agentNote}</p>
        {notes.map((note) => (
          <p
            key={note.id}
            className="flex items-start gap-1.5 text-sm text-muted-foreground"
          >
            <AutopilotIcon size={14} className="mt-0.5 shrink-0" aria-hidden />
            {note.text}
          </p>
        ))}
      </div>

      <div className="border-t p-3">
        {/* TODO(agent): wire real chat. Stubbed input for now. */}
        <div className="relative">
          <Input
            ref={inputRef}
            placeholder="Ask about catalog items…"
            className="pr-10"
            aria-label="Ask the assistant"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            aria-label="Send"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
