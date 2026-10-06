"use client";

import { useTranslation } from "react-i18next";
import type {
  SlotStatus,
  TemplateHost,
} from "@/app/_components/template-hosts";
import { defaultPlacement, type LayoutChoices } from "@/lib/layout";
import { Choice } from "./layout-choice";
import {
  type LayoutLock,
  layoutMenu,
  placementCopy,
  reasonCopy,
} from "./workbench-layout";

/** The parts of a slot's layout a section shows. */
export type LayoutPart = "present" | "open" | "placement";

const ALL_PARTS: readonly LayoutPart[] = ["present", "open", "placement"];

/** The first lock among a control's options: what its note explains. */
const firstLock = (options: readonly { lock: LayoutLock | null }[] = []) =>
  options.find((o) => o.lock)?.lock ?? null;

/** "true" and "false", for boolean options in a toggle group. */
const asText = (value: boolean) => (value ? "true" : "false");

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
 * One slot's layout choices: in the page, its state, and its placement,
 * only those it declares. A locked option says why: the template's layout.
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
  const section = layoutMenu(host.spec, layout).find((s) => s.slot === slot);
  if (!section) return null;
  const slotName = host.slotLabels[slot] ?? slot;
  // The template's own name for a placement, else the placement's name.
  const placementLabel = (value: string) => {
    const key = placementCopy(host.spec, value);
    return key ? t(key) : value;
  };
  const choose = (change: LayoutChoices[string]) =>
    onLayout({ ...layout, [slot]: { ...layout[slot], ...change } });
  const lockNote = (lock: LayoutLock | null) =>
    lock === "refused" ? t(reasonCopy(host.spec, "refused")) : null;
  const choice = layout[slot] ?? {};
  const present = choice.present !== false;
  const closedBy = status?.[slot]?.closedBy;
  const presenceNote = lockNote(firstLock(section.present));
  const stateNote =
    lockNote(firstLock(section.open)) ??
    (closedBy === "rule" ? t(reasonCopy(host.spec, "rule")) : null);
  const placementNote = lockNote(firstLock(section.placement));
  const shows = (part: LayoutPart) => parts.includes(part);
  return (
    <div
      data-slot="workbench-layout-slot"
      data-layout-slot={slot}
      {...(closedBy && { "data-closed-by": closedBy })}
      className="flex flex-col gap-3"
    >
      {shows("present") && section.present && (
        <Choice
          label={t("workbench_layout_presence")}
          name={t("workbench_layout_presence_of", { panel: slotName })}
          value={asText(present)}
          onChange={(next) => choose({ present: next === "true" })}
          options={section.present.map((option) => ({
            value: asText(option.value),
            label: option.value
              ? t("workbench_layout_included")
              : t("workbench_layout_left_out"),
            disabled: option.lock !== null,
          }))}
          {...(presenceNote && { note: presenceNote })}
        />
      )}
      {present && shows("open") && section.open && (
        <Choice
          label={t("workbench_layout_state")}
          name={t("workbench_layout_state_of", { panel: slotName })}
          value={choice.open === false ? "closed" : "open"}
          onChange={(next) => choose({ open: next === "open" })}
          options={section.open.map((option) => ({
            value: option.value ? "open" : "closed",
            label: option.value
              ? t("workbench_layout_open")
              : t("workbench_layout_closed"),
            disabled: option.lock !== null,
          }))}
          {...(stateNote && { note: stateNote })}
        />
      )}
      {present && shows("placement") && section.placement && (
        <Choice
          label={t("workbench_layout_placement")}
          name={t("workbench_layout_placement_of", { panel: slotName })}
          value={choice.placement ?? defaultPlacement(host.spec, slot)}
          onChange={(placement) => choose({ placement })}
          options={section.placement.map((option) => ({
            value: option.value,
            label: placementLabel(option.value),
            disabled: option.lock !== null,
          }))}
          {...(placementNote && { note: placementNote })}
        />
      )}
    </div>
  );
}
