"use client";

import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import { DateTime } from "luxon";
import type { ComponentProps, ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Action } from "@/lib/action";
import {
  type DateInput,
  formatRelativeTime,
  toDateTime,
} from "@/lib/relative-time";
import { cn } from "@/lib/utils";
import { useVertexTranslation } from "@/lib/vertex-translation";
import { ActionButtons } from "./message-thread-actions";
import {
  type ExpansionOptions,
  useMessageThreadExpansion,
} from "./message-thread-expansion";

type MessageThreadNoticeStatus = "info" | "warning" | "error";

interface MessageThreadNotice {
  status: MessageThreadNoticeStatus;
  /** A badge on the collapsed row, and the alert title when expanded. */
  label: string;
  description?: string;
  /** Buttons under the description. The first one is the primary action. */
  actions?: readonly Action[];
}

interface MessageThreadMessage {
  id: string;
  /** Sender name; also gives the avatar its initials. */
  sender: string;
  /** Shown after the sender in both states. */
  senderEmail?: string;
  avatarSrc?: string;
  recipients?: readonly string[];
  sentAt: DateInput;
  /** Shown in the header, above the excerpt when collapsed. */
  subject?: string;
  /** Plain text. Line breaks are kept, and the collapsed row shows it on one line. */
  body: string;
  notice?: MessageThreadNotice;
  /** Buttons beside the header when expanded. The first one is the primary action. */
  actions?: readonly Action[];
  /** Below the body when expanded, e.g. a reply form. */
  footer?: ReactNode;
}

const NOTICE_ICONS = {
  info: Info,
  warning: TriangleAlert,
  error: CircleAlert,
} satisfies Record<MessageThreadNoticeStatus, unknown>;

const NOTICE_ALERT_STATUS = {
  info: "default",
  warning: "warning",
  error: "error",
} as const satisfies Record<MessageThreadNoticeStatus, string>;

function initials(name: string): string {
  return name
    .split(/\s+/u)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function oneLine(text: string): string {
  return text.replaceAll(/\s+/gu, " ").trim();
}

function SenderAvatar({ message }: { message: MessageThreadMessage }) {
  return (
    <Avatar className="size-8 shrink-0">
      {message.avatarSrc != null && (
        <AvatarImage src={message.avatarSrc} alt="" />
      )}
      <AvatarFallback className="text-xs font-medium text-muted-foreground">
        {initials(message.sender)}
      </AvatarFallback>
    </Avatar>
  );
}

function SentAt({ date }: { date: DateTime }) {
  const { i18n } = useVertexTranslation();
  const absolute = date
    .setLocale(i18n.language)
    .toLocaleString(DateTime.DATETIME_MED);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time
          dateTime={date.toISO() ?? ""}
          // Relative text depends on the current time, so server and client can differ by a unit
          suppressHydrationWarning
          // Hover-only: the header toggle already takes keyboard focus
          tabIndex={-1}
          className="shrink-0 whitespace-nowrap text-xs text-muted-foreground"
        >
          {formatRelativeTime(date, { locale: i18n.language })}
        </time>
      </TooltipTrigger>
      <TooltipContent>{absolute}</TooltipContent>
    </Tooltip>
  );
}

function NoticeBadge({ notice }: { notice: MessageThreadNotice }) {
  const Icon = NOTICE_ICONS[notice.status];

  return (
    <Badge status={notice.status} variant="secondary" className="shrink-0">
      <Icon />
      {notice.label}
    </Badge>
  );
}

function NoticeAlert({ notice }: { notice: MessageThreadNotice }) {
  const Icon = NOTICE_ICONS[notice.status];
  const hasDescription =
    notice.description != null || (notice.actions?.length ?? 0) > 0;

  return (
    <Alert status={NOTICE_ALERT_STATUS[notice.status]} visual="tinted">
      <Icon />
      <AlertTitle>{notice.label}</AlertTitle>
      {hasDescription && (
        <AlertDescription>
          {notice.description != null && <p>{notice.description}</p>}
          {notice.actions != null && notice.actions.length > 0 && (
            <ActionButtons
              actions={notice.actions}
              size="sm"
              className="mt-2 flex flex-wrap gap-2"
            />
          )}
        </AlertDescription>
      )}
    </Alert>
  );
}

function MessageHeaderContent({
  message,
  expanded,
}: {
  message: MessageThreadMessage;
  expanded: boolean;
}) {
  const { t, i18n } = useVertexTranslation();
  const date = toDateTime(message.sentAt);
  const recipients =
    message.recipients != null && message.recipients.length > 0
      ? new Intl.ListFormat(i18n.language, { type: "conjunction" }).format(
          message.recipients,
        )
      : null;

  return (
    <>
      <SenderAvatar message={message} />
      <span className="flex min-w-0 flex-1 flex-col leading-5">
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className="truncate font-semibold text-foreground">
            {message.sender}
          </span>
          {message.senderEmail != null && (
            <span className="truncate text-muted-foreground">
              {`<${message.senderEmail}>`}
            </span>
          )}
          <span className="ml-auto flex shrink-0 items-center gap-2 self-center pl-4">
            {!expanded && message.notice != null && (
              <NoticeBadge notice={message.notice} />
            )}
            {date.isValid && <SentAt date={date} />}
          </span>
        </span>
        {message.subject != null && (
          <span className="mt-0.5 truncate text-foreground">
            {message.subject}
          </span>
        )}
        {expanded ? (
          recipients != null && (
            <span className="mt-0.5 truncate text-muted-foreground">
              {t("to_recipients", { recipients })}
            </span>
          )
        ) : (
          <span className="mt-0.5 truncate text-muted-foreground">
            {oneLine(message.body)}
          </span>
        )}
      </span>
    </>
  );
}

const HEADER_CLASSES =
  "flex min-w-0 flex-1 items-start gap-3 rounded-lg px-2 py-2.5 text-left text-sm";

function MessageThreadItem({
  message,
  expanded,
  onToggle,
}: {
  message: MessageThreadMessage;
  expanded: boolean;
  /** Null when the message can't be collapsed. */
  onToggle: (() => void) | null;
}) {
  const header = <MessageHeaderContent message={message} expanded={expanded} />;

  return (
    <article
      data-slot="message-thread-message"
      data-state={expanded ? "expanded" : "collapsed"}
      className="border-t border-border py-1"
    >
      <div className="flex items-start gap-3">
        {onToggle == null ? (
          <div className={HEADER_CLASSES}>{header}</div>
        ) : (
          <button
            type="button"
            data-slot="message-thread-toggle"
            aria-expanded={expanded}
            onClick={onToggle}
            className={cn(
              HEADER_CLASSES,
              "cursor-pointer outline-none hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50",
            )}
          >
            {header}
          </button>
        )}
        {expanded && message.actions != null && message.actions.length > 0 && (
          <ActionButtons
            actions={message.actions}
            size="sm"
            className="flex shrink-0 items-center gap-2 pt-2"
          />
        )}
      </div>
      {expanded && (
        <div className="flex flex-col gap-4 pt-3 pr-2 pb-5 pl-13">
          {message.notice != null && <NoticeAlert notice={message.notice} />}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {message.body}
          </p>
          {message.footer != null && <div>{message.footer}</div>}
        </div>
      )}
    </article>
  );
}

interface MessageThreadProps
  extends Omit<ComponentProps<"ol">, "children">,
    ExpansionOptions {
  /** In the order they were sent, oldest first. */
  messages: readonly MessageThreadMessage[];
  order?: "newest-first" | "oldest-first";
}

/**
 * The latest message starts expanded, and so does each newer one that arrives. A thread of one
 * message always shows it expanded.
 */
function MessageThread({
  messages,
  order = "newest-first",
  expandedIds,
  defaultExpandedIds,
  onExpandedChange,
  className,
  ...props
}: MessageThreadProps) {
  const [expanded, toggle] = useMessageThreadExpansion(
    messages.map((message) => message.id),
    { expandedIds, defaultExpandedIds, onExpandedChange },
  );
  const ordered = order === "newest-first" ? messages.toReversed() : messages;
  const collapsible = messages.length > 1;

  return (
    <ol
      data-slot="message-thread"
      className={cn("flex flex-col", className)}
      {...props}
    >
      {ordered.map((message) => (
        <li key={message.id}>
          <MessageThreadItem
            message={message}
            expanded={!collapsible || expanded.includes(message.id)}
            onToggle={collapsible ? () => toggle(message.id) : null}
          />
        </li>
      ))}
    </ol>
  );
}

type MessageThreadBadgeStatus = "info" | "success" | "warning" | "error";

interface MessageThreadHeaderProps
  extends Omit<ComponentProps<"header">, "title" | "children"> {
  title: string;
  /** A status badge on the line below the title, e.g. "Open". */
  badge?: { label: string; status: MessageThreadBadgeStatus };
  /** Text on the line below the title, e.g. the message count. */
  meta?: string;
  /** Buttons beside the title. The first one is the primary action. */
  actions?: readonly Action[];
}

function MessageThreadHeader({
  title,
  badge,
  meta,
  actions,
  className,
  ...props
}: MessageThreadHeaderProps) {
  return (
    <header
      data-slot="message-thread-header"
      className={cn("pb-6", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-6">
        <h2 className="min-w-0 text-2xl font-bold leading-tight tracking-tight text-foreground">
          {title}
        </h2>
        {actions != null && actions.length > 0 && (
          <ActionButtons
            actions={actions}
            size="default"
            className="flex shrink-0 items-center gap-2"
          />
        )}
      </div>
      {(badge != null || meta != null) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          {badge != null && (
            <Badge status={badge.status} variant="secondary">
              {badge.label}
            </Badge>
          )}
          {meta != null && <span>{meta}</span>}
        </div>
      )}
    </header>
  );
}

export { MessageThread, MessageThreadHeader };
export type {
  MessageThreadHeaderProps,
  MessageThreadMessage,
  MessageThreadNotice,
  MessageThreadProps,
};
