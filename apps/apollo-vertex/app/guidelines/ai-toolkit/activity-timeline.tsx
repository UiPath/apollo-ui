import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/registry/avatar/avatar";
import { AiIcon } from "./ai-icon";

// Strong gradient for the completed-step marker (decorative, no text on it).
const STRONG = "var(--ai-gradient-strong)";

type TimelineEvent = {
  title: string;
  detail?: string;
  time?: string;
  // ai-upcoming: queued. ai-progress: running. ai-complete: done. user: a person acted.
  marker: "ai-upcoming" | "ai-progress" | "ai-complete" | "user";
  initials?: string;
  sources?: { label: string; href: string }[];
};

// A realistic invoice review trail, newest first, mixing agent and human steps.
const ACTIVITY: TimelineEvent[] = [
  {
    title: "Sync to ERP",
    detail: "Queued for the next run",
    marker: "ai-upcoming",
  },
  {
    title: "Posting entry",
    detail: "Writing to the ledger",
    time: "9:16 AM",
    marker: "ai-progress",
  },
  {
    title: "Approved",
    detail: "Peter Vachon",
    time: "9:14 AM",
    marker: "user",
    initials: "PV",
  },
  {
    title: "Agent reviewed",
    detail: "PO matched, terms verified",
    time: "9:10 AM",
    marker: "ai-complete",
    sources: [
      { label: "PO #8801", href: "#" },
      { label: "vendor terms", href: "#" },
    ],
  },
  {
    title: "Data extracted",
    detail: "Invoice parsed successfully",
    time: "9:08 AM",
    marker: "ai-complete",
  },
];

function Marker({ event }: { event: TimelineEvent }) {
  if (event.marker === "user") {
    return (
      <Avatar className="size-7">
        <AvatarFallback className="text-[11px] font-medium text-muted-foreground">
          {event.initials}
        </AvatarFallback>
      </Avatar>
    );
  }

  if (event.marker === "ai-upcoming") {
    return (
      <span className="flex size-7 items-center justify-center rounded-full border-2 border-dotted border-insight-300 text-insight-400">
        <AiIcon className="size-3.5" />
      </span>
    );
  }

  if (event.marker === "ai-progress") {
    return (
      <span className="relative flex size-7 items-center justify-center rounded-full bg-insight-50 text-insight-600 dark:bg-insight-900">
        <span
          className="absolute inset-0 animate-spin rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent, var(--insight-600))",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
          }}
        />
        <AiIcon className="size-3.5" gradientId="ai-timeline-gradient" />
      </span>
    );
  }

  // ai-complete: strong gradient fill with the white mark.
  return (
    <span
      className="flex size-7 items-center justify-center rounded-full text-white"
      style={{ background: STRONG }}
    >
      <AiIcon className="size-3.5" />
    </span>
  );
}

/** A mixed AI and user activity timeline. AI steps carry the mark; people appear as avatars. */
export function ActivityTimeline() {
  return (
    <>
      <svg width={0} height={0} aria-hidden="true" className="absolute">
        <defs>
          <linearGradient
            id="ai-timeline-gradient"
            x1="2"
            y1="4"
            x2="22"
            y2="20"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="var(--ai-gradient-start)" />
            <stop offset="1" stopColor="var(--ai-gradient-end)" />
          </linearGradient>
        </defs>
      </svg>
      <ol className="max-w-md">
        {ACTIVITY.map((event, idx) => {
          const last = idx === ACTIVITY.length - 1;
          return (
            <li key={event.title} className="flex gap-3">
              <div className="flex flex-col items-center">
                <Marker event={event} />
                {!last && <span className="my-1 w-px flex-1 bg-border" />}
              </div>
              <div className={cn("flex-1", last ? "pb-0" : "pb-7")}>
                <div className="flex min-h-7 items-center justify-between gap-4">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      event.marker === "ai-upcoming"
                        ? "text-muted-foreground"
                        : "text-foreground",
                    )}
                  >
                    {event.title}
                  </p>
                  {event.time && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {event.time}
                    </span>
                  )}
                </div>
                {event.detail && (
                  <p className="-mt-0.5 text-xs text-muted-foreground">
                    {event.detail}
                  </p>
                )}
                {event.sources && event.sources.length > 0 && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground/70">
                    <Link2 className="size-3 shrink-0" />
                    From{" "}
                    {event.sources.map((s, i) => (
                      <span key={s.label}>
                        {i > 0 && " and "}
                        <a
                          href={s.href}
                          className="text-primary hover:underline"
                        >
                          {s.label}
                        </a>
                      </span>
                    ))}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
