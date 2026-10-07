"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TemplateHost } from "@/app/_components/template-hosts";
import { Button } from "@/components/ui/button";
import { specFor } from "@/lib/occupant-lookup";
import type { TabSpec } from "@/lib/panel";
import { ContentCard } from "./content-card";
import { InspectorDnd } from "./inspector-dnd";
import { LockableButton } from "./lock-hint";
import { RenameField } from "./rename-field";
import { SlotPicker } from "./slot-picker";
import { SlotTabRows } from "./slot-tab-rows";
import { occupantLabel, useSlotMoves } from "./use-slot-moves";
import {
  addOccupant,
  type ComposeLock,
  type ContentsChange,
  holdsPanel,
  occupantsIn,
  removeFromSlot,
  type SlotContents,
} from "./workbench-compose";
import { reasonCopy } from "./workbench-layout";
import {
  firstUnusedLabel,
  type PickTarget,
  panelLocks,
  relabel,
  replaceIn,
} from "./workbench-picker";
import {
  occupantTarget,
  type Renames,
  rename,
  restore,
  stackTarget,
} from "./workbench-renames";

/** An occupant's name, as people know it. */
const name = occupantLabel;

/** Where focus goes once the contents change: a row, a tab's label, or the picker. */
type FocusTo = { row: string } | { label: number } | { picker: true };

interface SlotContentsSectionProps {
  host: TemplateHost;
  slot: string;
  contents: SlotContents;
  onContents: ContentsChange;
  /** Preview-only renames, and changing them. */
  renames: Renames;
  onRenames: (renames: Renames) => void;
  /** The tab each slot shows, when one was chosen: a move keeps it. */
  tabs: Readonly<Record<string, string>>;
}

/**
 * A slot's contents, as the slot holds them. A panel slot lists its tabs
 * as rows, each with a "+" that adds to it, then "New tab": which you
 * press decides tab or stack. A slot that holds one shows its occupant,
 * with Replace and Clear, or the picker when it's empty. Only the real
 * limits lock: a fill occupant's tab, and the tab cap.
 */
export function SlotContentsSection({
  host,
  slot,
  contents,
  onContents,
  renames,
  onRenames,
  tabs,
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
  // As the page titles an occupant: renamed, else its declared title.
  const titleOf = (occupant: string) => {
    const key =
      renames[occupantTarget(occupant)] ?? specFor(occupant)?.titleKey;
    return key ? t(key) : name(occupant);
  };
  // A tab of one is named for its occupant; in a stack, it's a heading.
  const nameField = (occupant: string, stacked: boolean) => (
    <RenameField
      name={titleOf(occupant)}
      renamed={occupantTarget(occupant) in renames}
      onRename={(text) =>
        onRenames(rename(renames, occupantTarget(occupant), text))
      }
      onRestore={() => onRenames(restore(renames, occupantTarget(occupant)))}
      slot={
        stacked
          ? "workbench-contents-occupant-name"
          : "workbench-contents-tab-name"
      }
    />
  );
  const labelField = (index: number, tab: TabSpec) => {
    const target = stackTarget(slot, tab.id);
    const key = renames[target] ?? tab.label;
    return (
      <RenameField
        name={key ? t(key) : tab.id}
        renamed={target in renames}
        onRename={(text) => onRenames(rename(renames, target, text))}
        onRestore={() => onRenames(restore(renames, target))}
        slot="workbench-contents-label"
      />
    );
  };
  // A tab in words: its label, renamed or not, else its occupant's title.
  const tabName = (index: number) => {
    const tab = panel?.tabs[index];
    if (!tab) return "";
    const key = renames[stackTarget(slot, tab.id)] ?? tab.label;
    if (key && tab.occupants.length > 1) return t(key);
    const [first] = tab.occupants;
    return first
      ? titleOf(typeof first === "string" ? first : first.occupant)
      : tab.id;
  };
  const moves = useSlotMoves({
    host,
    slot,
    contents,
    onContents,
    tabs,
    renames,
    tabName,
  });
  const why = (lock: ComposeLock | null) =>
    lock ? t(reasonCopy(host.spec, lock)) : null;
  const change = (
    next: SlotContents,
    to: FocusTo | null,
    show?: { slot: string; tab: string },
  ) => {
    focusTo.current = to;
    setPicking(null);
    setLabeling(null);
    onContents(next, show);
  };
  const add = (occupant: string, to: PickTarget) => {
    if (to === "replace") {
      change(replaceIn(host, contents, slot, occupant), {
        row: occupant,
      });
      return;
    }
    const next = addOccupant(host, contents, slot, occupant, to, {
      label: firstUnusedLabel(panel),
    });
    // The tab it went in shows: a new one is its own, by its id.
    const tab = to === "new-tab" ? occupant : panel?.tabs[to]?.id;
    if (next !== contents && holdsPanel(host, slot) && tab)
      change(next, { row: occupant }, { slot, tab });
    else change(next, { row: occupant });
  };
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
  const remove = (occupant: string) =>
    change(removeFromSlot(contents, slot, occupant), null);
  const removeButton = (occupant: string) => (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={t("workbench_compose_remove", { occupant: name(occupant) })}
      onClick={() => remove(occupant)}
    >
      <X />
    </Button>
  );

  // A slot that holds one: its occupant, or the picker straight away.
  if (!holdsPanel(host, slot)) {
    const [only] = panel ? occupantsIn(panel) : [];
    return (
      <div ref={root} className="flex flex-col gap-2">
        {only ? (
          <>
            <ContentCard
              occupant={only}
              name={<span className="truncate">{name(only)}</span>}
              actions={
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
                      change(removeFromSlot(contents, slot, only), {
                        picker: true,
                      })
                    }
                  >
                    {t("workbench_contents_clear")}
                  </Button>
                </div>
              }
            />
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
  const newTabLock = why(locks.newTab);
  const newTab = (
    <LockableButton
      variant="outline"
      size="sm"
      className="w-full justify-start"
      reason={newTabLock}
      aria-expanded={picking === "new-tab"}
      onClick={() => toggle("new-tab")}
    >
      {newTabLock ? null : <Plus aria-hidden />}
      {t("workbench_contents_new_tab")}
    </LockableButton>
  );
  return (
    <div ref={root} className="flex flex-col gap-1.5">
      {panel && panel.tabs.length > 0 ? (
        <InspectorDnd
          panel={panel}
          preview={moves.preview}
          onMove={moves.onMove}
          placeName={moves.placeName}
          reason={moves.reason}
        >
          <SlotTabRows
            tabs={panel.tabs}
            locks={locks.tabs.map(why)}
            picking={picking}
            labeling={labeling}
            nameField={nameField}
            labelField={labelField}
            tabName={tabName}
            occupantName={name}
            removeButton={removeButton}
            picker={picker}
            steps={moves.steps}
            reason={moves.reason}
            newTab={newTab}
            onAdd={(index) => toggle(index)}
            onLabel={(index) => {
              setPicking(null);
              setLabeling(labeling === index ? null : index);
            }}
            onRelabel={(index, label) => {
              // A preset replaces the stack's preview-only name.
              const tab = panel.tabs[index];
              if (tab) onRenames(restore(renames, stackTarget(slot, tab.id)));
              change(relabel(contents, slot, index, label), { label: index });
            }}
          />
        </InspectorDnd>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {t("workbench_compose_empty")}
          </p>
          <div className="rounded-sm border border-dashed border-border [&_button]:border-0 [&_button]:bg-transparent [&_button]:shadow-none">
            {newTab}
          </div>
        </>
      )}
      {picker("new-tab")}
    </div>
  );
}
