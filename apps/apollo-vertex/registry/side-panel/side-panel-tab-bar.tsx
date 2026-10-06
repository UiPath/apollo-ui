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
import {
  fitCount,
  type Measured,
  NOTHING_MEASURED,
  sameMeasured,
  withActiveShown,
} from "./side-panel-tab-fit";

/**
 * How many times the bar may measure again before it paints. Measuring
 * settles in one or two; more means a measurement depends on its own
 * result, so it stops until the next frame instead of looping.
 */
const MAX_REMEASURES = 8;

/** A computed length in px, or 0 when it isn't one ("normal"). */
const px = (value: string) => Number.parseFloat(value) || 0;

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

  // Measures in a row before a paint; reset each frame (see MAX_REMEASURES).
  const remeasures = React.useRef(0);

  // Measure after every render, before paint: widths of the tabs that are
  // showing (hidden ones keep their last width), the gap between tabs, and
  // the room the tablist has for them.
  React.useLayoutEffect(() => {
    const node = bar.current;
    if (!node) return;
    const measure = () => {
      const list = node.querySelector<HTMLElement>("[role=tablist]");
      if (!list) return;
      const widths: Record<string, number> = {};
      for (const trigger of list.querySelectorAll<HTMLElement>(
        "[data-tab-trigger]",
      )) {
        const id = trigger.dataset.tabTrigger;
        if (id && trigger.offsetWidth > 0)
          widths[id] = trigger.getBoundingClientRect().width;
      }
      const style = getComputedStyle(node);
      const listStyle = getComputedStyle(list);
      const inner =
        node.clientWidth - px(style.paddingLeft) - px(style.paddingRight);
      // Only the tablist's own box is fixed; the gaps depend on how many show.
      const listBox =
        px(listStyle.paddingLeft) +
        px(listStyle.paddingRight) +
        px(listStyle.borderLeftWidth) +
        px(listStyle.borderRightWidth);
      const button = node.querySelector<HTMLElement>("[data-part=more-tabs]");
      const next: Measured = {
        widths: { ...measured.widths, ...widths },
        gap: px(listStyle.columnGap),
        room: Math.floor(inner - listBox),
        more: button ? button.offsetWidth + px(style.columnGap) : measured.more,
      };
      if (sameMeasured(next, measured)) return;
      if (remeasures.current >= MAX_REMEASURES) return;
      remeasures.current++;
      setMeasured(next);
    };
    measure();
    const frame = requestAnimationFrame(() => {
      remeasures.current = 0;
    });
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
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
      {/* Underlined, so it never reads as a segmented control inside an occupant. */}
      <TabsList variant="line" className="min-w-0 justify-start">
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
