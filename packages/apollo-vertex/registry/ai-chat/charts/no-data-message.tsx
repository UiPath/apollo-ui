"use client";

import { useVertexTranslation } from "@/lib/vertex-translation";

export function NoDataMessage() {
  const { t } = useVertexTranslation();
  return <p className="text-sm text-muted-foreground">{t("no_results")}</p>;
}
