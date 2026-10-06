"use client";

import { Layers, Lock, Plus, X } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TemplateHost } from "@/app/_components/template-hosts";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type LocaleKey, slotHolds } from "@/lib/composition";
import { specFor } from "@/lib/occupant-lookup";
import type { OccupantRef, TabSpec } from "@/lib/panel";
import {
  addChoices,
  addOccupant,
  type ComposeLock,
  type Destination,
  destinations,
  removeFromSlot,
  removeLock,
  type SlotContents,
  TAB_LABELS,
} from "./workbench-compose";
import { reasonCopy } from "./workbench-layout";

/** Labels a stack's tab can take, in the order the composer offers them. */
const LABEL_KEYS: readonly LocaleKey[] = TAB_LABELS.map((l) => l.key);

const refName = (ref: OccupantRef) =>
  typeof ref === "string" ? ref : ref.occupant;

interface LockedProps {
  /** Why it can't be chosen; null when it can. */
  reason: string | null;
  /** Renders the control; spread what it's given onto it. */
  children: (described: { "aria-describedby"?: string }) => React.ReactNode;
}

/** A control, with why it's locked under it when it is. */
function Locked({ reason, children }: LockedProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      {children(reason ? { "aria-describedby": id } : {})}
      {reason && (
        <p
          id={id}
          data-slot="workbench-contents-reason"
          className="flex items-start gap-1.5 text-xs text-muted-foreground"
        >
          <Lock aria-hidden className="mt-0.5 size-3 shrink-0" />
          {reason}
        </p>
      )}
    </div>
  );
}

interface SlotSectionProps {
  host: TemplateHost;
  slot: string;
  contents: SlotContents;
  focus: string;
  onContents: (contents: SlotContents) => void;
}

/** One slot's contents: its tabs and occupants, and adding one more. */
function SlotSection({
  host,
  slot,
  contents,
  focus,
  onContents,
}: SlotSectionProps) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState<string | null>(null);
  const [stackInto, setStackInto] = useState<number | null>(null);
  const [label, setLabel] = useState<LocaleKey>(
    LABEL_KEYS[0] ?? "workbench_tab_label_overview",
  );
  const spec = host.spec.slots.find((s) => s.name === slot);
  const slotName = host.slotLabels[slot] ?? slot;
  const panel = contents[slot];
  const why = (lock: ComposeLock | null) =>
    lock ? t(reasonCopy(host.spec, lock)) : null;
  const occupantName = (name: string) => specFor(name)?.label ?? name;
  const tabName = (tab: TabSpec) => {
    if (tab.label) return t(tab.label);
    const first = specFor(refName(tab.occupants[0] ?? ""));
    return first ? t(first.titleKey) : tab.id;
  };
  const finish = (next: SlotContents) => {
    onContents(next);
    setAdding(null);
    setStackInto(null);
  };
  const add = (occupant: string, to: Destination, tabLabel?: LocaleKey) =>
    finish(
      addOccupant(host, contents, slot, occupant, to, { label: tabLabel }),
    );
  const choose = (occupant: string) => {
    // A slot that holds one takes it straight away.
    if (spec && slotHolds(spec) === "one") add(occupant, "new-tab");
    else {
      setAdding(occupant);
      setStackInto(null);
    }
  };
  const stack = (index: number) => {
    if (!adding) return;
    if (panel?.tabs[index]?.label) add(adding, index);
    else setStackInto(index);
  };

  return (
    <fieldset
      data-slot="workbench-contents-slot"
      data-contents-slot={slot}
      className="flex flex-col gap-3 border-t border-border pt-3 first-of-type:border-t-0 first-of-type:pt-0"
    >
      <legend className="float-left mb-3 w-full text-sm font-medium">
        {slotName}
      </legend>

      {panel && panel.tabs.length > 0 ? (
        <ol className="flex flex-col gap-2 text-sm">
          {panel.tabs.map((tab, index) => (
            <li
              key={tab.id}
              data-slot="workbench-contents-tab"
              className="flex flex-col gap-1"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {t("workbench_compose_tab", {
                  index: index + 1,
                  label: tabName(tab),
                })}
              </span>
              <ul className="flex flex-col gap-1">
                {tab.occupants.map((ref) => {
                  const name = refName(ref);
                  const lock = removeLock(name, focus);
                  return (
                    <li key={name}>
                      <Locked reason={why(lock)}>
                        {(described) => (
                          <div className="flex items-center justify-between gap-2">
                            <span data-slot="workbench-contents-occupant">
                              {occupantName(name)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              disabled={lock !== null}
                              aria-label={t("workbench_compose_remove", {
                                occupant: occupantName(name),
                              })}
                              {...described}
                              onClick={() =>
                                finish(
                                  removeFromSlot(contents, slot, name, focus),
                                )
                              }
                            >
                              <X />
                            </Button>
                          </div>
                        )}
                      </Locked>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("workbench_compose_empty")}
        </p>
      )}

      <div
        role="group"
        aria-label={t("workbench_compose_add_to", { slot: slotName })}
        className="flex flex-col gap-1.5"
      >
        <span className="text-xs font-medium text-muted-foreground">
          {t("workbench_compose_add")}
        </span>
        {addChoices(host, contents, slot, focus).map((choice) => (
          <Locked key={choice.value} reason={why(choice.lock)}>
            {(described) => (
              <Button
                variant={adding === choice.value ? "secondary" : "outline"}
                size="sm"
                className="justify-start"
                disabled={choice.lock !== null}
                aria-pressed={adding === choice.value}
                {...described}
                onClick={() => choose(choice.value)}
              >
                <Plus aria-hidden />
                {occupantName(choice.value)}
              </Button>
            )}
          </Locked>
        ))}
      </div>

      {adding && stackInto === null && (
        <div
          role="group"
          aria-label={t("workbench_compose_where", {
            occupant: occupantName(adding),
          })}
          className="flex flex-col gap-1.5"
        >
          {destinations(host, contents, slot, adding).map((destination) => {
            const tab =
              destination.value === "new-tab"
                ? null
                : panel?.tabs[destination.value];
            return (
              <Locked
                key={String(destination.value)}
                reason={why(destination.lock)}
              >
                {(described) => (
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    disabled={destination.lock !== null}
                    {...described}
                    onClick={() =>
                      destination.value === "new-tab"
                        ? add(adding, "new-tab")
                        : stack(destination.value)
                    }
                  >
                    {tab
                      ? t("workbench_compose_add_to_tab", {
                          label: tabName(tab),
                        })
                      : t("workbench_compose_new_tab")}
                  </Button>
                )}
              </Locked>
            );
          })}
        </div>
      )}

      {adding && stackInto !== null && panel?.tabs[stackInto] && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {t("workbench_compose_tab_label", {
              label: tabName(panel.tabs[stackInto]),
            })}
          </span>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            className="w-full flex-wrap"
            value={label}
            onValueChange={(next) => {
              const match = LABEL_KEYS.find((key) => key === next);
              if (match) setLabel(match);
            }}
            aria-label={t("workbench_compose_tab_label", {
              label: tabName(panel.tabs[stackInto]),
            })}
          >
            {LABEL_KEYS.map((key) => (
              <ToggleGroupItem
                key={key}
                value={key}
                className="data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {t(key)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => add(adding, stackInto, label)}
          >
            {t("workbench_compose_confirm")}
          </Button>
        </div>
      )}
    </fieldset>
  );
}

interface TemplateContentsMenuProps {
  host: TemplateHost;
  contents: SlotContents;
  /** The focused occupant: always placed, and it stays. */
  focus: string;
  onContents: (contents: SlotContents) => void;
}

/**
 * The template view's composer, in a popover beside Layout: for every slot,
 * its tabs and occupants, and adding an occupant as a new tab or into a
 * tab. What it offers and locks comes from the template's declarations and
 * composition's checks.
 */
export function TemplateContentsMenu({
  host,
  contents,
  focus,
  onContents,
}: TemplateContentsMenuProps) {
  const { t } = useTranslation();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" data-slot="workbench-contents">
          <Layers aria-hidden />
          {t("workbench_compose")}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="flex max-h-[min(36rem,var(--radix-popover-content-available-height))] w-80 flex-col gap-4 overflow-y-auto"
        data-slot="workbench-contents-menu"
      >
        {host.spec.slots.map((slot) => (
          <SlotSection
            key={slot.name}
            host={host}
            slot={slot.name}
            contents={contents}
            focus={focus}
            onContents={onContents}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
}
