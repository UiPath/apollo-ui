"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { OCCUPANT_SPECS } from "@/lib/occupants.generated";
import { surfaceLabel } from "@/lib/surface-labels";
import { cn } from "@/lib/utils";
import { claimedSurfaces } from "./workbench-model";

interface OccupantListProps {
  id: string;
  open: boolean;
  selected: string;
  onSelect: (name: string) => void;
  /** Where "Back to docs" goes. */
  docsHref: string;
}

/** Every registered occupant, searchable, with the surfaces it fits. */
export function OccupantList({
  id,
  open,
  selected,
  onSelect,
  docsHref,
}: OccupantListProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const listed = OCCUPANT_SPECS.filter(({ spec }) =>
    spec.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <aside
      id={id}
      aria-label={t("workbench_occupants")}
      hidden={!open}
      className="flex w-66 shrink-0 flex-col border-e border-border"
    >
      <div className="flex flex-col gap-3 p-4">
        <Link
          href={docsHref}
          data-workbench-back
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {t("workbench_back_to_docs")}
        </Link>
        <div>
          <h1 className="text-base font-semibold">{t("workbench_title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("workbench_subtitle")}
          </p>
        </div>
        <Input
          type="search"
          aria-label={t("workbench_search")}
          placeholder={t("workbench_search")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2">
        {listed.map(({ spec }) => {
          const isSelected = spec.name === selected;
          const where = claimedSurfaces(spec).map((s) => surfaceLabel(s.name));
          return (
            <li key={spec.name}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(spec.name)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-start outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected && "bg-accent text-accent-foreground",
                )}
              >
                <span className="block text-sm font-medium">{spec.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {where.length > 0
                    ? where.join(", ")
                    : t("workbench_fits_none")}
                </span>
              </button>
            </li>
          );
        })}
        {listed.length === 0 && (
          <li className="px-3 py-2 text-sm text-muted-foreground">
            {t("workbench_no_matches")}
          </li>
        )}
      </ul>
      <div className="border-t border-border p-4">
        <Link
          href="/guidelines/design-architecture/creating-occupants"
          className="text-sm text-primary underline underline-offset-2"
        >
          {t("workbench_creating_occupants")}
        </Link>
      </div>
    </aside>
  );
}
