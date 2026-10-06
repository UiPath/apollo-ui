"use client";

import {
  ArrowLeft,
  LayoutTemplate,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Square,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { TEMPLATE_HOSTS } from "@/app/_components/template-hosts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OCCUPANT_STATES, type OccupantState } from "@/components/ui/occupant";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EXAMPLE_ROLES, type ExampleRole } from "@/lib/occupant-entry";
import { type ChoiceProps, SelectChoice } from "./header-choice";
import { ModeToggle } from "./mode-toggle";
import { INVERTED_SEGMENT } from "./segment";
import { SegmentLabel } from "./segment-label";
import { useTitleFit } from "./use-title-fit";
import {
  templateNames,
  type WorkbenchMode,
  type WorkbenchTheme,
} from "./workbench-url-state";

interface WorkbenchHeaderProps {
  label: string;
  /** Where "Back to docs" goes. */
  docsHref: string;
  listId: string;
  listOpen: boolean;
  onToggleList: () => void;
  /** What the right-hand column holds in this view, which its toggle names. */
  panel: "details" | "inspector";
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
  /** The template view's Edit mode, and switching it. */
  editing: boolean;
  onEditing: (editing: boolean) => void;
  /** Edit mode's Reset layout: every slot back to the template's defaults. */
  onReset: () => void;
}

/**
 * The workbench's top bar, across the whole window, in three parts: at
 * the start, the list toggle, Back to docs, and the title with its badge;
 * the view switch on the window's center; at the end, the view's controls
 * (Sample and State as selects, or Preview | Edit and Reset), then the
 * theme and panel toggles at the edge. Short of room, the title
 * truncates, then its badge goes; nothing reaches the switch.
 */
export function WorkbenchHeader({
  label,
  docsHref,
  listId,
  listOpen,
  onToggleList,
  panel,
  detailsId,
  detailsOpen,
  onToggleDetails,
  sample,
  onSample,
  state,
  onState,
  theme,
  onTheme,
  mode,
  onMode,
  template,
  onTemplate,
  editing,
  onEditing,
  onReset,
}: WorkbenchHeaderProps) {
  const { t } = useTranslation();
  const sampleChoice: ChoiceProps<ExampleRole> = {
    label: t("workbench_sample"),
    value: sample,
    options: EXAMPLE_ROLES.map((role) => ({
      value: role,
      label: t(`workbench_sample_${role}`),
    })),
    onChange: onSample,
  };
  const stateChoice: ChoiceProps<OccupantState> = {
    label: t("workbench_state"),
    value: state,
    options: OCCUPANT_STATES.map((s) => ({
      value: s,
      label: t(`workbench_state_${s}`),
    })),
    onChange: onState,
  };

  // Short of room, the title truncates first, then the badge goes.
  const titleRowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const badgeFits = useTitleFit(
    titleRowRef,
    titleRef,
    badgeRef,
    `${label}:${mode}`,
  );

  const dark = theme === "dark";
  return (
    <div
      data-slot="workbench-header"
      // Three columns, the outer two equal: the switch sits on the header's
      // own center, and neither side can move it or reach it.
      className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-b border-border px-3 py-2"
    >
      <div
        data-slot="workbench-header-start"
        className="flex min-w-0 items-center gap-3"
      >
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label={t(
            listOpen ? "workbench_hide_list" : "workbench_show_list",
          )}
          aria-expanded={listOpen}
          aria-controls={listId}
          onClick={onToggleList}
        >
          {listOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="icon" className="shrink-0">
              <Link
                href={docsHref}
                data-slot="workbench-back"
                aria-label={t("workbench_back_to_docs")}
              >
                <ArrowLeft aria-hidden />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("workbench_back_to_docs")}</TooltipContent>
        </Tooltip>
        {/*
          It gives way first: the title truncates, its full text in a
          tooltip, then the badge goes, when the title's room is short.
        */}
        <div
          ref={titleRowRef}
          className="relative flex min-w-0 flex-1 items-center gap-2"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <h2 ref={titleRef} className="truncate text-base font-semibold">
                {label}
              </h2>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
          <Badge
            ref={badgeRef}
            variant="secondary"
            data-slot="workbench-header-badge"
            data-hidden={!badgeFits}
            // Hidden, it's out of the flow but still measured.
            className="shrink-0 data-[hidden=true]:invisible data-[hidden=true]:absolute"
          >
            {t(
              mode === "template" ? "workbench_template" : "workbench_occupant",
            )}
          </Badge>
        </div>
      </div>
      {/* The view switch: the one inverted control, on the header's center. */}
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        data-slot="workbench-view-switch"
        aria-label={t("workbench_view")}
        value={mode}
        onValueChange={(next) => {
          if (next === "surface" || next === "template") onMode(next);
        }}
      >
        <ToggleGroupItem value="surface" className={INVERTED_SEGMENT}>
          <Square aria-hidden />
          <SegmentLabel>{t("workbench_view_surface")}</SegmentLabel>
        </ToggleGroupItem>
        <ToggleGroupItem value="template" className={INVERTED_SEGMENT}>
          <LayoutTemplate aria-hidden />
          <SegmentLabel>{t("workbench_view_template")}</SegmentLabel>
        </ToggleGroupItem>
      </ToggleGroup>
      {/*
        The view's own controls, then the theme and panel toggles at the
        edge. Out of room, it clips from its start, never over the switch,
        and the toggles at the edge stay.
      */}
      <div
        data-slot="workbench-header-end"
        className="flex min-w-0 items-center justify-end gap-3 overflow-hidden"
      >
        <div
          key={mode}
          data-slot="workbench-header-zone"
          className="flex shrink-0 items-center gap-4 animate-in fade-in duration-(--panel-transition-duration) ease-(--panel-transition-easing) motion-reduce:animate-none"
        >
          {mode === "surface" && (
            // Sample and State are one occupant's: the surface view's only.
            <>
              <SelectChoice {...sampleChoice} />
              <SelectChoice {...stateChoice} />
            </>
          )}
          {mode === "template" && (
            <>
              {/* Only with a choice to make: one template needs no picker. */}
              {templateNames().length > 1 && (
                <SelectChoice
                  label={t("workbench_template")}
                  value={template}
                  options={templateNames().map((name) => ({
                    value: name,
                    label: TEMPLATE_HOSTS[name]?.label ?? name,
                  }))}
                  onChange={onTemplate}
                />
              )}
              <div className="flex items-center gap-1">
                <ModeToggle editing={editing} onEditing={onEditing} />
                {/* Edit's only, but its room is kept, so Preview | Edit stays put. */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      data-slot="workbench-reset"
                      data-shown={editing}
                      aria-label={t("workbench_reset_layout")}
                      onClick={onReset}
                      className="shrink-0 transition-[opacity,visibility] duration-(--panel-transition-duration) ease-(--panel-transition-easing) motion-reduce:transition-none data-[shown=false]:invisible data-[shown=false]:opacity-0"
                    >
                      <RotateCcw aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("workbench_reset_layout")}</TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label={t("workbench_dark_theme")}
          aria-pressed={dark}
          onClick={() => onTheme(dark ? "light" : "dark")}
        >
          {dark ? <Moon /> : <Sun />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label={t(
            panel === "inspector"
              ? detailsOpen
                ? "workbench_hide_inspector"
                : "workbench_show_inspector"
              : detailsOpen
                ? "workbench_hide_details"
                : "workbench_show_details",
          )}
          aria-expanded={detailsOpen}
          aria-controls={detailsId}
          onClick={onToggleDetails}
        >
          {detailsOpen ? <PanelRightClose /> : <PanelRightOpen />}
        </Button>
      </div>
    </div>
  );
}
