import { Link2 } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AiIcon } from "./ai-icon";
import { AstroidThinking } from "./astroid-thinking";

// Gradient backgrounds: the text-safe fill (white text, AA) and the soft tint
// (foreground text). The strong gradient is decorative only, so it is not used
// behind text here.
const FILL = "var(--ai-gradient-fill)";
const SOFT = "var(--ai-gradient)";
// Strong gradient for marks/fills without text (no a11y contrast concern).
const STRONG = "var(--ai-gradient-strong)";

function Mark({ className }: { className?: string }) {
  return <AiIcon className={className} />;
}

function Tile({
  label,
  children,
  className,
  description,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  description?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <div className="flex min-h-9 items-center">{children}</div>
      <div className="space-y-0.5">
        <span className="block text-[11px] font-medium text-muted-foreground">
          {label}
        </span>
        {description && (
          <span className="block text-[11px] leading-snug text-muted-foreground/70">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      <div className="flex flex-wrap gap-x-8 gap-y-5">{children}</div>
    </div>
  );
}

/** The small mark in context: section headers, badges, and buttons, by variant. */
export function MarkUsage() {
  return (
    <div className="my-6 space-y-8 rounded-xl border border-border px-6 py-6">
      <svg width={0} height={0} aria-hidden="true" className="absolute">
        <defs>
          <linearGradient
            id="ai-badge-gradient"
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
      <Group title="Section header">
        <Tile label="Header">
          <div className="flex w-64 items-center gap-1 border-b border-border pb-2 text-foreground">
            <AiIcon className="size-3.5" />
            <span className="text-lg font-semibold leading-tight tracking-tight">
              AI insights
            </span>
          </div>
        </Tile>
      </Group>

      <Group title="Badges">
        <Tile
          label="Solid"
          description="Highest emphasis. Low-density spots with room, like a page header or a single featured card."
          className="w-44"
        >
          <Badge className="border-0 text-white" style={{ background: FILL }}>
            <Mark />
            Picked for you
          </Badge>
        </Tile>
        <Tile
          label="Soft"
          description="Medium emphasis. The default inside cards and content."
          className="w-44"
        >
          <Badge
            className="border-0 text-foreground"
            style={{ background: SOFT }}
          >
            <Mark />
            AI suggested
          </Badge>
        </Tile>
        <Tile
          label="Outline"
          description="Lowest emphasis. Dense contexts like tables, lists, and toolbars."
          className="w-44"
        >
          <Badge
            variant="outline"
            className="border-transparent"
            style={{
              backgroundImage:
                "linear-gradient(var(--background), var(--background)), var(--ai-gradient-strong)",
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
            }}
          >
            <AiIcon gradientId="ai-badge-gradient" />
            <span
              style={{
                backgroundImage: "var(--ai-gradient-text)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              AI generated
            </span>
          </Badge>
        </Tile>
      </Group>

      <p className="max-w-prose text-sm text-muted-foreground">
        The label is sample text. Any AI label can take any variant, so choose
        the variant by screen density and where the badge sits, not by the label.
        The caveat that AI can make mistakes is separate: it is not a badge
        passenger in any variant. It belongs to the surface around the content,
        shown once at the recommendation or action level.
      </p>

      <Group title="Buttons">
        <Tile label="Solid" description="Highest emphasis. The primary action in a view. Use one at a time." className="w-44">
          <Button
            size="sm"
            className="border-0 text-white hover:opacity-90"
            style={{ background: FILL }}
          >
            <Mark className="size-3" />
            Ask AI
          </Button>
        </Tile>
        <Tile label="Soft" description="Medium emphasis. Supporting actions inside cards and content." className="w-44">
          <Button
            size="sm"
            variant="outline"
            className="border-0 text-foreground hover:text-foreground hover:opacity-90"
            style={{ background: SOFT }}
          >
            <Mark className="size-3" />
            Summarize
          </Button>
        </Tile>
        <Tile label="Outline" description="Lowest emphasis. Inline or dense placements, and tertiary actions." className="w-44">
          <Button
            size="sm"
            variant="outline"
            className="border-transparent hover:opacity-90 dark:border-transparent"
            style={{
              backgroundImage:
                "linear-gradient(var(--background), var(--background)), var(--ai-gradient-strong)",
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
            }}
          >
            <AiIcon className="size-3" gradientId="ai-badge-gradient" />
            <span
              style={{
                backgroundImage: "var(--ai-gradient-text)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Draft with AI
            </span>
          </Button>
        </Tile>
      </Group>

      <p className="max-w-prose text-sm text-muted-foreground">
        The label is sample text. Any AI action can take any variant, so choose
        the variant by how prominent the action should be and how dense the
        surface is, not by the label. Keep one solid action per view so the
        primary choice stays clear.
      </p>

      <Group title="Timeline marker">
        <Tile label="Upcoming" className="w-20">
          <span className="flex size-7 items-center justify-center rounded-full border-2 border-dotted border-insight-300 text-insight-400">
            <AiIcon className="size-3.5" />
          </span>
        </Tile>
        <Tile label="In progress" className="w-20">
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
            <AiIcon className="size-3.5" gradientId="ai-badge-gradient" />
          </span>
        </Tile>
        <Tile label="Complete (gradient)" className="w-20">
          <span
            className="flex size-7 items-center justify-center rounded-full text-white"
            style={{ background: STRONG }}
          >
            <AiIcon className="size-3.5" />
          </span>
        </Tile>
        <Tile label="Complete (solid)" className="w-20">
          <span className="flex size-7 items-center justify-center rounded-full bg-insight-600 text-white">
            <AiIcon className="size-3.5" />
          </span>
        </Tile>
        <Tile label="In a timeline">
          <div className="flex gap-3 pt-1">
            <div className="flex flex-col items-center">
              <span
                className="flex size-7 items-center justify-center rounded-full text-white"
                style={{ background: STRONG }}
              >
                <AiIcon className="size-3.5" />
              </span>
              <span className="my-1 min-h-4 w-px flex-1 bg-border" />
            </div>
            <div className="pb-2">
              <p className="text-sm font-medium text-foreground">
                Sourced 3 vendors
              </p>
              <p className="text-xs text-muted-foreground">
                Compared price, warranty, and lead time
              </p>
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground/70">
                <Link2 className="size-3 shrink-0" />
                From{" "}
                <a href="#" className="text-primary hover:underline">
                  Coupa catalog
                </a>
                {" "}and{" "}
                <a href="#" className="text-primary hover:underline">
                  2 supplier quotes
                </a>
              </p>
            </div>
          </div>
        </Tile>
      </Group>

      <p className="max-w-prose text-sm text-muted-foreground">
        Source line. When an AI step drew on retrieved data, name where it came
        from so the result is explainable and the user can trace it back. The
        names link to the source.
      </p>

      <Group title="Thinking">
        <Tile label="Idle" className="w-20">
          <AstroidThinking isThinking={false} />
        </Tile>
        <Tile label="Thinking" className="w-20">
          <AstroidThinking />
        </Tile>
      </Group>
    </div>
  );
}
