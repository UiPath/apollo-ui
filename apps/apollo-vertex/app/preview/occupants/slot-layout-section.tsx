"use client";

import { type ReactNode, useId } from "react";
import { useTranslation } from "react-i18next";
import type {
  SlotStatus,
  TemplateHost,
} from "@/app/_components/template-hosts";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TemplateSpec } from "@/lib/composition";
import {
  defaultPlacement,
  type LayoutChoices,
  resolveLayout,
} from "@/lib/layout";
import { cn } from "@/lib/utils";
import { LockIcon } from "./lock-hint";
import { PageMap } from "./page-map";
import { SELECTED_SEGMENT } from "./segment";
import {
  type LayoutLock,
  layoutMenu,
  placementCopy,
  reasonCopy,
} from "./workbench-layout";

/*
 * A slot's layout as property rows: its label on the left, its control on
 * the right. Show in page and Open are switches, Open indented under it;
 * Placement is a small segmented control. Each shows only when the slot
 * declares it. A locked option shows a lock, with why, in place of its
 * control.
 */

/** The parts of a slot's layout a section shows. */
export type LayoutPart = "present" | "open" | "placement";

const ALL_PARTS: readonly LayoutPart[] = ["present", "open", "placement"];

/**
 * A switch in the workbench chrome: neutral when on, as the chrome keeps
 * teal for the selected slot; the registry Switch, recolored.
 */
const NEUTRAL_SWITCH = "data-[state=checked]:bg-foreground";

/** A layout, or null when the template's layout refuses it: no glyph then. */
function layoutOrNull(spec: TemplateSpec, choices: LayoutChoices) {
  try {
    return resolveLayout(spec, choices);
  } catch {
    return null;
  }
}

interface PropertyRowProps {
  label: string;
  /** Under another row: Open, under Show in page. */
  indent?: boolean;
  /** Dimmed, when the row above turns it off. */
  dim?: boolean;
  /** A note under the row, read with its control. */
  note?: { id: string; text: string } | null;
  children: ReactNode;
}

function PropertyRow({ label, indent, dim, note, children }: PropertyRowProps) {
  return (
    <div
      data-slot="workbench-layout-row"
      data-dim={dim ?? false}
      className={cn(
        "flex flex-col gap-1 data-[dim=true]:opacity-50",
        indent && "ms-3 border-s border-border ps-3",
      )}
    >
      <div className="flex min-h-7 items-center justify-between gap-3">
        <span className="text-sm">{label}</span>
        {children}
      </div>
      {note && (
        <p id={note.id} className="text-xs text-muted-foreground">
          {note.text}
        </p>
      )}
    </div>
  );
}

interface LockedProps {
  /** The value it's held at, in words. */
  value: string;
  reason: string;
}

/** A locked option: its value, and a lock with why, in place of its control. */
function Locked({ value, reason }: LockedProps) {
  const id = useId();
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      {value}
      <LockIcon reason={reason} id={id} />
    </span>
  );
}

interface SlotLayoutSectionProps {
  host: TemplateHost;
  slot: string;
  layout: LayoutChoices;
  onLayout: (layout: LayoutChoices) => void;
  /** Each slot after the template's rules, to say when the rule closed one. */
  status: Readonly<Record<string, SlotStatus>> | null;
  /** Which parts to show; each only when the slot declares it. */
  parts?: readonly LayoutPart[];
}

/**
 * One slot's layout choices: whether the page shows it, whether it's
 * open, and its placement, only those it declares. Left out, the slot's
 * Open and Placement dim and wait for it to be shown again.
 */
export function SlotLayoutSection({
  host,
  slot,
  layout,
  onLayout,
  status,
  parts = ALL_PARTS,
}: SlotLayoutSectionProps) {
  const { t } = useTranslation();
  const ruleId = useId();
  const section = layoutMenu(host.spec, layout).find((s) => s.slot === slot);
  if (!section) return null;
  const slotName = host.slotLabels[slot] ?? slot;
  const placementLabel = (value: string) => {
    const key = placementCopy(host.spec, value);
    return key ? t(key) : value;
  };
  const choose = (change: LayoutChoices[string]) =>
    onLayout({ ...layout, [slot]: { ...layout[slot], ...change } });
  const why = (lock: LayoutLock | null) =>
    lock === "refused" ? t(reasonCopy(host.spec, "refused")) : null;
  const choice = layout[slot] ?? {};
  const present = choice.present !== false;
  const open = choice.open !== false;
  const closedBy = status?.[slot]?.closedBy;
  const shows = (part: LayoutPart) => parts.includes(part);
  const onOff = (value: boolean) =>
    t(value ? "workbench_layout_on" : "workbench_layout_off");
  // A switch is locked when the value it would switch to is.
  const lockOf = (
    options: readonly { value: boolean; lock: LayoutLock | null }[],
    now: boolean,
  ) => why(options.find((o) => o.value !== now)?.lock ?? null);
  const presentLock = section.present ? lockOf(section.present, present) : null;
  const openLock = section.open ? lockOf(section.open, open) : null;
  const rule =
    closedBy === "rule"
      ? { id: ruleId, text: t(reasonCopy(host.spec, "rule")) }
      : null;
  const placement = choice.placement ?? defaultPlacement(host.spec, slot);
  const placementLocks = (section.placement ?? []).filter((o) => o.lock);
  return (
    <div
      data-slot="workbench-layout-slot"
      data-layout-slot={slot}
      {...(closedBy && { "data-closed-by": closedBy })}
      className="flex flex-col gap-1"
    >
      {shows("present") && section.present && (
        <PropertyRow label={t("workbench_layout_show")}>
          {presentLock ? (
            <Locked value={onOff(present)} reason={presentLock} />
          ) : (
            <Switch
              className={NEUTRAL_SWITCH}
              aria-label={t("workbench_layout_show_of", { panel: slotName })}
              checked={present}
              onCheckedChange={(next) => choose({ present: next })}
            />
          )}
        </PropertyRow>
      )}
      {shows("open") && section.open && (
        <PropertyRow
          label={t("workbench_layout_open")}
          indent={shows("present") && Boolean(section.present)}
          dim={!present}
          note={present ? rule : null}
        >
          {openLock ? (
            <Locked value={onOff(open)} reason={openLock} />
          ) : (
            <Switch
              className={NEUTRAL_SWITCH}
              aria-label={t("workbench_layout_open_of", { panel: slotName })}
              {...(rule && present && { "aria-describedby": rule.id })}
              disabled={!present}
              checked={open}
              onCheckedChange={(next) => choose({ open: next })}
            />
          )}
        </PropertyRow>
      )}
      {shows("placement") && section.placement && (
        <PropertyRow label={t("workbench_layout_placement")} dim={!present}>
          {placementLocks.length > 0 &&
          placementLocks.length >= section.placement.length - 1 ? (
            <Locked
              value={placementLabel(placement)}
              reason={why(placementLocks[0]?.lock ?? null) ?? ""}
            />
          ) : (
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              aria-label={t("workbench_layout_placement_of", {
                panel: slotName,
              })}
              disabled={!present}
              value={placement}
              onValueChange={(next) => {
                const chosen = section.placement?.find((o) => o.value === next);
                if (chosen && !chosen.lock) choose({ placement: chosen.value });
              }}
            >
              {section.placement.map((option) => (
                <Tooltip key={option.value}>
                  {/* On a wrapper: the tooltip's data-state would hide the item's. */}
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <ToggleGroupItem
                        value={option.value}
                        aria-label={placementLabel(option.value)}
                        disabled={!present || option.lock !== null}
                        className={cn(
                          // Its glyph only, until the template names its
                          // placements briefly: the full name is its name
                          // and its tooltip.
                          "h-[1.15rem] min-w-0 px-1.5 text-xs",
                          SELECTED_SEGMENT,
                        )}
                      >
                        {/* The slot's place under this option, from the template's own layout. */}
                        {(() => {
                          const glyph = layoutOrNull(host.spec, {
                            ...layout,
                            [slot]: {
                              ...choice,
                              present: true,
                              open: true,
                              placement: option.value,
                            },
                          });
                          return glyph ? (
                            <PageMap
                              compact
                              name=""
                              highlighted={[slot]}
                              layout={glyph}
                            />
                          ) : null;
                        })()}
                      </ToggleGroupItem>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {placementLabel(option.value)}
                  </TooltipContent>
                </Tooltip>
              ))}
            </ToggleGroup>
          )}
        </PropertyRow>
      )}
    </div>
  );
}
