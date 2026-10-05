"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { LocaleKey } from "@/lib/composition";
import { PANEL_MAX_TABS } from "@/lib/panel";
import {
  addAsTab,
  addToTab,
  canAddTab,
  EXTRA_OCCUPANTS,
  EXTRA_TITLES,
  type ExtraOccupant,
  occupantsIn,
  type PanelComposition,
  type PreviewOccupant,
  type PreviewTab,
  removeOccupant,
  stackProblem,
  TAB_LABEL_IDS,
  TAB_LABELS,
  type TabLabelId,
} from "./preview-panels";

interface PanelComposerProps {
  composition: PanelComposition;
  onChange: (next: PanelComposition) => void;
  /** The panel's own placeholder's title. */
  baseTitle: LocaleKey;
  /** The panel's name, to tell this composer's controls from the other's. */
  panelName: string;
}

/**
 * Preview-only. Puts more occupants in a panel: each one goes in a new tab,
 * or is stacked into an existing tab. Stacking into a tab that has no
 * label yet asks for one first.
 */
export function PanelComposer({
  composition,
  onChange,
  baseTitle,
  panelName,
}: PanelComposerProps) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState<ExtraOccupant | null>(null);
  const [stackInto, setStackInto] = useState<number | null>(null);
  const [label, setLabel] = useState<TabLabelId>("overview");

  const title = (occupant: PreviewOccupant) =>
    t(occupant === "base" ? baseTitle : EXTRA_TITLES[occupant]);
  const tabName = (tab: PreviewTab) =>
    tab.label ? t(TAB_LABELS[tab.label]) : title(tab.occupants[0] ?? "base");
  const present = occupantsIn(composition);
  const available = EXTRA_OCCUPANTS.filter((o) => !present.includes(o));

  const finish = (next: PanelComposition) => {
    onChange(next);
    setAdding(null);
    setStackInto(null);
  };
  const stack = (index: number) => {
    const tab = composition[index];
    if (!adding || !tab) return;
    // A tab of one gets a label before it can stack.
    if (!tab.label) {
      setStackInto(index);
      return;
    }
    finish(addToTab(composition, index, adding));
  };

  return (
    <div data-part="panel-composer" className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">
        {t("detail_page_preview_occupants")}
      </span>
      <ol className="flex flex-col gap-1 text-sm">
        {composition.map((tab, index) => (
          <li
            key={tab.occupants.join("+")}
            className="flex flex-wrap items-center gap-1"
          >
            <span>
              {t("detail_page_preview_tab", {
                index: index + 1,
                names: tab.occupants.map(title).join(", "),
              })}
            </span>
            {tab.occupants
              .filter((o): o is ExtraOccupant => o !== "base")
              .map((occupant) => (
                <Button
                  key={occupant}
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t("detail_page_preview_remove", {
                    name: title(occupant),
                  })}
                  onClick={() => finish(removeOccupant(composition, occupant))}
                >
                  <X />
                </Button>
              ))}
          </li>
        ))}
      </ol>

      {available.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">
            {t("detail_page_preview_add_occupant")}
          </span>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            className="w-full flex-wrap"
            value={adding ?? ""}
            onValueChange={(next) => {
              setAdding(available.find((o) => o === next) ?? null);
              setStackInto(null);
            }}
            aria-label={`${panelName}: ${t("detail_page_preview_add_occupant")}`}
          >
            {available.map((occupant) => (
              <ToggleGroupItem key={occupant} value={occupant}>
                {title(occupant)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      {adding && stackInto === null && (
        <div
          role="group"
          aria-label={`${panelName}: ${t("detail_page_preview_where")}`}
          className="flex flex-col gap-1.5"
        >
          <span className="text-xs text-muted-foreground">
            {t("detail_page_preview_where")}
          </span>
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={!canAddTab(composition)}
              onClick={() => finish(addAsTab(composition, adding))}
            >
              {t("detail_page_preview_new_tab")}
            </Button>
            {composition.map((tab, index) => (
              <Button
                key={tab.occupants.join("+")}
                variant="outline"
                size="sm"
                disabled={stackProblem(adding, tab) !== null}
                onClick={() => stack(index)}
              >
                {t("detail_page_preview_add_to_tab", { label: tabName(tab) })}
              </Button>
            ))}
          </div>
          {composition.some((tab) => stackProblem(adding, tab)) && (
            <span className="text-xs text-muted-foreground italic">
              {t("detail_page_preview_fill_alone")}
            </span>
          )}
          {!canAddTab(composition) && (
            <span className="text-xs text-muted-foreground italic">
              {t("detail_page_preview_max_tabs", { count: PANEL_MAX_TABS })}
            </span>
          )}
        </div>
      )}

      {adding && stackInto !== null && composition[stackInto] && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">
            {t("detail_page_preview_tab_label", {
              label: tabName(composition[stackInto]),
            })}
          </span>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            className="w-full"
            value={label}
            onValueChange={(next) => {
              const match = TAB_LABEL_IDS.find((id) => id === next);
              if (match) setLabel(match);
            }}
            aria-label={`${panelName}: ${t("detail_page_preview_tab_label", {
              label: tabName(composition[stackInto]),
            })}`}
          >
            {TAB_LABEL_IDS.map((id) => (
              <ToggleGroupItem key={id} value={id} className="flex-1">
                {t(TAB_LABELS[id])}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              finish(addToTab(composition, stackInto, adding, label))
            }
          >
            {t("detail_page_preview_add")}
          </Button>
        </div>
      )}
    </div>
  );
}
