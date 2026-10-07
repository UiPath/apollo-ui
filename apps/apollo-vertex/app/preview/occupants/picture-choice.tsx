"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";
import { useId } from "react";
import type { ResolvedLayout } from "@/lib/layout";
import { LockIcon } from "./lock-hint";
import { PageMap } from "./page-map";

/** One picture choice: its value, its words, its picture, and why it's locked, if it is. */
export interface PictureOption {
  value: string;
  label: string;
  /** The page with this option, or null when the layout can't draw it. */
  layout: ResolvedLayout | null;
  lock: string | null;
}

interface PictureChoiceProps {
  /** The group's name: "End panel: Panel". */
  name: string;
  /** The slot the pictures highlight. */
  slot: string;
  value: string;
  options: readonly PictureOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  /** A note the group is described by, such as a rule that closed it. */
  describedBy?: string | null;
}

/**
 * A layout choice as small picture cards: each a thumbnail of the page
 * with the option, drawn from the template's own layout, and its label
 * under it. A radio group: the arrow keys move between options. The one
 * chosen has a solid outline in the text's color and heavier text, no
 * accent. A locked one is off, with a lock beside it that says why.
 */
export function PictureChoice({
  name,
  slot,
  value,
  options,
  onChange,
  disabled = false,
  describedBy = null,
}: PictureChoiceProps) {
  const lockId = useId();
  return (
    <RadioGroup.Root
      aria-label={name}
      {...(describedBy && { "aria-describedby": describedBy })}
      data-slot="workbench-layout-choice"
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      orientation="horizontal"
      loop
      className="grid auto-cols-fr grid-flow-col gap-2"
    >
      {options.map((option, index) => {
        const id = `${lockId}-${index}`;
        return (
          <div key={option.value} className="relative flex">
            <RadioGroup.Item
              value={option.value}
              disabled={disabled || option.lock !== null}
              aria-label={option.label}
              {...(option.lock && { "aria-describedby": id })}
              data-slot="workbench-layout-option"
              className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md bg-muted/50 px-1 pt-1.5 pb-1 text-xs text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-transparent data-[state=checked]:font-semibold data-[state=checked]:text-foreground data-[state=checked]:outline-2 data-[state=checked]:outline-foreground data-[state=checked]:outline-solid"
            >
              {option.layout ? (
                <PageMap
                  thumbnail
                  name=""
                  highlighted={[slot]}
                  layout={option.layout}
                />
              ) : (
                <span aria-hidden="true" className="h-10 w-16" />
              )}
              <span className="max-w-full truncate">{option.label}</span>
            </RadioGroup.Item>
            {option.lock && (
              <span className="absolute -top-1.5 -right-1.5 rounded-full bg-background">
                <LockIcon reason={option.lock} id={id} />
              </span>
            )}
          </div>
        );
      })}
    </RadioGroup.Root>
  );
}
