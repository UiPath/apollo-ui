"use client";

import { ArrowUp } from "lucide-react";
import { type CSSProperties, useState } from "react";

// The AI focus border, mirrored from the ai-chat input: a transparent border
// filled by two stacked backgrounds (solid interior + the AI gradient), clipped
// so the gradient shows only in the border ring.
const focusBorder: CSSProperties = {
  borderColor: "transparent",
  backgroundImage:
    "linear-gradient(var(--background), var(--background)), var(--ai-gradient-strong)",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
};

interface AiInputProps {
  /** Force the focused (gradient border) state for documentation. */
  forceFocus?: boolean;
  defaultValue?: string;
}

/** The ai-chat-style input: AI focus border, and an idle send until there's text. */
export function AiInput({
  forceFocus = false,
  defaultValue = "",
}: AiInputProps) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const active = forceFocus || focused;
  const canSend = value.trim().length > 0;

  return (
    <div
      className="flex items-center gap-2 rounded-lg border-2 border-input bg-background py-2 pl-3 pr-2 transition-colors"
      {...(active ? { style: focusBorder } : {})}
    >
      <input
        type="text"
        value={value}
        aria-label="Ask AI anything"
        placeholder="Ask AI anything…"
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
      />
      <button
        type="button"
        aria-label="Send"
        disabled={!canSend}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: "var(--ai-gradient-strong)" }}
      >
        <ArrowUp className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
