import { ChevronLeft, ChevronRight } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Occupant,
  type OccupantSelectionProps,
  OccupantStateView,
  OccupantStatus,
  OccupantTruncatedText,
  type OccupantViewProps,
} from "@/components/ui/occupant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SCROLL_FADE_MASK,
  SCROLL_FADE_MASK_X,
  useScrollFade,
} from "@/hooks/use-scroll-fade";
import { cn } from "@/lib/utils";
import { queueOccupant } from "./queue.occupant";
import type { QueueViewModel } from "./queue.view-model";

const ALL = "all";

const revealCurrent = (node: HTMLElement | null) =>
  node?.scrollIntoView({ block: "nearest" });

type QueueProps = OccupantViewProps<QueueViewModel> & OccupantSelectionProps;

/** Occupant: A list of items to work through, grouped and filtered, where picking one opens it. */
function Queue({
  view,
  state = "ready",
  onRetry,
  currentId,
  onSelect,
}: QueueProps) {
  const { t } = useTranslation();
  // Filtering happens here, so the tab counts always match what's shown.
  const [filter, setFilter] = useState(ALL);
  const visible =
    filter === ALL
      ? view.items
      : view.items.filter((entry) => entry.filter === filter);
  const groupId = useId();
  // Groups in the order they first appear, each with its visible items.
  const groups: { label: string; items: typeof visible }[] = [];
  for (const entry of visible) {
    const group = groups.find((g) => g.label === entry.group);
    if (group) group.items.push(entry);
    else groups.push({ label: entry.group, items: [entry] });
  }
  // Stepping follows the order on screen: group by group.
  const ordered = groups.flatMap((group) => group.items);
  const position = ordered.findIndex((entry) => entry.id === currentId);
  const step = (index: number) => {
    const next = ordered[index];
    if (next) onSelect?.(next.id);
  };
  const listRef = useScrollFade<HTMLDivElement>();
  const tabsRef = useScrollFade<HTMLDivElement>(true, null, { axis: "x" });
  // Nothing to show is the empty state.
  const shown = state === "ready" && view.items.length === 0 ? "empty" : state;
  return (
    <Occupant spec={queueOccupant}>
      <OccupantStateView
        state={shown}
        subject={t("queue_subject")}
        emptyDescription={t("queue_empty")}
        onRetry={onRetry}
        flush
      >
        <Tabs
          value={filter}
          onValueChange={setFilter}
          // A mask hides focus rings, so the list's ring is drawn here.
          className="min-h-0 flex-1 gap-0 rounded-lg has-[[data-slot=tabs-content]:focus-visible]:ring-2 has-[[data-slot=tabs-content]:focus-visible]:ring-ring/50 has-[[data-slot=tabs-content]:focus-visible]:ring-inset"
        >
          <div
            ref={tabsRef}
            data-scroll-x
            className={cn(
              "shrink-0 overflow-x-auto px-(--surface-inset) pt-(--surface-inset) pb-2",
              SCROLL_FADE_MASK_X,
            )}
          >
            {/* As wide as the list, or its content when that's wider; spare space is shared evenly. */}
            <TabsList
              className="w-full min-w-max"
              aria-label={t("occupant_filter", { subject: t("queue_subject") })}
            >
              {[{ id: ALL, label: t("all") }, ...view.filters].map((option) => (
                <TabsTrigger
                  key={option.id}
                  value={option.id}
                  className="flex-auto"
                >
                  {option.label}
                  {option.id === filter && (
                    <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
                      {visible.length}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabsContent
            value={filter}
            ref={listRef}
            className={cn(
              "min-h-0 flex-1 overflow-y-auto outline-none px-(--surface-inset) py-4",
              SCROLL_FADE_MASK,
            )}
          >
            {visible.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground wrap-anywhere">
                {t("occupant_none_match", { subject: t("queue_subject") })}
              </p>
            )}
            <div
              aria-label={t("queue_label", { subject: view.subject })}
              role="group"
              className="flex min-w-0 flex-col gap-6"
            >
              {groups.map((group, index) => (
                <div
                  key={group.label}
                  role="group"
                  aria-labelledby={`${groupId}-${index}`}
                  className="flex min-w-0 flex-col gap-3"
                >
                  <p
                    id={`${groupId}-${index}`}
                    className="text-xs text-muted-foreground wrap-anywhere"
                  >
                    {t("occupant_group", {
                      label: group.label,
                      count: group.items.length,
                    })}
                  </p>
                  <ul className="flex min-w-0 flex-col gap-3">
                    {group.items.map((entry) => (
                      <li key={entry.id}>
                        <Card
                          selectable="standard"
                          selected={entry.id === currentId}
                          className="rounded-md"
                          onClick={() => onSelect?.(entry.id)}
                          // Keep the current item in view as people step through.
                          ref={entry.id === currentId ? revealCurrent : null}
                        >
                          <div className="flex min-w-0 items-baseline justify-between gap-8">
                            <OccupantTruncatedText className="flex-1 text-sm font-semibold text-foreground">
                              {entry.title}
                            </OccupantTruncatedText>
                            {entry.value && (
                              <p className="max-w-1/2 shrink-0 text-end text-xs font-semibold text-foreground tabular-nums wrap-anywhere">
                                {entry.value}
                              </p>
                            )}
                          </div>
                          <div className="flex min-w-0 items-baseline justify-between mt-2 gap-3">
                            <OccupantStatus
                              status={entry.status}
                              className="flex-1 text-xs"
                            />
                            {entry.reference && (
                              <p
                                className="max-w-1/2 shrink-0 truncate text-xs text-muted-foreground"
                                title={entry.reference}
                              >
                                {entry.reference}
                              </p>
                            )}
                          </div>
                        </Card>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </TabsContent>
          <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-(--surface-inset) py-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("occupant_previous_item")}
              disabled={position <= 0}
              onClick={() => step(position - 1)}
            >
              <ChevronLeft aria-hidden />
            </Button>
            <p
              aria-live="polite"
              className="min-w-0 text-center text-sm text-muted-foreground wrap-anywhere"
            >
              {position === -1
                ? t("occupant_count", { count: ordered.length })
                : t("occupant_position", {
                    position: position + 1,
                    count: ordered.length,
                  })}
            </p>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("occupant_next_item")}
              disabled={position === ordered.length - 1}
              onClick={() => step(position + 1)}
            >
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </Tabs>
      </OccupantStateView>
    </Occupant>
  );
}

export { Queue, queueOccupant };
export type { QueueProps };
