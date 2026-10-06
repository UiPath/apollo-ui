"use client";

import { Plus, X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TemplateHost } from "@/app/_components/template-hosts";
import { Button } from "@/components/ui/button";
import { specFor } from "@/lib/occupant-lookup";
import type { OccupantRef, TabSpec } from "@/lib/panel";
import { LockableButton, LockIcon } from "./lock-hint";
import { SlotPicker } from "./slot-picker";
import { SlotTabRows } from "./slot-tab-rows";
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
  onContents: ContentsChange;
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
  focus,
  onContents,
}: SlotContentsSectionProps) {
  const { t } = useTranslation();
  const [picking, setPicking] = useState<PickTarget | null>(null);
  const [labeling, setLabeling] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const reasonId = useId();
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
      change(replaceIn(host, contents, slot, occupant, focus), {
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
    change(removeFromSlot(contents, slot, occupant, focus), null);
  // An occupant's own row: its name (or what's given in its place), then
  // × or, for the focused one, a lock.
  const row = (
    occupant: string,
    actions: ReactNode,
    label: ReactNode = <span className="truncate">{name(occupant)}</span>,
  ) => (
    <div
      data-slot="workbench-contents-occupant"
      data-row={occupant}
      tabIndex={-1}
      {...(occupant === focus && { "aria-describedby": reasonId })}
      className="flex min-h-7 min-w-0 flex-1 items-center justify-between gap-2 rounded-sm px-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {label}
      {occupant === focus ? (
        <LockIcon reason={why("focus") ?? ""} id={reasonId} />
      ) : (
        actions
      )}
    </div>
  );
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
  return (
    <div ref={root} className="flex flex-col gap-2">
      {panel && panel.tabs.length > 0 ? (
        <SlotTabRows
          tabs={panel.tabs}
          locks={locks.tabs.map(why)}
          picking={picking}
          labeling={labeling}
          tabName={tabName}
          row={row}
          removeButton={removeButton}
          picker={picker}
          onAdd={(index) => toggle(index)}
          onLabel={(index) => {
            setPicking(null);
            setLabeling(labeling === index ? null : index);
          }}
          onRelabel={(index, label) =>
            change(relabel(contents, slot, index, label), { label: index })
          }
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("workbench_compose_empty")}
        </p>
      )}
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
      {picker("new-tab")}
    </div>
  );
}
