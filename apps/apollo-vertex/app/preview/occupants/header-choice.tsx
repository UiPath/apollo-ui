"use client";

import { useId } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SELECTED_SEGMENT } from "./segment";

/*
 * The header's labeled single choices, Sample and State: toggle groups
 * when there's room, compact selects when there isn't.
 */

export interface ChoiceProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** A labeled, single-choice toggle group: the roomy form. */
export function ToggleChoice<T extends string>({
  label,
  value,
  options,
  onChange,
}: ChoiceProps<T>) {
  const id = useId();
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span id={id} className="text-xs text-muted-foreground">
        {label}
      </span>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        aria-labelledby={id}
        value={value}
        onValueChange={(next) => {
          const option = options.find((o) => o.value === next);
          if (option) onChange(option.value);
        }}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className={SELECTED_SEGMENT}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

/** The same choice as a select: the compact form. */
export function SelectChoice<T extends string>({
  label,
  value,
  options,
  onChange,
}: ChoiceProps<T>) {
  const id = useId();
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span id={id} className="text-xs text-muted-foreground">
        {label}
      </span>
      <Select
        value={value}
        onValueChange={(next) => {
          const option = options.find((o) => o.value === next);
          if (option) onChange(option.value);
        }}
      >
        <SelectTrigger size="sm" aria-labelledby={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
