"use client";

import { ChevronDown, Lock, Plus, X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TemplateHost } from "@/app/_components/template-hosts";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { LocaleKey } from "@/lib/composition";
import { specFor } from "@/lib/occupant-lookup";
import type { OccupantRef, TabSpec } from "@/lib/panel";
import { Locked } from "./locked";
import { SlotPicker } from "./slot-picker";
import {
  addOccupant,
  type ComposeLock,
  holdsPanel,
  occupantsIn,
  removeFromSlot,
  type SlotContents,
  TAB_LABELS,
} from "./workbench-compose";
import { reasonCopy } from "./workbench-layout";
import {
  firstUnusedLabel,
  type PickTarget,
  panelLocks,
  relabel,
  replaceIn,
} from "./workbench-picker";

const refName = (ref: OccupantRef) =>
  typeof ref === "string" ? ref : ref.occupant;

/** Where focus goes once the contents change: a row, a tab's label, or the picker. */
type FocusTo = { row: string } | { label: number } | { picker: true };

interface SlotContentsSectionProps {
  host: TemplateHost;
  slot: string;
  contents: SlotContents;
  /** The focused occupant: it stays where it is. */
  focus: string;
  onContents: (contents: SlotContents) => void;
}

/**
 * A slot's contents, as the slot holds them. A panel slot lists its tabs,
 * each with its occupants and "Add to this tab", then "New tab": which
 * one you press decides tab or stack. A slot that holds one shows its
 * occupant, with Replace and Clear, or the picker when it's empty. Only
 * the real limits lock a button: a fill occupant's tab, and the tab cap.
 */
export function SlotContentsSection({
  host,
  slot,
  contents,
  focus,
  onContents,
}: SlotContentsSectionProps) {
  const { t } = useTranslation();
  const [picking, setPicking] = useState<PickTarget | null>(null);
  const [labeling, setLabeling] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  // Set by a change, read once the change has rendered.
  const focusTo = useRef<FocusTo | null>(null);
  useEffect(() => {
    const to = focusTo.current;
    if (!to) return;
    focusTo.current = null;
    const selector =
      "row" in to
        ? `[data-row="${to.row}"]`
        : "label" in to
          ? `[data-label-tab="${to.label}"]`
          : "[data-slot=workbench-picker] button";
    root.current?.querySelector<HTMLElement>(selector)?.focus();
  });
  const panel = contents[slot];
  const name = (occupant: string) => specFor(occupant)?.label ?? occupant;
  // As the page names a tab: its label, else its occupant's title.
  const tabName = (tab: TabSpec) => {
    if (tab.label) return t(tab.label);
    const [first] = tab.occupants;
    if (!first) return tab.id;
    const title =
      typeof first === "string" ? specFor(first)?.titleKey : first.title;
    return title ? t(title) : name(refName(first));
  };
  const why = (lock: ComposeLock | null) =>
    lock ? t(reasonCopy(host.spec, lock)) : null;
  const change = (next: SlotContents, to: FocusTo | null) => {
    focusTo.current = to;
    setPicking(null);
    setLabeling(null);
    onContents(next);
  };
  const add = (occupant: string, to: PickTarget) =>
    change(
      to === "replace"
        ? replaceIn(host, contents, slot, occupant, focus)
        : addOccupant(host, contents, slot, occupant, to, {
            label: firstUnusedLabel(panel),
          }),
      { row: occupant },
    );
  const toggle = (to: PickTarget) => {
    setLabeling(null);
    setPicking(picking === to ? null : to);
  };
  const picker = (to: PickTarget) =>
    picking === to && (
      <SlotPicker
        host={host}
        contents={contents}
        slot={slot}
        to={to}
        label={t(
          to === "replace"
            ? "workbench_contents_pick_replace"
            : "workbench_contents_pick_add",
        )}
        onPick={(occupant) => add(occupant, to)}
      />
    );
  const focusLock = (
    <span
      data-slot="workbench-contents-reason"
      className="flex items-start gap-1.5 text-xs text-muted-foreground"
    >
      <Lock aria-hidden className="mt-0.5 size-3 shrink-0" />
      {why("focus")}
    </span>
  );
  const row = (occupant: string, actions: ReactNode) => (
    <li
      key={occupant}
      data-slot="workbench-contents-occupant"
      data-row={occupant}
      tabIndex={-1}
      className="flex flex-col gap-1 rounded-sm px-1 py-0.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex min-h-6 items-center justify-between gap-2">
        <span>{name(occupant)}</span>
        {occupant !== focus && actions}
      </div>
      {occupant === focus && focusLock}
    </li>
  );

  // A slot that holds one: its occupant, or the picker straight away.
  if (!holdsPanel(host, slot)) {
    const [only] = panel ? occupantsIn(panel) : [];
    return (
      <div ref={root} className="flex flex-col gap-2">
        {only ? (
          <>
            <ul>
              {row(
                only,
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    aria-expanded={picking === "replace"}
                    onClick={() => toggle("replace")}
                  >
                    {t("workbench_contents_replace")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() =>
                      change(removeFromSlot(contents, slot, only, focus), {
                        picker: true,
                      })
                    }
                  >
                    {t("workbench_contents_clear")}
                  </Button>
                </div>,
              )}
            </ul>
            {picker("replace")}
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {t("workbench_compose_empty")}
            </p>
            <SlotPicker
              host={host}
              contents={contents}
              slot={slot}
              to="new-tab"
              label={t("workbench_contents_pick_add")}
              onPick={(occupant) => add(occupant, "new-tab")}
            />
          </>
        )}
      </div>
    );
  }

  const locks = panelLocks(contents, slot);
  const labels: readonly LocaleKey[] = TAB_LABELS.map((l) => l.key);
  return (
    <div ref={root} className="flex flex-col gap-3">
      {panel && panel.tabs.length > 0 ? (
        <ol className="flex flex-col gap-2">
          {panel.tabs.map((tab, index) => {
            const number = index + 1;
            const stacked = tab.occupants.length > 1;
            const tabLock = locks.tabs[index] ?? null;
            return (
              <li
                key={tab.id}
                data-slot="workbench-contents-tab"
                data-tab={tab.id}
                className="flex flex-col gap-1.5 rounded-md border border-border p-2"
              >
                {/* The tab's name as the page shows it; a stack's is its label, to change. */}
                <div
                  data-slot="workbench-contents-tab-name"
                  className="flex min-h-6 items-center gap-2"
                >
                  {stacked && tab.label ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      data-slot="workbench-contents-label"
                      data-label-tab={index}
                      aria-expanded={labeling === index}
                      aria-label={t("workbench_contents_change_label", {
                        index: number,
                        label: t(tab.label),
                      })}
                      onClick={() => {
                        setPicking(null);
                        setLabeling(labeling === index ? null : index);
                      }}
                    >
                      {t(tab.label)}
                      <ChevronDown aria-hidden />
                    </Button>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      {tabName(tab)}
                    </span>
                  )}
                </div>
                {labeling === index && tab.label && (
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    className="w-full flex-wrap"
                    aria-label={t("workbench_contents_labels", {
                      index: number,
                    })}
                    value={tab.label}
                    onValueChange={(next) => {
                      const chosen = labels.find((key) => key === next);
                      if (chosen)
                        change(relabel(contents, slot, index, chosen), {
                          label: index,
                        });
                    }}
                  >
                    {labels.map((key) => (
                      <ToggleGroupItem
                        key={key}
                        value={key}
                        className="data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      >
                        {t(key)}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                )}
                <ul className="flex flex-col gap-0.5">
                  {tab.occupants.map((ref) => {
                    const occupant = refName(ref);
                    return row(
                      occupant,
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={t("workbench_compose_remove", {
                          occupant: name(occupant),
                        })}
                        onClick={() =>
                          change(
                            removeFromSlot(contents, slot, occupant, focus),
                            null,
                          )
                        }
                      >
                        <X />
                      </Button>,
                    );
                  })}
                </ul>
                <AddButton
                  label={t("workbench_contents_add_to_tab")}
                  reason={why(tabLock)}
                  expanded={picking === index}
                  onClick={() => toggle(index)}
                />
                {picker(index)}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("workbench_compose_empty")}
        </p>
      )}
      <AddButton
        label={t("workbench_contents_new_tab")}
        reason={why(locks.newTab)}
        expanded={picking === "new-tab"}
        onClick={() => toggle("new-tab")}
      />
      {picker("new-tab")}
    </div>
  );
}

interface AddButtonProps {
  label: string;
  /** Why it's locked, or null. */
  reason: string | null;
  expanded: boolean;
  onClick: () => void;
}

/** "+ Add to this tab" or "+ New tab": opens the picker under it, or says why not. */
function AddButton({ label, reason, expanded, onClick }: AddButtonProps) {
  return (
    <Locked reason={reason}>
      {(described) => (
        <Button
          variant="ghost"
          size="sm"
          className="justify-start"
          disabled={reason !== null}
          aria-expanded={expanded}
          {...described}
          onClick={onClick}
        >
          {reason ? <Lock aria-hidden /> : <Plus aria-hidden />}
          {label}
        </Button>
      )}
    </Locked>
  );
}
