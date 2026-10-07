"use client";

import { ChevronDown, Plus } from "lucide-react";
import { type CSSProperties, Fragment, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { LocaleKey } from "@/lib/composition";
import type { OccupantRef, TabSpec } from "@/lib/panel";
import type { MoveResult } from "@/lib/panel-editing";
import { cn } from "@/lib/utils";
import {
  ContentCard,
  MoveHandle,
  MoveMenu,
  type MoveSteps,
} from "./content-card";
import { useInspectorDrag } from "./inspector-drag";
import type { MoveItem, MovePlace } from "./inspector-move";
import { LockableButton } from "./lock-hint";
import { SELECTED_SEGMENT } from "./segment";
import { TAB_LABELS } from "./workbench-compose";
import type { PickTarget } from "./workbench-picker";

const refName = (ref: OccupantRef) =>
  typeof ref === "string" ? ref : ref.occupant;

const LABELS: readonly LocaleKey[] = TAB_LABELS.map((l) => l.key);

const samePlace = (a: MovePlace | null, b: MovePlace) =>
  JSON.stringify(a) === JSON.stringify(b);

interface DropSlotProps {
  height: number;
  /** Why it can't land here, if it can't. */
  refused: string | null;
}

/** Where the dragged thing will land: a dashed slot its size; a refused one says why. */
function DropSlot({ height, refused }: DropSlotProps) {
  // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- CSS custom properties aren't in React.CSSProperties
  const style = { "--slot-height": `${height}px` } as CSSProperties;
  return (
    <li
      data-slot="workbench-contents-drop-slot"
      data-refused={refused !== null}
      style={style}
      className="flex min-h-(--slot-height) list-none items-center justify-center rounded-sm border-2 border-dashed border-primary/60 bg-primary/5 px-2 text-center text-xs text-muted-foreground data-[refused=true]:border-muted-foreground/40 data-[refused=true]:bg-transparent"
    >
      {refused}
    </li>
  );
}

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
  /** A tab's and an occupant's names in words, for their grips and menus. */
  tabName: (index: number) => string;
  occupantName: (occupant: string) => string;
  removeButton: (occupant: string) => ReactNode;
  /** The picker for a place, when it's open there. */
  picker: (to: PickTarget) => ReactNode;
  /** Move up and Move down for a tab or an occupant. */
  steps: (item: MoveItem) => MoveSteps;
  /** A refusal in words. */
  reason: (result: MoveResult) => string;
  /** "New tab", which the dashed card at the end holds. */
  newTab: ReactNode;
  onAdd: (index: number) => void;
  onLabel: (index: number) => void;
  onRelabel: (index: number, label: LocaleKey) => void;
}

/**
 * A panel's tabs as cards. A tab of one occupant is its card: a grip, its
 * name, then "+" and ×. A stack is a light outline around its occupants'
 * cards, under a header with a grip for the whole tab, its label, and
 * "+". "New tab" is a dashed card at the end. Names and labels rename in
 * place, for this preview. While something's dragged, a dashed slot its
 * size opens where it will land.
 */
export function SlotTabRows(props: SlotTabRowsProps) {
  const { tabs, newTab } = props;
  const drag = useInspectorDrag();
  const slot = (place: MovePlace) =>
    drag && !drag.noop && samePlace(drag.place, place) ? (
      <DropSlot
        height={drag.height}
        refused={
          drag.result && !drag.result.ok ? props.reason(drag.result) : null
        }
      />
    ) : null;
  const atEnd =
    drag !== null &&
    samePlace(drag.place, { kind: "new-tab", at: tabs.length });
  return (
    <>
      <ul data-slot="workbench-contents-tabs" className="flex flex-col gap-1.5">
        {tabs.map((tab, index) => (
          <Fragment key={tab.id}>
            {slot({ kind: "new-tab", at: index })}
            <TabRow {...props} tab={tab} index={index} slot={slot} />
          </Fragment>
        ))}
      </ul>
      <EndCard
        over={atEnd && !drag?.noop}
        refused={atEnd && drag?.result?.ok === false}
      >
        {newTab}
      </EndCard>
    </>
  );
}

interface EndCardProps {
  over: boolean;
  refused: boolean;
  children: ReactNode;
}

/** "New tab", as a dashed card at the end, and a place to drop a new tab. */
function EndCard({ over, refused, children }: EndCardProps) {
  return (
    <div
      data-slot="workbench-contents-new-tab"
      data-drop-zone="end"
      data-over={over}
      data-refused={refused}
      className="rounded-sm border border-dashed border-border data-[over=true]:border-2 data-[over=true]:border-primary/60 data-[over=true]:bg-primary/5 data-[refused=true]:border-muted-foreground/40 data-[refused=true]:bg-transparent [&_button]:w-full [&_button]:justify-start [&_button]:border-0 [&_button]:bg-transparent [&_button]:shadow-none"
    >
      {children}
    </div>
  );
}

interface TabRowProps extends SlotTabRowsProps {
  tab: TabSpec;
  index: number;
  slot: (place: MovePlace) => ReactNode;
}

/** One tab: its card, or its stack's outline. Either is where a drag can land. */
function TabRow({
  tab,
  index,
  slot,
  locks,
  picking,
  labeling,
  nameField,
  labelField,
  tabName,
  occupantName,
  removeButton,
  picker,
  steps,
  onAdd,
  onLabel,
  onRelabel,
}: TabRowProps) {
  const { t } = useTranslation();
  const drag = useInspectorDrag();
  const stacked = tab.occupants.length > 1;
  const draggedTab = drag?.item.kind === "tab" && drag.item.index === index;
  const dragged = (occupant: string) =>
    drag?.item.kind === "occupant" && drag.item.name === occupant;
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

  if (!stacked) {
    const [first] = tab.occupants;
    if (!first) return null;
    const occupant = refName(first);
    const item: MoveItem = { kind: "occupant", name: occupant };
    return (
      <li
        data-slot="workbench-contents-tab"
        data-tab={tab.id}
        data-drop-zone="single"
        data-tab-index={index}
        className="flex flex-col gap-1"
      >
        {slot({ kind: "into", tab: index, at: 0 })}
        <ContentCard
          occupant={occupant}
          dragging={dragged(occupant)}
          handle={<MoveHandle item={item} name={occupantName(occupant)} />}
          name={nameField(occupant, false)}
          actions={
            <>
              {add}
              <MoveMenu
                name={occupantName(occupant)}
                steps={steps({ kind: "tab", index })}
              />
              {removeButton(occupant)}
            </>
          }
        />
        {slot({ kind: "into", tab: index, at: 1 })}
        {picker(index)}
      </li>
    );
  }

  const tabItem: MoveItem = { kind: "tab", index };
  const label = tab.label;
  let shown = 0;
  return (
    <li
      data-slot="workbench-contents-tab"
      data-tab={tab.id}
      data-stack=""
      data-drop-zone="stack"
      data-tab-index={index}
      data-dragging={draggedTab}
      className="flex flex-col gap-1 rounded-md border border-border/80 p-1 data-[dragging=true]:opacity-40"
    >
      <div className="flex items-center gap-1">
        <MoveHandle item={tabItem} name={tabName(index)} />
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
              label: label ? t(label) : "",
            })}
            onClick={() => onLabel(index)}
          >
            <ChevronDown aria-hidden />
          </Button>
        </div>
        {add}
        <MoveMenu name={tabName(index)} steps={steps(tabItem)} />
      </div>
      {labeling === index && (
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          className="w-full flex-wrap"
          aria-label={t("workbench_contents_labels", { index: index + 1 })}
          value={label}
          onValueChange={(next) => {
            const chosen = LABELS.find((key) => key === next);
            if (chosen) onRelabel(index, chosen);
          }}
        >
          {LABELS.map((key) => (
            <ToggleGroupItem key={key} value={key} className={SELECTED_SEGMENT}>
              {t(key)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      <ul className="flex flex-col gap-1">
        {tab.occupants.map((ref) => {
          const occupant = refName(ref);
          const item: MoveItem = { kind: "occupant", name: occupant };
          // Places count the cards that stay, not the one that's dragged.
          const at = dragged(occupant) ? null : shown++;
          return (
            <Fragment key={occupant}>
              {at !== null && slot({ kind: "into", tab: index, at })}
              <li className={cn("flex")}>
                <ContentCard
                  occupant={occupant}
                  stackTab={index}
                  dragging={dragged(occupant)}
                  handle={
                    <MoveHandle item={item} name={occupantName(occupant)} />
                  }
                  name={nameField(occupant, true)}
                  actions={
                    <>
                      <MoveMenu
                        name={occupantName(occupant)}
                        steps={steps(item)}
                      />
                      {removeButton(occupant)}
                    </>
                  }
                />
              </li>
            </Fragment>
          );
        })}
        {slot({ kind: "into", tab: index, at: shown })}
      </ul>
      {picker(index)}
    </li>
  );
}
