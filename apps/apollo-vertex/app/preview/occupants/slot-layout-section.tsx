"use client";

import { type ReactNode, useId } from "react";
import { useTranslation } from "react-i18next";
import type {
  SlotStatus,
  TemplateHost,
} from "@/app/_components/template-hosts";
import type { TemplateSpec } from "@/lib/composition";
import {
  defaultPlacement,
  type LayoutChoices,
  resolveLayout,
} from "@/lib/layout";
import { PictureChoice, type PictureOption } from "./picture-choice";
import {
  type LayoutLock,
  layoutMenu,
  placementCopy,
  reasonCopy,
} from "./workbench-layout";

/*
 * A slot's layout as picture choices: Panel (open, closed, or hidden) and
 * Placement, each a row of small thumbnails of the page with that option,
 * drawn from the template's own layout. Each offers only what the slot
 * declares, and a row with one option left isn't shown.
 */

/** The parts of a slot's layout a section shows. */
export type LayoutPart = "present" | "open" | "placement";

const ALL_PARTS: readonly LayoutPart[] = ["present", "open", "placement"];

/** The panel as one setting: shown open, shown closed, or hidden. */
type PanelState = "open" | "closed" | "hidden";

/** A layout, or null when the template's layout refuses it: no picture then. */
function layoutOrNull(spec: TemplateSpec, choices: LayoutChoices) {
  try {
    return resolveLayout(spec, choices);
  } catch {
    return null;
  }
}

interface LayoutRowProps {
  label: string;
  /** Dimmed, when Hidden turns it off. */
  dim?: boolean;
  /** A note under the row, read with its group. */
  note?: { id: string; text: string } | null;
  children: ReactNode;
}

function LayoutRow({ label, dim = false, note, children }: LayoutRowProps) {
  return (
    <div
      data-slot="workbench-layout-row"
      data-dim={dim}
      className="flex flex-col gap-1.5 data-[dim=true]:opacity-50"
    >
      <span className="text-sm">{label}</span>
      {children}
      {note && (
        <p id={note.id} className="text-xs text-muted-foreground">
          {note.text}
        </p>
      )}
    </div>
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
 * One slot's layout choices, only those it declares. Hidden keeps the
 * slot's contents, and turns its Placement off until it's shown again. A
 * locked option says why: the template's layout.
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
  const why = (lock: LayoutLock | null) =>
    lock === "refused" ? t(reasonCopy(host.spec, "refused")) : null;
  const choice = layout[slot] ?? {};
  const shows = (part: LayoutPart) => parts.includes(part);
  // The page with this slot changed, for a picture.
  const pictured = (change: LayoutChoices[string]) =>
    layoutOrNull(host.spec, {
      ...layout,
      [slot]: { ...choice, ...change },
    });

  const state: PanelState =
    choice.present === false
      ? "hidden"
      : choice.open === false
        ? "closed"
        : "open";
  const lockOf = (
    options: readonly { value: boolean; lock: LayoutLock | null }[] | undefined,
    value: boolean,
  ) => why(options?.find((o) => o.value === value)?.lock ?? null);
  const panelOptions: PictureOption[] = [
    {
      value: "open",
      label: t("workbench_layout_open"),
      layout: pictured({ present: true, open: true }),
      lock: lockOf(section.open, true) ?? lockOf(section.present, true),
    },
    ...(section.open && shows("open")
      ? [
          {
            value: "closed",
            label: t("workbench_layout_closed"),
            layout: pictured({ present: true, open: false }),
            lock: lockOf(section.open, false),
          },
        ]
      : []),
    ...(section.present && shows("present")
      ? [
          {
            value: "hidden",
            label: t("workbench_layout_hidden"),
            layout: pictured({ present: false }),
            lock: lockOf(section.present, false),
          },
        ]
      : []),
  ];
  const choosePanel = (next: string) => {
    const change =
      next === "hidden"
        ? { present: false }
        : { present: true, open: next === "open" };
    onLayout({ ...layout, [slot]: { ...choice, ...change } });
  };
  const rule =
    status?.[slot]?.closedBy === "rule" && state !== "hidden"
      ? { id: ruleId, text: t(reasonCopy(host.spec, "rule")) }
      : null;

  const placement = choice.placement ?? defaultPlacement(host.spec, slot);
  const placementLabel = (value: string) => {
    const key = placementCopy(host.spec, value);
    return key ? t(key) : value;
  };
  const placementOptions: PictureOption[] = (section.placement ?? []).map(
    (option) => ({
      value: option.value,
      label: placementLabel(option.value),
      layout: pictured({ present: true, open: true, placement: option.value }),
      lock: why(option.lock),
    }),
  );
  const closedBy = status?.[slot]?.closedBy;
  return (
    <div
      data-slot="workbench-layout-slot"
      data-layout-slot={slot}
      {...(closedBy && { "data-closed-by": closedBy })}
      className="flex flex-col gap-5"
    >
      {panelOptions.length > 1 && (
        <LayoutRow label={t("workbench_layout_panel")} note={rule}>
          <PictureChoice
            name={t("workbench_layout_panel_of", { panel: slotName })}
            slot={slot}
            value={state}
            options={panelOptions}
            onChange={choosePanel}
            describedBy={rule?.id ?? null}
          />
        </LayoutRow>
      )}
      {shows("placement") && placementOptions.length > 1 && (
        <LayoutRow
          label={t("workbench_layout_placement")}
          dim={state === "hidden"}
        >
          <PictureChoice
            name={t("workbench_layout_placement_of", { panel: slotName })}
            slot={slot}
            value={placement}
            options={placementOptions}
            onChange={(next) =>
              onLayout({ ...layout, [slot]: { ...choice, placement: next } })
            }
            disabled={state === "hidden"}
          />
        </LayoutRow>
      )}
    </div>
  );
}
