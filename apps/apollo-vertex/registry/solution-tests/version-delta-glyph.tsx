"use client";

import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VersionDeltaGlyphProps {
  direction: number;
  baseline?: string | null;
}

export const VersionDeltaGlyph = ({
  direction,
  baseline,
}: VersionDeltaGlyphProps) => {
  const { t } = useTranslation();
  if (direction === 0) return null;

  const label = t("version_differs_from_baseline");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="text-foreground"
          // Inspecting the delta must not trigger an enclosing row's action.
          onClick={(e) => e.stopPropagation()}
        >
          {direction > 0 ? "▲" : "▼"}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {baseline ? `${label} (${baseline})` : label}
      </TooltipContent>
    </Tooltip>
  );
};
