"use client";

import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { IxpVerdict } from "../schema";

const VERDICT_CONFIG: Record<
  string,
  {
    status: "info" | "warning" | "error";
    labelKey:
      | "ixp_verdict_identical"
      | "ixp_verdict_semantically_same"
      | "ixp_verdict_different";
  }
> = {
  [IxpVerdict.Identical]: { status: "info", labelKey: "ixp_verdict_identical" },
  [IxpVerdict.SemanticallySame]: {
    status: "warning",
    labelKey: "ixp_verdict_semantically_same",
  },
  [IxpVerdict.Different]: {
    status: "error",
    labelKey: "ixp_verdict_different",
  },
};

export const VerdictBadge = ({ verdict }: { verdict: string }) => {
  const { t } = useTranslation();
  const config = VERDICT_CONFIG[verdict];
  return (
    <Badge status={config?.status ?? "info"} variant="outline">
      {config ? t(config.labelKey) : verdict}
    </Badge>
  );
};
