"use client";

import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

/** Top-level verdict tally across all compared documents. */
export const SummaryBar = ({
  different,
  semanticallySame,
  identical,
}: {
  different: number;
  semanticallySame: number;
  identical: number;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge status={different > 0 ? "error" : "success"} variant="secondary">
        {t("ixp_count_different", { count: different })}
      </Badge>
      {semanticallySame > 0 && (
        <Badge status="warning" variant="secondary">
          {t("ixp_count_semantically_same", { count: semanticallySame })}
        </Badge>
      )}
      <Badge status="info" variant="secondary">
        {t("ixp_count_identical", { count: identical })}
      </Badge>
    </div>
  );
};
