import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AiCaveat } from "@/registry/ai-caveat/ai-caveat";
import { AiGlow } from "@/registry/ai-glow/ai-glow";
import { AiIcon } from "./ai-icon";
import { AiInput } from "./ai-input";
import { AiInputField } from "./ai-input-field";
import { InputField } from "./input-field";
import { SelectableCards } from "./selectable-cards";

function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      {children}
      <span className="block text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

/** AI surfaces: the chat input (with the AI focus border) and cards for AI output. */
export function Surfaces() {
  return (
    <div className="my-6 space-y-14">
      {/* Shared mark gradient, referenced by the cards below. */}
      <svg width={0} height={0} aria-hidden="true" className="absolute">
        <defs>
          <linearGradient
            id="ai-card-gradient"
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
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Chat input
        </h3>
        <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
          <Block label="Default">
            <AiInput />
          </Block>
          <Block label="Focus · AI gradient border">
            <AiInput forceFocus defaultValue="Summarize Q3 results" />
          </Block>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Input</h3>
        <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
          <Block label="Default">
            <InputField />
          </Block>
          <Block label="AI variant · Experiment">
            <AiInputField />
          </Block>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Card (Primary)
        </h3>
        <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
          <Block label="Glass · AI gradient shadow">
            <div className="relative">
              <AiGlow />
              <Card
                variant="glass"
                className="relative gap-0 bg-[var(--ai-glass)] dark:bg-[var(--ai-glass)]"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-1 text-base leading-tight tracking-tight">
                    <AiIcon
                      className="size-3.5"
                      gradientId="ai-card-gradient"
                    />
                    <span
                      style={{
                        backgroundImage: "var(--ai-gradient-text)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                      }}
                    >
                      Coverage gap
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Several claims are missing documentation that may trigger a
                    denial.
                  </CardDescription>
                </CardHeader>
                <AiCaveat className="px-6" />
              </Card>
            </div>
          </Block>
          <Block label="Gradient subtle · no border">
            <Card
              variant="solid"
              className="gap-0 border-0"
              style={{ background: "var(--ai-gradient)" }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-1 text-base leading-tight tracking-tight text-insight-900 dark:text-insight-50">
                  <AiIcon className="size-3.5" />
                  Resubmit denied claims
                </CardTitle>
                <CardDescription className="text-insight-800 dark:text-insight-100">
                  12 have corrected modifiers ready and close their 90-day
                  window this week.
                </CardDescription>
              </CardHeader>
              <AiCaveat className="px-6" />
            </Card>
          </Block>
          <div className="sm:col-span-2">
            <Block label="Regular · icon lockup. Use with or without a border. Padding is built into the card surface.">
              <Card variant="solid">
                <CardContent className="flex items-start gap-2">
                  <AiIcon
                    className="mt-0.5 size-5 shrink-0"
                    gradientId="ai-card-gradient"
                  />
                  <div>
                    <p className="text-sm leading-relaxed text-foreground">
                      Matches your request. $350/unit cheaper with EPP applied.
                    </p>
                    <AiCaveat variant="withMark" className="pl-0" />
                  </div>
                </CardContent>
              </Card>
            </Block>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Card (selectable)
        </h3>
        <SelectableCards />
        <p className="mt-6 max-w-prose text-sm text-muted-foreground">
          Caveat footer. The glow and badge carry the confidence up top; the
          caveat sits quiet below, marked by a small info icon. Show it wherever
          AI generates content the user reads or acts on: recommendations,
          actions, and AI-generated insights. The mark, badges, and buttons are
          identity, not content, so they don&apos;t need it. Disclose once per
          surface: a footer on a single card, once under the mark for a group
          headed by the mark, and once below the group for a grid of
          equal-height cards.
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Card (Group)
        </h3>
        <Block label="Three glass cards over one shared, amorphous glow">
          <div className="relative max-w-3xl">
            <AiGlow variant="group" />
            <div className="relative">
              <svg width={0} height={0} aria-hidden="true" className="absolute">
                <defs>
                  <linearGradient
                    id="ai-group-gradient"
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
                <AiIcon className="size-3.5" gradientId="ai-group-gradient" />
                <span
                  className="text-sm font-bold leading-none tracking-tight"
                  style={{
                    backgroundImage: "var(--ai-gradient-text)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  AI Identity
                </span>
              </div>
              <AiCaveat variant="withMark" className="-mt-2 mb-3" />
              <div className="grid gap-4 sm:grid-cols-3">
                <Card
                  variant="glass"
                  className="bg-[var(--ai-glass)] dark:bg-[var(--ai-glass)]"
                >
                  <CardHeader>
                    <CardTitle className="text-base tracking-tight whitespace-nowrap">
                      Denials
                    </CardTitle>
                    <CardDescription>
                      Denial volume is trending down for the third straight
                      week.
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card
                  variant="glass"
                  className="bg-[var(--ai-glass)] dark:bg-[var(--ai-glass)]"
                >
                  <CardHeader>
                    <CardTitle className="text-base tracking-tight whitespace-nowrap">
                      Payer anomalies
                    </CardTitle>
                    <CardDescription>
                      Two payers are flagged for a closer look this cycle.
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card
                  variant="glass"
                  className="bg-[var(--ai-glass)] dark:bg-[var(--ai-glass)]"
                >
                  <CardHeader>
                    <CardTitle className="text-base tracking-tight whitespace-nowrap">
                      Forecast on track
                    </CardTitle>
                    <CardDescription>
                      Projected recoveries remain on pace for the quarter.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </Block>
      </div>
    </div>
  );
}
