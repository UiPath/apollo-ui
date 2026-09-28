import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AiCaveat } from "@/registry/ai-caveat/ai-caveat";
import { AiGlow } from "@/registry/ai-glow/ai-glow";
import { AiIcon } from "./ai-icon";

// Accessible gradient for the clipped-text group header (lifts in dark mode).
const TEXT_GRADIENT = "var(--ai-gradient-text)";
// Soft tint for the AI action button (foreground text).
const SOFT = "var(--ai-gradient)";

// Recommended actions content: each card has its own copy, metrics, and action.
const RECOMMENDATIONS = [
  {
    id: "a",
    title: "Verify coverage pre-service",
    description:
      "Automate batch eligibility checks 3 days before service date and flag inactive policies for patient outreach",
    metrics: [
      { value: "$431.5K", label: "revenue impact" },
      { value: "11.7%", label: "of total denials" },
      { value: "129", label: "related denials" },
    ],
    cta: "Automate checks",
  },
  {
    id: "b",
    title: "Correct coding mismatches",
    description:
      "Deploy coding scrubbers that cross-reference NCCI edits and payer modifier rules before claim generation",
    metrics: [
      { value: "$288.7K", label: "revenue impact" },
      { value: "15.6%", label: "of total denials" },
      { value: "87", label: "related denials" },
    ],
    cta: "Enable coding scrubber",
  },
];

function RecommendationCard({
  action,
}: {
  action: (typeof RECOMMENDATIONS)[number];
}) {
  return (
    <Card
      variant="glass"
      className="flex h-full flex-col gap-4 bg-[var(--ai-glass)] dark:bg-[var(--ai-glass)] p-5"
    >
      <div>
        <p className="font-semibold tracking-tight text-foreground">
          {action.title}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {action.description}
        </p>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {action.metrics.map((metric) => (
          <div key={metric.label}>
            <p className="text-lg font-bold text-foreground">{metric.value}</p>
            <p className="text-xs text-muted-foreground">{metric.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-end gap-2 pt-4">
        <Button variant="ghost" size="sm">
          Ignore
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-0 text-foreground hover:text-foreground hover:opacity-90"
          style={{ background: SOFT }}
        >
          {action.cta}
        </Button>
      </div>
    </Card>
  );
}

/** Recommended actions: glass cards over one shared glow, under an AI group header. */
export function RecommendedActions() {
  return (
    <div className="relative max-w-4xl">
      {/* One shared, amorphous glow behind the whole group. */}
      <AiGlow variant="group" />
      <div className="relative">
        <svg width={0} height={0} aria-hidden="true" className="absolute">
          <defs>
            <linearGradient
              id="ai-recs-gradient"
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
        <div className="mb-3 flex items-center gap-1.5">
          <AiIcon className="size-3.5" gradientId="ai-recs-gradient" />
          <span
            className="text-sm font-bold leading-none tracking-tight"
            style={{
              backgroundImage: TEXT_GRADIENT,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Recommended actions
          </span>
        </div>
        <AiCaveat variant="withMark" className="-mt-2 mb-3" />
        <div className="grid gap-4 sm:grid-cols-2">
          {RECOMMENDATIONS.map((action) => (
            <RecommendationCard key={action.id} action={action} />
          ))}
        </div>
      </div>
    </div>
  );
}
