"use client";

import { Info } from "lucide-react";
import type * as React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface AiCaveatProps {
  /** `standalone` (default): icon + text. `withMark`: text only, indented to sit under an identity mark. */
  variant?: "standalone" | "withMark";
  /** Caveat copy. Defaults to the approved disclosure string. */
  children?: React.ReactNode;
  className?: string;
}

/** A quiet fallibility disclosure for AI-generated content. */
export function AiCaveat({
  variant = "standalone",
  children,
  className,
}: AiCaveatProps) {
  const { t } = useTranslation();
  const defaultCopy = t("ai_caveat_default", {
    defaultValue: "The output is AI generated. Please review.",
  });

  if (variant === "withMark") {
    return (
      <span
        className={cn("block pl-5 text-xs text-muted-foreground", className)}
      >
        {children ?? defaultCopy}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "mt-4 flex items-start gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      <span>{children ?? defaultCopy}</span>
    </span>
  );
}
