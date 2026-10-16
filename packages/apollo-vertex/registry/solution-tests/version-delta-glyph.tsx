"use client";

import { useVertexTranslation } from "@/lib/vertex-translation";

interface VersionDeltaGlyphProps {
  direction: number;
}

export const VersionDeltaGlyph = ({ direction }: VersionDeltaGlyphProps) => {
  const { t } = useVertexTranslation();
  if (direction === 0) return null;

  return (
    <span role="img" aria-label={t("version_differs_from_baseline")}>
      {direction > 0 ? "▲" : "▼"}
    </span>
  );
};
