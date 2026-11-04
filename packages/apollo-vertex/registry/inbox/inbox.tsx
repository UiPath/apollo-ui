"use client";

import { DateTime } from "luxon";
import type * as React from "react";
import {
  type DateInput,
  type DayGroup,
  type FormatRelativeTimeOptions,
  formatRelativeTime,
  toDateTime,
} from "@/lib/relative-time";
import { cn } from "@/lib/utils";
import { useVertexTranslation } from "@/lib/vertex-translation";

const DAY_GROUP_LABEL_KEYS = {
  today: "day_group_today",
  yesterday: "day_group_yesterday",
  week: "day_group_week",
  older: "day_group_older",
} as const satisfies Record<DayGroup, string>;

function Inbox({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="inbox"
      className={cn("flex h-full min-h-0 flex-col bg-muted/30", className)}
      {...props}
    />
  );
}

function InboxHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="inbox-header"
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 px-4 pt-4 pb-3",
        className,
      )}
      {...props}
    />
  );
}

function InboxTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="inbox-title"
      className={cn(
        "truncate text-sm font-semibold uppercase tracking-wider text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function InboxActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="inbox-actions"
      className={cn("flex shrink-0 items-center", className)}
      {...props}
    />
  );
}

function InboxToolbar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="inbox-toolbar"
      className={cn("shrink-0 px-4 pb-3", className)}
      {...props}
    />
  );
}

function InboxContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="inbox-content"
      className={cn("relative min-h-0 flex-1 overflow-y-auto", className)}
      {...props}
    />
  );
}

function InboxEmpty({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="inbox-empty"
      className={cn("p-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

interface InboxGroupProps extends React.ComponentProps<"section"> {
  /** Day bucket from `groupByDay`; renders its translated label. */
  group?: DayGroup;
  /** Header text; overrides the `group` label. */
  label?: React.ReactNode;
}

function InboxGroup({
  group,
  label,
  className,
  children,
  ...props
}: InboxGroupProps) {
  const { t } = useVertexTranslation();
  const heading =
    label ?? (group == null ? null : t(DAY_GROUP_LABEL_KEYS[group]));

  return (
    <section
      data-slot="inbox-group"
      data-group={group}
      className={className}
      {...props}
    >
      {heading != null && (
        <h3
          data-slot="inbox-group-label"
          className="sticky top-0 z-10 border-b border-border bg-muted/30 px-4 py-2 text-sm font-semibold text-muted-foreground backdrop-blur-sm"
        >
          {heading}
        </h3>
      )}
      <ul>{children}</ul>
    </section>
  );
}

interface InboxItemProps extends React.ComponentProps<"button"> {
  selected?: boolean;
  /** Shows the unread dot and a bold title. */
  unread?: boolean;
  /** Replaces the unread dot, e.g. with a status icon. */
  indicator?: React.ReactNode;
}

function InboxItem({
  selected = false,
  unread = false,
  indicator,
  className,
  children,
  ...props
}: InboxItemProps) {
  const { t } = useVertexTranslation();

  return (
    <li data-slot="inbox-item-container">
      <button
        type="button"
        data-slot="inbox-item"
        data-selected={selected}
        data-unread={unread}
        aria-current={selected}
        className={cn(
          "group/inbox-item flex w-full gap-2.5 border-b border-l-2 border-b-border px-4 py-3 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50",
          selected
            ? "border-l-primary bg-accent"
            : "border-l-transparent hover:bg-muted/60",
          className,
        )}
        {...props}
      >
        <span
          data-slot="inbox-item-indicator"
          className="mt-1 flex w-3.5 shrink-0 justify-center [&_svg:not([class*='size-'])]:size-3.5"
        >
          {indicator ??
            (unread && (
              <span
                className="mt-0.5 size-1.5 rounded-full bg-primary"
                aria-hidden
              />
            ))}
          {unread && <span className="sr-only">{t("unread")}</span>}
        </span>
        <span className="min-w-0 flex-1">{children}</span>
      </button>
    </li>
  );
}

function InboxItemHeader({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="inbox-item-header"
      className={cn("flex items-baseline justify-between gap-2", className)}
      {...props}
    />
  );
}

function InboxItemTitle({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="inbox-item-title"
      className={cn(
        "min-w-0 truncate text-sm text-foreground group-data-[unread=true]/inbox-item:font-semibold",
        className,
      )}
      {...props}
    />
  );
}

interface InboxItemTimeProps
  extends Omit<React.ComponentProps<"time">, "dateTime" | "children">,
    Pick<FormatRelativeTimeOptions, "now"> {
  /** Renders nothing when the date is invalid. */
  value: DateInput;
  unitStyle?: FormatRelativeTimeOptions["style"];
}

function InboxItemTime({
  value,
  now,
  unitStyle,
  className,
  ...props
}: InboxItemTimeProps) {
  const { i18n } = useVertexTranslation();
  const locale = i18n.language;
  const date = toDateTime(value);
  if (!date.isValid) return null;

  return (
    <time
      data-slot="inbox-item-time"
      dateTime={date.toISO() ?? ""}
      title={date.setLocale(locale).toLocaleString(DateTime.DATETIME_MED)}
      // Relative text depends on the current time, so server and client can differ by a unit
      suppressHydrationWarning
      className={cn("shrink-0 text-sm text-muted-foreground", className)}
      {...props}
    >
      {formatRelativeTime(date, { locale, now, style: unitStyle })}
    </time>
  );
}

function InboxItemSubject({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="inbox-item-subject"
      className={cn("mt-0.5 block truncate text-sm text-foreground", className)}
      {...props}
    />
  );
}

function InboxItemPreview({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="inbox-item-preview"
      className={cn(
        "mt-0.5 block truncate text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function InboxItemFooter({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="inbox-item-footer"
      className={cn(
        "mt-1.5 flex items-center gap-1.5 text-sm text-foreground [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    />
  );
}

export {
  Inbox,
  InboxHeader,
  InboxTitle,
  InboxActions,
  InboxToolbar,
  InboxContent,
  InboxEmpty,
  InboxGroup,
  InboxItem,
  InboxItemHeader,
  InboxItemTitle,
  InboxItemTime,
  InboxItemSubject,
  InboxItemPreview,
  InboxItemFooter,
};
export type { InboxGroupProps, InboxItemProps, InboxItemTimeProps };
