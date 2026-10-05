"use client";

import { LayoutPanelLeft, Lock } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import type {
  SlotStatus,
  TemplateHost,
} from "@/app/_components/template-hosts";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { defaultPlacement, type LayoutChoices } from "@/lib/layout";
import type { PreviewShellVariant } from "@/templates/shell/PreviewShell";
import { type LayoutLock, layoutMenu } from "./workbench-layout";

const SHELLS: readonly PreviewShellVariant[] = ["sidebar", "minimal"];

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
  /** The slot holding the occupant: the focus rule keeps it there and open. */
  slot: string;
  shell: PreviewShellVariant;
  onShell: (shell: PreviewShellVariant) => void;
  layout: LayoutChoices;
  onLayout: (layout: LayoutChoices) => void;
  /** Each slot after the template's rules, to say when the rule closed one. */
  status: Readonly<Record<string, SlotStatus>> | null;
}

/** The first lock among a control's options: what its note explains. */
const firstLock = (options: readonly { lock: LayoutLock | null }[] = []) =>
  options.find((o) => o.lock)?.lock ?? null;

/** "true" and "false", for boolean options in a toggle group. */
const asText = (value: boolean) => (value ? "true" : "false");

/**
 * The template's configuration, in a popover so the dock doesn't grow: the
 * shell, then a section for each slot that declares choices, offering only
 * those. Locked options say why: the focus rule, or the template's layout.
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
  const { t, i18n } = useTranslation();
  const slotName = (name: string) => host.slotLabels[name] ?? name;
  const placementLabel = (value: string) => {
    const key = `workbench_placement_${value}`;
    return i18n.exists(key) ? t(key) : value;
  };
  const choose = (name: string, change: LayoutChoices[string]) =>
    onLayout({ ...layout, [name]: { ...layout[name], ...change } });
  const lockNote = (name: string, lock: LayoutLock | null, open = false) =>
    lock === "focus"
      ? open
        ? t("workbench_layout_locked_open")
        : t("workbench_layout_locked", { panel: slotName(name).toLowerCase() })
      : lock === "refused"
        ? t("workbench_layout_refused")
        : null;

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
        {layoutMenu(host.spec, layout, slot).map((section) => {
          const name = section.slot;
          const choice = layout[name] ?? {};
          const present = choice.present !== false;
          const closedBy = status?.[name]?.closedBy;
          const presenceNote = lockNote(name, firstLock(section.present));
          const stateNote =
            lockNote(name, firstLock(section.open), true) ??
            (closedBy === "rule" ? t("workbench_layout_closed_by_rule") : null);
          const placementNote = lockNote(name, firstLock(section.placement));
          return (
            <fieldset
              key={name}
              data-slot="workbench-layout-slot"
              data-layout-slot={name}
              {...(closedBy && { "data-closed-by": closedBy })}
              className="flex flex-col gap-3 border-t border-border pt-3"
            >
              <legend className="float-left mb-3 w-full text-sm font-medium">
                {slotName(name)}
              </legend>
              {section.present && (
                <Choice
                  label={t("workbench_layout_presence")}
                  name={t("workbench_layout_presence_of", {
                    panel: slotName(name),
                  })}
                  value={asText(present)}
                  onChange={(next) =>
                    choose(name, { present: next === "true" })
                  }
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
              {present && section.open && (
                <Choice
                  label={t("workbench_layout_state")}
                  name={t("workbench_layout_state_of", {
                    panel: slotName(name),
                  })}
                  value={choice.open === false ? "closed" : "open"}
                  onChange={(next) => choose(name, { open: next === "open" })}
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
              {present && section.placement && (
                <Choice
                  label={t("workbench_layout_placement")}
                  name={t("workbench_layout_placement_of", {
                    panel: slotName(name),
                  })}
                  value={choice.placement ?? defaultPlacement(host.spec, name)}
                  onChange={(placement) => choose(name, { placement })}
                  options={section.placement.map((option) => ({
                    value: option.value,
                    label: placementLabel(option.value),
                    disabled: option.lock !== null,
                  }))}
                  {...(placementNote && { note: placementNote })}
                />
              )}
            </fieldset>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
