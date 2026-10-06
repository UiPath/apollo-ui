"use client";

import { useId } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LockIcon } from "./lock-hint";
import { SELECTED_SEGMENT } from "./segment";

interface ChoiceProps<Value extends string> {
  label: string;
  /** The group's accessible name, when the visible label leans on its section. */
  name?: string;
  value: Value;
  options: readonly { value: Value; label: string; disabled?: boolean }[];
  onChange: (value: Value) => void;
  /** Why some options are locked, read with the group. */
  note?: string;
}

/** One labeled setting: a row of options, one chosen. */
export function Choice<Value extends string>({
  label,
  name,
  value,
  options,
  onChange,
  note,
}: ChoiceProps<Value>) {
  const labelId = useId();
  const noteId = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-6 items-center gap-1">
        <p id={labelId} className="text-xs font-medium text-muted-foreground">
          {label}
        </p>
        {/* Why some options are locked: a lock, its tooltip, and the group's description. */}
        {note && <LockIcon reason={note} id={noteId} />}
      </div>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        {...(name ? { "aria-label": name } : { "aria-labelledby": labelId })}
        {...(note && { "aria-describedby": noteId })}
        value={value}
        onValueChange={(next) => {
          const chosen = options.find((o) => o.value === next);
          if (chosen) onChange(chosen.value);
        }}
        className="w-full"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={`flex-1 ${SELECTED_SEGMENT}`}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
