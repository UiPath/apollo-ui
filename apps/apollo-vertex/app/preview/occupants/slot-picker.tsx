"use client";

import { useTranslation } from "react-i18next";
import type { TemplateHost } from "@/app/_components/template-hosts";
import { Button } from "@/components/ui/button";
import { specFor } from "@/lib/occupant-lookup";
import { surfaceLabel } from "@/lib/surface-labels";
import type { SlotContents } from "./workbench-compose";
import { type LeftOut, type PickTarget, picker } from "./workbench-picker";

interface SlotPickerProps {
  host: TemplateHost;
  contents: SlotContents;
  slot: string;
  /** Where the chosen occupant goes. */
  to: PickTarget;
  /** What the group is called: what picking does. */
  label: string;
  onPick: (occupant: string) => void;
}

/**
 * The occupants that can go in one place in a slot, one click each: only
 * those that fit and aren't on the page. The rest are one line per reason.
 */
export function SlotPicker({
  host,
  contents,
  slot,
  to,
  label,
  onPick,
}: SlotPickerProps) {
  const { t } = useTranslation();
  const { choices, left } = picker(host, contents, slot, to);
  const surface = host.spec.slots.find((s) => s.name === slot)?.surfaces[0];
  const surfaceName = surface ? surfaceLabel(surface).toLowerCase() : slot;
  const leftOutCopy = (reason: LeftOut, count: number) => {
    if (reason === "on-page")
      return t("workbench_picker_left_on_page", { count });
    if (reason === "no-fit")
      return t("workbench_picker_left_no_fit", { count, surface: surfaceName });
    return t("workbench_picker_left_fill", { count });
  };
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="workbench-picker"
      className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/40 p-2"
    >
      {choices.length > 0 ? (
        choices.map((name) => (
          <Button
            key={name}
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => onPick(name)}
          >
            {specFor(name)?.label ?? name}
          </Button>
        ))
      ) : (
        <p className="px-2 py-1 text-xs">{t("workbench_picker_none")}</p>
      )}
      {left.map(({ reason, count }) => (
        <p
          key={reason}
          data-slot="workbench-picker-left-out"
          data-reason={reason}
          className="px-2 text-xs text-muted-foreground"
        >
          {leftOutCopy(reason, count)}
        </p>
      ))}
    </div>
  );
}
