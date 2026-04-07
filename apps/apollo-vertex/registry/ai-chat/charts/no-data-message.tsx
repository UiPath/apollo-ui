"use client";

import { useTranslation } from "react-i18next";

export function NoDataMessage() {
  const { t } = useTranslation();

  return (
    <p className="text-sm text-muted-foreground">{t("no_data_to_display")}</p>
  );
}
