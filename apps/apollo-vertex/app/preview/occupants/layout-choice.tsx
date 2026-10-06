"use client";

import { Lock } from "lucide-react";
import { useId } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
      <p id={labelId} className="text-xs font-medium text-muted-foreground">
        {label}
      </p>
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
            // The toggle's own selected fill is too faint to read here,
            // and a locked choice dims it further: the chosen one is filled.
            className="flex-1 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {note && (
        <p
          id={noteId}
          data-slot="workbench-layout-note"
          className="flex items-start gap-1.5 text-xs text-muted-foreground"
        >
          <Lock aria-hidden className="mt-0.5 size-3 shrink-0" />
          {note}
        </p>
      )}
    </div>
  );
}
