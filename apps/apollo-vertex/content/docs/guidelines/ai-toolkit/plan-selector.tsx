"use client";

import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AiCaveat } from "@/registry/ai-caveat/ai-caveat";
import { Card } from "@/registry/card/card";
import { AiIcon } from "./ai-icon";

// Text-safe gradient fill (white text, AA) for the "Agent pick" badge.
const FILL = "var(--ai-gradient-fill)";

type Plan = {
  id: string;
  name: string;
  price: string;
  specs: string;
  chips: string[];
  // The agent's recommendation renders as the AI selectable variant.
  ai?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "pro",
    name: "Business Pro",
    price: "$55/line/mo",
    specs:
      "Unlimited talk/text/data · 50 GB hotspot · 5 GB intl roaming · priority data",
    chips: ["Matches SE usage", "MSA tier 2"],
    ai: true,
  },
  {
    id: "essentials",
    name: "Business Essentials",
    price: "$40/line/mo",
    specs: "Unlimited talk/text/data · 15 GB hotspot · no roaming",
    chips: ["$180/mo cheaper total", "No international"],
  },
  {
    id: "unlimited",
    name: "Business Unlimited+",
    price: "$75/line/mo",
    specs: "Unlimited talk/text/data · 100 GB hotspot · 30 GB intl",
    chips: ["$240/mo more", "Likely over-spec"],
  },
];

/** A guided plan picker: the agent's pick is the AI selectable variant, the rest standard. */
export function PlanSelector() {
  const [selected, setSelected] = useState(PLANS[0].id);

  return (
    <div>
      <svg width={0} height={0} aria-hidden="true" className="absolute">
        <defs>
          <linearGradient
            id="ai-plan-gradient"
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

      <h4 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
        Which plan tier for the Denver lines?
      </h4>

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-background/50 p-3">
        <AiIcon
          className="mt-0.5 size-4 shrink-0"
          gradientId="ai-plan-gradient"
        />
        <p className="text-sm text-muted-foreground">
          Your T-Mobile MSA includes three business tiers. Based on the SE
          team&apos;s usage, Business Pro fits.
        </p>
      </div>

      <div className="space-y-3">
        {PLANS.map((plan) => {
          const isSelected = selected === plan.id;
          return (
            <Card
              key={plan.id}
              selectable={plan.ai ? "ai" : "standard"}
              selected={isSelected}
              onClick={() => setSelected(plan.id)}
              // Match the page's unified glass; selected keeps its solid bg-card cue.
              className={
                isSelected
                  ? ""
                  : "bg-[var(--ai-glass)] dark:bg-[var(--ai-glass)]"
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {plan.name}
                    </span>
                    {plan.ai && (
                      <Badge
                        className="border-0 text-white"
                        style={{ background: FILL }}
                      >
                        <AiIcon className="size-3" />
                        Agent pick
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.specs}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {plan.chips.map((chip) => (
                      <Badge key={chip} variant="secondary">
                        {chip}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <span className="font-bold whitespace-nowrap text-foreground">
                    {plan.price}
                  </span>
                  {isSelected ? (
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-4" aria-hidden="true" />
                    </span>
                  ) : (
                    <span className="size-6 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <AiCaveat />

      <div className="mt-5 flex justify-end">
        <Button>
          Continue
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
