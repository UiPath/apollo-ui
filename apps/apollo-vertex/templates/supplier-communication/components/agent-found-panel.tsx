"use client";

import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import type { SupplierCase } from "../data/supplier-cases";

interface AgentFoundPanelProps {
  sor: NonNullable<SupplierCase["sor"]>;
  source?: string;
  className?: string;
}

/**
 * The system-of-record read, as a bounded panel with an AI-marked header.
 *
 * The mark sits on the header only. Choosing what to look up and which fields
 * answer the question is the agent's working, so the mark belongs at that
 * boundary, per the toolkit's "mark the group once" rule. The values themselves
 * are deterministic tool calls, which is why the audit log tags SAP retrieval
 * as `system` and why marking the values would contradict it.
 *
 * No caveat footer: these are retrieved facts, not generated content, so
 * disclosure stays once per case on the compose card.
 */
export function AgentFoundPanel({
  sor,
  source,
  className,
}: AgentFoundPanelProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border",
        className,
      )}
    >
      <div
        className="flex items-center gap-2 border-b border-border px-4 py-2.5"
        style={{ backgroundImage: "var(--ai-gradient)" }}
      >
        <AiMark
          size={12}
          className="shrink-0 text-insight-600 dark:text-insight-300"
        />
        <h3 className="text-sm font-semibold text-foreground">
          What the agent found
        </h3>
      </div>

      <div className="px-4 py-1.5">
        <dl className="divide-y divide-border">
          {sor.map(([key, value]) => (
            <div
              key={key}
              className="flex items-baseline justify-between gap-6 py-2"
            >
              <dt className="shrink-0 text-sm text-muted-foreground">{key}</dt>
              <dd className="min-w-0 text-right text-sm text-foreground">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        {source && (
          <p className="flex items-center gap-1.5 border-t border-border py-2.5 text-xs text-muted-foreground">
            <Link2 className="size-3 shrink-0" aria-hidden />
            {`From ${source}`}
          </p>
        )}
      </div>
    </div>
  );
}
