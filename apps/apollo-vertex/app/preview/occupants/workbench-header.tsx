"use client";

import {
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Sun,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TEMPLATE_HOSTS } from "@/app/_components/template-hosts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OCCUPANT_STATES, type OccupantState } from "@/components/ui/occupant";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EXAMPLE_ROLES, type ExampleRole } from "@/lib/occupant-entry";
import {
  TEMPLATE_NAMES,
  type WorkbenchMode,
  type WorkbenchTheme,
} from "./workbench-url-state";

interface Choice<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** A labeled, single-choice toggle group: the roomy form. */
function ToggleChoice<T extends string>({
  label,
  value,
  options,
  onChange,
}: Choice<T>) {
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
          <ToggleGroupItem key={option.value} value={option.value}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

/** The same choice as a select: the compact form. */
function SelectChoice<T extends string>({
  label,
  value,
  options,
  onChange,
}: Choice<T>) {
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

interface WorkbenchHeaderProps {
  label: string;
  listId: string;
  listOpen: boolean;
  onToggleList: () => void;
  detailsId: string;
  detailsOpen: boolean;
  onToggleDetails: () => void;
  sample: ExampleRole;
  onSample: (sample: ExampleRole) => void;
  state: OccupantState;
  onState: (state: OccupantState) => void;
  theme: WorkbenchTheme;
  onTheme: (theme: WorkbenchTheme) => void;
  mode: WorkbenchMode;
  onMode: (mode: WorkbenchMode) => void;
  template: string;
  onTemplate: (template: string) => void;
}

/**
 * One row at every width: the list toggle, the occupant, Sample and State,
 * the theme, and the details toggle. Sample and State are toggle groups
 * when they fit beside the full occupant label, and compact selects when
 * they don't; the label truncates before anything wraps.
 */
export function WorkbenchHeader(props: WorkbenchHeaderProps) {
  const { t } = useTranslation();
  const sample: Choice<ExampleRole> = {
    label: t("workbench_sample"),
    value: props.sample,
    options: EXAMPLE_ROLES.map((role) => ({
      value: role,
      label: t(`workbench_sample_${role}`),
    })),
    onChange: props.onSample,
  };
  const state: Choice<OccupantState> = {
    label: t("workbench_state"),
    value: props.state,
    options: OCCUPANT_STATES.map((s) => ({
      value: s,
      label: t(`workbench_state_${s}`),
    })),
    onChange: props.onState,
  };

  // Compact when the toggle groups, measured out of sight, don't fit.
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const sizerRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const header = headerRef.current;
    const title = titleRef.current;
    const sizer = sizerRef.current;
    if (!header || !title || !sizer) return;
    const measure = () => {
      const style = getComputedStyle(header);
      const gap = Number.parseFloat(style.columnGap) || 0;
      const items = [...header.children].filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement && child !== sizer,
      );
      const others = items
        .filter((el) => el !== title && el !== controlsRef.current)
        .reduce((sum, el) => sum + el.offsetWidth, 0);
      // The title's full width: the label untruncated, and its badge.
      const titleGap =
        Number.parseFloat(getComputedStyle(title).columnGap) || 0;
      const titleWidth =
        [...title.children].reduce((sum, el) => sum + el.scrollWidth, 0) +
        titleGap * (title.children.length - 1);
      const needed =
        others +
        titleWidth +
        sizer.scrollWidth +
        gap * (items.length - 1) +
        Number.parseFloat(style.paddingLeft) +
        Number.parseFloat(style.paddingRight);
      setCompact(needed > header.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    observer.observe(sizer);
    return () => observer.disconnect();
  }, []);

  const dark = props.theme === "dark";
  return (
    <div
      ref={headerRef}
      data-workbench-header
      data-compact={compact}
      className="relative flex items-center gap-3 border-b border-border px-3 py-2"
    >
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        aria-label={t(
          props.listOpen ? "workbench_hide_list" : "workbench_show_list",
        )}
        aria-expanded={props.listOpen}
        aria-controls={props.listId}
        onClick={props.onToggleList}
      >
        {props.listOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
      </Button>
      <div ref={titleRef} className="flex min-w-0 flex-1 items-center gap-2">
        <h2 className="truncate text-base font-semibold" title={props.label}>
          {props.label}
        </h2>
        <Badge variant="secondary" className="shrink-0">
          {t("workbench_occupant")}
        </Badge>
      </div>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        className="shrink-0"
        aria-label={t("workbench_view")}
        value={props.mode}
        onValueChange={(next) => {
          if (next === "surface" || next === "template") props.onMode(next);
        }}
      >
        <ToggleGroupItem value="surface">
          {t("workbench_view_surface")}
        </ToggleGroupItem>
        <ToggleGroupItem value="template">
          {t("workbench_view_template")}
        </ToggleGroupItem>
      </ToggleGroup>
      {/* Only with a choice to make: one template needs no picker. */}
      {props.mode === "template" && TEMPLATE_NAMES.length > 1 && (
        <SelectChoice
          label={t("workbench_template")}
          value={props.template}
          options={TEMPLATE_NAMES.map((name) => ({
            value: name,
            label: TEMPLATE_HOSTS[name]?.label ?? name,
          }))}
          onChange={props.onTemplate}
        />
      )}
      <div ref={controlsRef} className="flex shrink-0 items-center gap-4">
        {compact ? (
          <>
            <SelectChoice {...sample} />
            <SelectChoice {...state} />
          </>
        ) : (
          <>
            <ToggleChoice {...sample} />
            <ToggleChoice {...state} />
          </>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        aria-label={t("workbench_dark_theme")}
        aria-pressed={dark}
        onClick={() => props.onTheme(dark ? "light" : "dark")}
      >
        {dark ? <Moon /> : <Sun />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        aria-label={t(
          props.detailsOpen
            ? "workbench_hide_details"
            : "workbench_show_details",
        )}
        aria-expanded={props.detailsOpen}
        aria-controls={props.detailsId}
        onClick={props.onToggleDetails}
      >
        {props.detailsOpen ? <PanelRightClose /> : <PanelRightOpen />}
      </Button>
      {/* The toggle groups' width, measured out of sight. */}
      <div
        ref={sizerRef}
        aria-hidden="true"
        inert
        className="invisible absolute top-0 start-0 flex items-center gap-4 whitespace-nowrap"
      >
        <ToggleChoice {...sample} />
        <ToggleChoice {...state} />
      </div>
    </div>
  );
}
