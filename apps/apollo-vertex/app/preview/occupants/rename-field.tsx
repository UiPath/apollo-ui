"use client";

import { RotateCcw } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RenameFieldProps {
  /** The name as the page shows it now. */
  name: string;
  /** Whether it's renamed: a reset icon puts the default back. */
  renamed: boolean;
  onRename: (text: string) => void;
  onRestore: () => void;
  /** A data-slot for the name's button, for its place in a row. */
  slot?: string;
  className?: string;
}

/**
 * A name that can be renamed in place, for this preview only. It's a
 * button named "Rename …"; pressed, it's a text field with the same name.
 * Enter or leaving the field saves, Escape cancels, and an empty name
 * restores the default. A renamed one has a reset icon beside it.
 */
export function RenameField({
  name,
  renamed,
  onRename,
  onRestore,
  slot,
  className,
}: RenameFieldProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const input = useRef<HTMLInputElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  // Focus follows the field: into it to edit, back to the name after.
  const back = useRef(false);
  useEffect(() => {
    if (editing) input.current?.select();
    else if (back.current) {
      back.current = false;
      button.current?.focus();
    }
  }, [editing]);
  const hintId = useId();
  const label = t("workbench_rename", { name });
  const done = (save: boolean) => {
    if (!editing) return;
    back.current = true;
    setEditing(false);
    if (save && draft.trim() !== name) onRename(draft);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      done(true);
    }
    if (event.key === "Escape") {
      // The inspector's Escape deselects the slot: this one is the field's.
      event.preventDefault();
      event.stopPropagation();
      done(false);
    }
  };
  if (editing)
    return (
      <div className={cn("flex min-w-0 flex-1 flex-col gap-1", className)}>
        <Input
          ref={input}
          data-slot="workbench-rename-input"
          aria-label={label}
          aria-describedby={hintId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => done(true)}
          className="h-7 px-2 text-sm"
        />
        <p
          id={hintId}
          data-slot="workbench-rename-hint"
          className="text-xs text-muted-foreground"
        >
          {t("workbench_rename_hint")}
        </p>
      </div>
    );
  return (
    <div className={cn("flex min-w-0 items-center gap-0.5", className)}>
      <button
        ref={button}
        type="button"
        data-slot={slot}
        data-renamed={renamed}
        aria-label={label}
        onClick={() => {
          setDraft(name);
          setEditing(true);
        }}
        className="min-w-0 truncate rounded-sm px-1 text-start outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring data-[renamed=true]:italic"
      >
        {name}
      </button>
      {renamed && (
        <Button
          variant="ghost"
          size="icon-xs"
          data-slot="workbench-rename-reset"
          aria-label={t("workbench_rename_reset", { name })}
          onClick={() => {
            back.current = true;
            onRestore();
          }}
        >
          <RotateCcw />
        </Button>
      )}
    </div>
  );
}
