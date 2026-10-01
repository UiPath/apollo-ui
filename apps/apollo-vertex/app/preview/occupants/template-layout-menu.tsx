"use client";

import { LayoutPanelLeft, Lock } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import {
  type PanelStatus,
  panelSide,
  type TemplateHost,
  type TemplateLayout,
} from "@/app/_components/template-hosts";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  type DetailPagePanels,
  enabledPanels,
  type PanelPlacement,
  type PanelSide,
} from "@/templates/detail-page/detail-page.template";
import type { PreviewShellVariant } from "@/templates/shell/PreviewShell";

const SHELLS: readonly PreviewShellVariant[] = ["sidebar", "minimal"];
const PLACEMENTS: readonly PanelPlacement[] = ["below-header", "beside-header"];
const SIDES: readonly PanelSide[] = ["start", "end"];

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
function Choice<Value extends string>({
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
            className="flex-1"
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

interface TemplateLayoutMenuProps {
  host: TemplateHost;
  /** The slot holding the occupant: its panel can't be removed or closed. */
  slot: string;
  shell: PreviewShellVariant;
  onShell: (shell: PreviewShellVariant) => void;
  layout: TemplateLayout;
  onLayout: (layout: TemplateLayout) => void;
  /** Each panel after the template's rules, to say when the rule closed one. */
  status: Record<PanelSide, PanelStatus> | null;
}

/**
 * The template's configuration, in a popover so the dock doesn't grow: the
 * shell, which panels it has, and each panel's open state and placement.
 */
export function TemplateLayoutMenu({
  host,
  slot,
  shell,
  onShell,
  layout,
  onLayout,
  status,
}: TemplateLayoutMenuProps) {
  const { t } = useTranslation();
  const own = panelSide(host, slot);
  const present = enabledPanels(layout.panels);
  const panelName = (side: PanelSide) =>
    host.slotLabels[host.panels[side]] ?? side;
  const locked =
    own &&
    t("workbench_layout_locked", { panel: panelName(own).toLowerCase() });
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" data-slot="workbench-layout">
          <LayoutPanelLeft aria-hidden />
          {t("workbench_layout")}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="flex w-80 flex-col gap-4"
        data-slot="workbench-layout-menu"
      >
        <Choice
          label={t("workbench_shell")}
          value={shell}
          onChange={onShell}
          options={SHELLS.map((value) => ({
            value,
            label: t(`workbench_shell_${value}`),
          }))}
        />
        <Choice<DetailPagePanels>
          label={t("workbench_panels")}
          value={layout.panels}
          onChange={(panels) => onLayout({ ...layout, panels })}
          options={host.panelSets.map((value) => ({
            value,
            label: t(`workbench_panels_${value}`),
            // A setting without the occupant's panel would remove its slot.
            disabled: own !== null && !enabledPanels(value)[own],
          }))}
          {...(locked && { note: locked })}
        />
        {SIDES.filter((side) => present[side]).map((side) => {
          const closedBy = status?.[side]?.closedBy;
          const closedByRule = closedBy === "rule";
          const note =
            side === own
              ? t("workbench_layout_locked_open")
              : closedByRule
                ? t("workbench_layout_closed_by_rule")
                : null;
          return (
            <fieldset
              key={side}
              data-slot="workbench-layout-panel"
              data-side={side}
              {...(closedBy && { "data-closed-by": closedBy })}
              className="flex flex-col gap-3 border-t border-border pt-3"
            >
              <legend className="float-left mb-3 w-full text-sm font-medium">
                {panelName(side)}
              </legend>
              <Choice
                label={t("workbench_layout_state")}
                name={t("workbench_layout_state_of", {
                  panel: panelName(side),
                })}
                value={layout[side].open ? "open" : "closed"}
                onChange={(next) =>
                  onLayout({
                    ...layout,
                    [side]: { ...layout[side], open: next === "open" },
                  })
                }
                options={(["open", "closed"] as const).map((value) => ({
                  value,
                  label: t(`workbench_layout_${value}`),
                  disabled: side === own,
                }))}
                {...(note && { note })}
              />
              <Choice
                label={t("workbench_layout_placement")}
                name={t("workbench_layout_placement_of", {
                  panel: panelName(side),
                })}
                value={layout[side].placement}
                onChange={(placement) =>
                  onLayout({
                    ...layout,
                    [side]: { ...layout[side], placement },
                  })
                }
                options={PLACEMENTS.map((value) => ({
                  value,
                  label: t(`workbench_placement_${value}`),
                }))}
              />
            </fieldset>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
