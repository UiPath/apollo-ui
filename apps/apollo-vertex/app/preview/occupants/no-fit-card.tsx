"use client";

import { useTranslation } from "react-i18next";

interface NoFitCardProps {
  /** "Queue doesn't go in the page header", translated. */
  title: string;
  /** fits() reasons. */
  reasons: readonly string[];
}

/** Where the occupant doesn't go: why, from fits(), and what to change. */
export function NoFitCard({ title, reasons }: NoFitCardProps) {
  const { t } = useTranslation();
  return (
    <section
      data-slot="workbench-no-fit"
      aria-labelledby="workbench-no-fit"
      className="max-w-md rounded-lg border border-border bg-background p-6 shadow-sm"
    >
      <h3 id="workbench-no-fit" className="font-semibold">
        {title}
      </h3>
      <ul className="mt-2 list-disc ps-5 text-sm text-muted-foreground">
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p className="mt-3 text-sm">{t("workbench_no_fit_hint")}</p>
    </section>
  );
}
