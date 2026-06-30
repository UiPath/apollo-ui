"use client";

import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { IxpVerdict } from "../schema";

export const VerdictBadge = ({ verdict }: { verdict: string }) => {
  const { t } = useTranslation();
  switch (verdict) {
    case IxpVerdict.Different:
      return (
        <Badge status="error" variant="outline">
          {t("ixp_verdict_different")}
        </Badge>
      );
    case IxpVerdict.SemanticallySame:
      return (
        <Badge status="warning" variant="outline">
          {t("ixp_verdict_semantically_same")}
        </Badge>
      );
    case IxpVerdict.Identical:
      return (
        <Badge status="info" variant="outline">
          {t("ixp_verdict_identical")}
        </Badge>
      );
    default:
      return (
        <Badge status="info" variant="outline">
          {verdict}
        </Badge>
      );
  }
};
