"use client";

import { ChevronDown, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { LocaleKey } from "@/lib/composition";
import type { OccupantRef, TabSpec } from "@/lib/panel";
import { LockableButton } from "./lock-hint";
import { SELECTED_SEGMENT } from "./segment";
import { TAB_LABELS } from "./workbench-compose";
import type { PickTarget } from "./workbench-picker";

const refName = (ref: OccupantRef) =>
  typeof ref === "string" ? ref : ref.occupant;

const LABELS: readonly LocaleKey[] = TAB_LABELS.map((l) => l.key);

interface SlotTabRowsProps {
  tabs: readonly TabSpec[];
  /** Why each tab takes no more, by index, or null. */
  locks: readonly (string | null)[];
  /** Where the picker is open, if anywhere. */
  picking: PickTarget | null;
  /** The tab whose label is being picked, if any. */
  labeling: number | null;
  /** An occupant's name, renamable, as the page shows it. */
  nameField: (occupant: string, stacked: boolean) => ReactNode;
  /** A stack's label, renamable, as the page shows it. */
  labelField: (index: number, tab: TabSpec) => ReactNode;
  /** An occupant's row, with its actions, and what to show as its name. */
  row: (occupant: string, actions: ReactNode, label?: ReactNode) => ReactNode;
  removeButton: (occupant: string) => ReactNode;
  /** The picker for a place, when it's open there. */
  picker: (to: PickTarget) => ReactNode;
  onAdd: (index: number) => void;
  onLabel: (index: number) => void;
  onRelabel: (index: number, label: LocaleKey) => void;
}

/**
 * A panel's tabs as rows, with light dividers between them. A tab of one
 * occupant is one row: its name, × or a lock, and "+", which adds to that
 * tab. A stack's row is its label, with its presets beside it, and "+",
 * with its occupants as rows under it. Names and labels rename in place,
 * for this preview. The picker opens under the row it's for.
 */
export function SlotTabRows({
  tabs,
  locks,
  picking,
  labeling,
  nameField,
  labelField,
  row,
  removeButton,
  picker,
  onAdd,
  onLabel,
  onRelabel,
}: SlotTabRowsProps) {
  const { t } = useTranslation();
  return (
    <ul
      data-slot="workbench-contents-tabs"
      className="flex flex-col divide-y divide-border"
    >
      {tabs.map((tab, index) => {
        const stacked = tab.occupants.length > 1;
        const [first] = tab.occupants;
        const add = (
          <LockableButton
            variant="ghost"
            size="icon-xs"
            reason={locks[index] ?? null}
            hint={t("workbench_contents_add_to_tab")}
            aria-label={t("workbench_contents_add_to_tab")}
            aria-expanded={picking === index}
            onClick={() => onAdd(index)}
          >
            {locks[index] ? null : <Plus />}
          </LockableButton>
        );
        return (
          <li
            key={tab.id}
            data-slot="workbench-contents-tab"
            data-tab={tab.id}
            className="flex flex-col gap-1 py-1.5"
          >
            {stacked && tab.label ? (
              <>
                <div className="flex items-center gap-1">
                  <div
                    data-slot="workbench-contents-tab-name"
                    className="flex min-w-0 flex-1 items-center gap-0.5 text-xs font-medium"
                  >
                    {labelField(index, tab)}
                    {/* The presets, beside the label you can rename. */}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      data-slot="workbench-contents-label-presets"
                      data-label-tab={index}
                      aria-expanded={labeling === index}
                      aria-label={t("workbench_contents_change_label", {
                        index: index + 1,
                        label: t(tab.label),
                      })}
                      onClick={() => onLabel(index)}
                    >
                      <ChevronDown aria-hidden />
                    </Button>
                  </div>
                  {add}
                </div>
                {labeling === index && (
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    className="w-full flex-wrap"
                    aria-label={t("workbench_contents_labels", {
                      index: index + 1,
                    })}
                    value={tab.label}
                    onValueChange={(next) => {
                      const chosen = LABELS.find((key) => key === next);
                      if (chosen) onRelabel(index, chosen);
                    }}
                  >
                    {LABELS.map((key) => (
                      <ToggleGroupItem
                        key={key}
                        value={key}
                        className={SELECTED_SEGMENT}
                      >
                        {t(key)}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                )}
                <ul className="flex flex-col ps-4">
                  {tab.occupants.map((ref) => {
                    const occupant = refName(ref);
                    return (
                      <li key={occupant} className="flex">
                        {row(
                          occupant,
                          removeButton(occupant),
                          nameField(occupant, true),
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              first && (
                <div className="flex items-center gap-1">
                  {/* One row: the tab's name as the page shows it, for its one occupant. */}
                  {row(
                    refName(first),
                    removeButton(refName(first)),
                    nameField(refName(first), false),
                  )}
                  {add}
                </div>
              )
            )}
            {picker(index)}
          </li>
        );
      })}
    </ul>
  );
}
