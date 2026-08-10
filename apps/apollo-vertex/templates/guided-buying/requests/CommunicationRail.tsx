"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { avatarColorFor } from "./avatar-color";
import { type DecisionDetail, notificationRecipients } from "./data";
import { RecordEntry } from "./RecordEntry";
import { noteProvenance, useRequests } from "./requests-context";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Below this width the rail docks — a fixed breakpoint on the whole
// viewport, matching how the rest of this app reasons about layout width.
const DOCK_QUERY = "(max-width: 1439px)";

// Roughly two lines of text-sm content; the ceiling matches the old
// Textarea's implicit cap so a very long draft still scrolls, not grows
// without bound.
const COMPOSER_MIN_HEIGHT = 48;
const COMPOSER_MAX_HEIGHT = 160;

interface CommunicationRailProps {
  detail: DecisionDetail;
  approverFirstName: string;
}

/** Overlapping initials, replacing a plain "Notifies X, Y" line. The group
 * as a whole is named for assistive tech (not just a count), and each
 * avatar is individually reachable by hover or keyboard focus so a sighted
 * or screen-reader user can get every name, not only the first. Each
 * avatar's color is per-person (see `avatar-color.ts`), not a single shared
 * tint, so two stacked initials don't read as one blob. */
function RecipientAvatarStack({ names }: { names: string[] }) {
  return (
    <div role="group" aria-label={names.join(", ")} className="flex -space-x-2">
      {names.map((name) => {
        const color = avatarColorFor(name);
        return (
          <Tooltip key={name}>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-background text-[9px] font-semibold",
                  color.bg,
                  color.fg,
                )}
              >
                {initialsOf(name)}
              </span>
            </TooltipTrigger>
            <TooltipContent>{name}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

/**
 * The communication rail — reads the same shared thread RequestWindow
 * already reads (`threads`/`addNote`), so a note posted here shows up on
 * the requester's own page too. Collapses to a docked launcher below 1440px;
 * that's state on this one component, not a second one.
 */
export function CommunicationRail({
  detail,
  approverFirstName,
}: CommunicationRailProps) {
  const { threads, addNote } = useRequests();
  const [draft, setDraft] = useState("");
  const [docked, setDocked] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const mql = window.matchMedia(DOCK_QUERY);
    setDocked(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setDocked(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  if (docked) {
    return (
      <div className="fixed right-6 bottom-6 z-40">
        <button
          type="button"
          onClick={() => setDocked(false)}
          aria-label="Open communication"
          className="relative flex size-12 items-center justify-center rounded-full text-white shadow-lg"
          style={{ background: "var(--ai-gradient-strong)" }}
        >
          <AiMark size={18} aria-hidden />
        </button>
      </div>
    );
  }

  const notes = threads[detail.id] ?? [];
  const count = notes.length;

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, COMPOSER_MIN_HEIGHT), COMPOSER_MAX_HEIGHT)}px`;
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    addNote(detail.id, text, approverFirstName);
    setDraft("");
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) el.style.height = `${COMPOSER_MIN_HEIGHT}px`;
    });
  };

  return (
    <div className="relative flex h-full w-[340px] shrink-0 flex-col bg-sidebar/50 px-6 pt-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-px bg-border [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]"
      />
      <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
        Communication
        <Badge variant="secondary">{count}</Badge>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col justify-end space-y-4 overflow-y-auto">
        {notes.map((note) => (
          <RecordEntry
            key={note.id}
            isPerson
            name={note.author}
            initials={initialsOf(note.author)}
            timestamp={note.time}
            text={note.text}
            provenance={noteProvenance(note, detail.teamsChannel)}
          />
        ))}
      </div>

      <div className="mt-10 space-y-2 pb-4">
        <div
          className={cn(
            "rounded-lg border border-border transition-shadow motion-safe:duration-150",
            "focus-within:border-primary focus-within:shadow-[0_0_0_1px_var(--primary),0_0_12px_2px_color-mix(in_oklab,var(--primary)_35%,transparent)]",
          )}
        >
          {/* PLACEHOLDER [Composer placeholder] — a question-to-requester
              framing vs. a general-comment framing is unresolved; this is
              the current fallback, unchanged. */}
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              requestAnimationFrame(adjustHeight);
            }}
            placeholder={`Ask ${detail.requester.split(" ")[0]} a question before deciding`}
            rows={1}
            style={{ height: COMPOSER_MIN_HEIGHT }}
            className="block w-full resize-none rounded-lg bg-background px-3 py-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground dark:bg-input/30"
          />
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between gap-2 rounded-b-lg bg-background p-2 dark:bg-input/30">
            <RecipientAvatarStack names={notificationRecipients(detail)} />
            <Button size="sm" disabled={!draft.trim()} onClick={handleSend}>
              Send
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Posts to {detail.teamsChannel} · {detail.id}
        </p>
      </div>
    </div>
  );
}
