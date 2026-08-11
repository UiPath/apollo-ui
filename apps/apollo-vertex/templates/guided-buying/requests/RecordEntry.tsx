"use client";

import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { avatarColorFor } from "./avatar-color";

/** The Microsoft Teams glyph, copied from the intake flow's Teams resume
 * band (`TeamsResumeCard.tsx`) rather than sourced from an icon set — that
 * file hardcodes it at a single size with no props, so this is a second
 * copy of the same markup at a different size, not a shared/parameterized
 * component. Any future need to make the intake asset itself configurable
 * is a separate, shared-component change. */
export function TeamsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <rect width="20" height="20" rx="5" fill="#5059C9" />
      <g transform="translate(3.25 3.25) scale(0.84)" fill="white">
        <path d="M9.186 4.797a2.42 2.42 0 1 0-2.86-2.448h1.178c.929 0 1.682.753 1.682 1.682v.766Zm-4.295 7.738h2.613c.929 0 1.682-.753 1.682-1.682V5.58h2.783a.7.7 0 0 1 .682.716v4.294a4.197 4.197 0 0 1-4.093 4.293c-1.618-.04-3-.99-3.667-2.35Zm10.737-9.372a1.674 1.674 0 1 1-3.349 0 1.674 1.674 0 0 1 3.349 0Zm-2.238 9.488c-.04 0-.08 0-.12-.002a5.19 5.19 0 0 0 .381-2.07V6.306a1.692 1.692 0 0 0-.15-.725h1.792c.39 0 .707.317.707.707v3.765a2.598 2.598 0 0 1-2.598 2.598h-.013Z" />
        <path d="M.682 3.349h6.822c.377 0 .682.305.682.682v6.822a.682.682 0 0 1-.682.682H.682A.682.682 0 0 1 0 10.853V4.03c0-.377.305-.682.682-.682Zm5.206 2.596v-.72h-3.59v.72h1.357V9.66h.87V5.945h1.363Z" />
      </g>
    </svg>
  );
}

/** Inline byline marker for a Teams-sourced message. Grouped with the
 * author name (never the timestamp) so the two never separate; the icon is
 * decorative on its own, so the marker carries its own accessible label
 * rather than relying on the visible "Teams" text alone. */
function TeamsMarker() {
  return (
    <span
      className="flex items-center gap-1 text-[11px] text-muted-foreground"
      aria-label="via Teams"
    >
      <TeamsIcon size={10} />
      Teams
    </span>
  );
}

/** One record entry — a person's message or an agent action, same alignment
 * either way: avatar, name + timestamp on one line, content beneath. This is
 * a record, not a conversation, so nothing is left/right-aligned or bubbled
 * to imply a back-and-forth — every entry reads the same way down the page.
 * Shared between the requester's Communication card and the approver's. */
export function RecordEntry({
  name,
  initials,
  timestamp,
  text,
  isPerson,
  provenance,
}: {
  name: string;
  /** Avatar initials — person entries only, ignored for agent entries. */
  initials?: string;
  timestamp?: string;
  text: string;
  isPerson: boolean;
  /** The Teams channel this message came through, when it did — Teams and
   * the app are two windows onto the same thread, so only the Teams-sourced
   * side needs a marker; app-composed entries pass nothing. Only whether
   * this is present matters here (the channel name itself isn't shown in
   * the byline); rendered as an inline icon + "Teams" next to the author
   * name, never as a separate line. */
  provenance?: string;
}) {
  const avatarColor = avatarColorFor(name);
  return (
    <div className="flex items-start gap-2.5">
      {isPerson ? (
        <div
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold",
            avatarColor.bg,
            avatarColor.fg,
          )}
        >
          {initials ?? "?"}
        </div>
      ) : (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-insight-50 text-insight-600 dark:bg-insight-900">
          <AiMark size={11} gradientId="gb-ai-mark" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="flex shrink-0 items-baseline gap-1.5">
            <span className="text-[11px] font-medium text-foreground">
              {name}
            </span>
            {provenance != null && <TeamsMarker />}
          </span>
          {timestamp != null && (
            <span className="text-[11px] text-muted-foreground">
              {timestamp}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-foreground">{text}</p>
      </div>
    </div>
  );
}
