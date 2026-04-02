"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { Card } from "@/registry/card/card";
import { AiStarIcon, topIssues } from "./shared";

const topIssuesPrompts = [
  "Which loan type has the most flagged compliance issues?",
  "What's causing the risk phrase flag rate to stay high?",
  "Which analysts have the highest flag rates on submissions?",
  "How can we reduce the property record mismatch rate?",
];

interface TopIssuesCardProps {
  onPromptClick: (q: string) => void;
}

export function TopIssuesCard({ onPromptClick }: TopIssuesCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    // perspective on the parent creates the 3-D viewing frustum
    <div className="row-span-2" style={{ perspective: 1200 }}>
      {/* framer-motion: rotateY 3D card flip — intrinsic to TopIssuesCard's
          AI prompt reveal interaction. Not driven by any page-level state. */}
      <motion.div
        className="relative h-full"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.6, 0, 0.4, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* ── Front face ───────────────────────────────────────────────────── */}
        <Card
          variant="glass"
          className="absolute inset-0 gap-0 p-4 overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-foreground">
              Top issues
            </p>
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-primary transition-colors hover:bg-primary/10"
            >
              <AiStarIcon className="h-3 w-3 flex-shrink-0" />
              <span className="text-[11.5px] font-medium">Ask Autopilot</span>
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {topIssues.map((issue) => (
              <div key={issue.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-foreground/80">
                    {issue.label}
                  </span>
                  <span className="ml-3 flex-shrink-0 text-[12px] font-medium text-foreground">
                    {issue.pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${issue.color}`}
                    style={{ width: `${issue.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Back face ────────────────────────────────────────────────────── */}
        <Card
          variant="glass"
          className="absolute inset-0 gap-0 p-4 overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AiStarIcon className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-semibold text-primary">
                AI ideas
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFlipped(false)}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {topIssuesPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onPromptClick(prompt)}
                className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-left text-[11px] leading-snug text-foreground/75 transition-all hover:border-primary/40 hover:bg-background hover:text-foreground"
              >
                {prompt}
              </button>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
