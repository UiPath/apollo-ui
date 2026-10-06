"use client";

import { Ellipsis } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ResolvedTab } from "@/lib/panel";

/** What the tab bar measures: each tab's width, and the space around them. */
interface Measured {
  /** Each tab trigger's natural width, by tab id. */
  widths: Readonly<Record<string, number>>;
  /** The tab bar's inner width, less the tablist's own padding. */
  room: number;
  /** The More button's width, with the gap before it. */
  more: number;
}

const NOTHING_MEASURED: Measured = { widths: {}, room: 0, more: 0 };

/**
 * How many tabs fit, in order: all of them when they do, else as many as
 * fit beside the More button, and always at least one. Before everything
 * is measured, all of them, so each can be measured.
 */
function fitCount(ids: readonly string[], measured: Measured): number {
  if (measured.room <= 0 || !ids.every((id) => id in measured.widths))
    return ids.length;
  const widths = ids.map((id) => measured.widths[id]);
  const total = widths.reduce<number>((sum, w = 0) => sum + w, 0);
  if (total <= measured.room) return ids.length;
  let used = measured.more;
  let count = 0;
  for (const w of widths) {
    const width = w ?? 0;
    if (used + width > measured.room) break;
    used += width;
    count++;
  }
  return Math.max(1, count);
}

/** The order with the active tab moved into the last visible place. */
function withActiveShown(
  order: readonly string[],
  active: string,
  count: number,
): string[] {
  const shown = [...order];
  const index = shown.indexOf(active);
  if (index >= count) {
    const last = shown[count - 1];
    if (typeof last === "string") {
      shown[count - 1] = active;
      shown[index] = last;
    }
  }
  return shown;
}

/** The tab ids in display order, kept as tabs come and go. */
function reconcileOrder(
  order: readonly string[],
  ids: readonly string[],
): readonly string[] {
  const kept = order.filter((id) => ids.includes(id));
  const next = [...kept, ...ids.filter((id) => !kept.includes(id))];
  return next.join("\n") === order.join("\n") ? order : next;
}

interface SidePanelTabBarProps {
  tabs: readonly ResolvedTab[];
  active: string;
  onActiveChange: (id: string) => void;
}

/**
 * The tablist. Tabs that don't fit the panel's width collapse, from the
 * end, into a More menu button after the tablist; the active tab is always
 * shown. Choosing a hidden tab from the menu swaps it in for the last
 * visible one. It follows the WAI-ARIA tabs pattern: one tab stop, arrow
 * keys, Home and End, then the More button.
 */
function SidePanelTabBar({
  tabs,
  active,
  onActiveChange,
}: SidePanelTabBarProps) {
  const { t } = useTranslation();
  const ids = tabs.map((tab) => tab.id);
  const [order, setOrder] = React.useState<readonly string[]>(ids);
  const current = reconcileOrder(order, ids);
  if (current !== order) setOrder(current);

  const [measured, setMeasured] = React.useState(NOTHING_MEASURED);
  let count = fitCount(current, measured);
  let shown = withActiveShown(current, active, count);
  // The active tab may be wider than the one it replaced.
  count = Math.min(count, fitCount(shown, measured));
  shown = withActiveShown(current, active, count);
  const hidden = shown.slice(count);

  const bar = React.useRef<HTMLDivElement | null>(null);
  const focusAfterMenu = React.useRef<string | null>(null);

  // Measure after every render, before paint: widths of the tabs that are
  // showing (hidden ones keep their last width), and the bar's room.
  React.useLayoutEffect(() => {
    const node = bar.current;
    if (!node) return;
    const measure = () => {
      const list = node.querySelector<HTMLElement>("[role=tablist]");
      if (!list) return;
      const widths: Record<string, number> = {};
      let triggers = 0;
      for (const trigger of list.querySelectorAll<HTMLElement>(
        "[data-tab-trigger]",
      )) {
        const id = trigger.dataset.tabTrigger;
        if (id && trigger.offsetWidth > 0) {
          widths[id] = trigger.getBoundingClientRect().width;
          triggers += widths[id] ?? 0;
        }
      }
      const style = getComputedStyle(node);
      const inner =
        node.clientWidth -
        Number.parseFloat(style.paddingLeft) -
        Number.parseFloat(style.paddingRight);
      const chrome = list.getBoundingClientRect().width - triggers;
      const button = node.querySelector<HTMLElement>("[data-part=more-tabs]");
      const gap = Number.parseFloat(style.columnGap) || 0;
      setMeasured((prev) => {
        const next = {
          widths: { ...prev.widths, ...widths },
          room: Math.floor(inner - chrome),
          more: button ? button.offsetWidth + gap : prev.more,
        };
        const same =
          next.room === prev.room &&
          next.more === prev.more &&
          Object.entries(next.widths).every(([id, w]) => prev.widths[id] === w);
        return same ? prev : next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  });

  const choose = (id: string) => {
    const index = shown.indexOf(id);
    const last = shown[count - 1];
    if (index >= count && typeof last === "string") {
      const next = [...shown];
      next[count - 1] = id;
      next[index] = last;
      setOrder(next);
    }
    focusAfterMenu.current = id;
    onActiveChange(id);
  };

  const label = (tab: ResolvedTab | undefined) =>
    tab?.label ? t(tab.label) : null;
  const byId = (id: string) => tabs.find((tab) => tab.id === id);

  return (
    <div
      ref={bar}
      data-part="tab-bar"
      className="flex shrink-0 items-center gap-1 px-(--surface-inset) pt-(--surface-inset)"
    >
      {/*
       * Underlined, so it never reads as a segmented control inside an
       * occupant. No gap between tabs: the measuring takes everything in the
       * list but the tabs as fixed, and a gap would change with how many
       * show. The tabs' own padding spaces them.
       */}
      <TabsList variant="line" className="min-w-0 justify-start gap-0">
        {shown.map((id, index) => (
          <TabsTrigger
            key={id}
            value={id}
            data-tab-trigger={id}
            hidden={index >= count}
            className="flex-none"
          >
            {label(byId(id))}
          </TabsTrigger>
        ))}
      </TabsList>
      {hidden.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              data-part="more-tabs"
              aria-label={t("side_panel_more_tabs")}
              className="shrink-0"
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onCloseAutoFocus={(event) => {
              // After choosing a tab, focus it, not the More button.
              const id = focusAfterMenu.current;
              focusAfterMenu.current = null;
              const tab = id
                ? bar.current?.querySelector<HTMLElement>(
                    `[data-tab-trigger="${CSS.escape(id)}"]`,
                  )
                : null;
              if (tab) {
                event.preventDefault();
                tab.focus();
              }
            }}
          >
            {hidden.map((id) => (
              <DropdownMenuItem key={id} onSelect={() => choose(id)}>
                {label(byId(id))}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export { SidePanelTabBar };
