"use client";

import { Ban, CircleCheck } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  fitsSurface,
  type OccupantSpec,
  occupantOrientations,
  occupantPadding,
} from "@/lib/composition";
import { surfaceLabel } from "@/lib/surface-labels";
import type { Floor } from "./floor-probe";
import {
  claimedSurfaces,
  fitsAt,
  followedSurface,
  lowerLabel,
} from "./workbench-model";
import {
  defaultWidth,
  HOSTED_SURFACES,
  occupantInset,
  WIDTH_RANGE,
} from "./workbench-url-state";

/** Display labels as one sentence-case list: "Vertical, horizontal". */
const listOf = (labels: string[]) =>
  labels.map((label, i) => (i === 0 ? label : label.toLowerCase())).join(", ");

interface ResultProps {
  pass: boolean;
  /** How a failure reads: muted where it's information, red where it's a check. */
  failTone?: "muted" | "destructive";
  children: ReactNode;
}

function Result({ pass, failTone = "destructive", children }: ResultProps) {
  return (
    <li className="flex gap-2">
      {pass ? (
        <CircleCheck aria-hidden className="size-4 shrink-0 text-success" />
      ) : (
        <Ban
          aria-hidden
          className={
            failTone === "muted"
              ? "size-4 shrink-0 text-muted-foreground"
              : "size-4 shrink-0 text-destructive"
          }
        />
      )}
      <span className="min-w-0">{children}</span>
    </li>
  );
}

interface DetailsPanelProps {
  id: string;
  open: boolean;
  spec: OccupantSpec;
  surface: string;
  width: number;
  /** The worst floor across samples in this surface, while it's measured too. */
  floor: Floor | "measuring" | "unavailable";
  /** Overflow on the stage at the current width, when measured and it fits. */
  overflow: { width: number; problems: string[] } | null;
}

/** Where it fits, the spec, the checks the page can run live, and links. */
export function DetailsPanel({
  id,
  open,
  spec,
  surface,
  width,
  floor,
  overflow,
}: DetailsPanelProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<"copied" | "failed" | null>(null);
  const copyLink = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => setCopied("copied"))
      .catch(() => setCopied("failed"));
  };
  const follows = followedSurface(spec);
  const floorText =
    floor === "measuring"
      ? t("workbench_measuring")
      : floor === "unavailable"
        ? t("workbench_floor_unavailable")
        : floor === "clips"
          ? t("workbench_floor_none")
          : t(
              floor <= WIDTH_RANGE.min
                ? "workbench_floor_lowest"
                : "workbench_floor_value",
              { width: floor, surface: lowerLabel(surface) },
            );
  // The surface's width, padding included: the box every width here uses.
  const inset = occupantInset(spec);
  const specRows: [string, string][] = [
    [
      t("workbench_spec_surfaces"),
      claimedSurfaces(spec)
        .map((s) => surfaceLabel(s.name))
        .join(", ") || t("workbench_fits_none"),
    ],
    [
      t("workbench_spec_orientation"),
      listOf(occupantOrientations(spec).map((o) => t(`workbench_value_${o}`))),
    ],
    [
      t("workbench_spec_min_width"),
      follows
        ? t("workbench_follows", {
            surface: lowerLabel(follows.name),
            width: spec.requires.minWidth,
          })
        : inset > 0
          ? t("workbench_min_width_padded", {
              width: spec.requires.minWidth + inset,
              inner: spec.requires.minWidth,
            })
          : t("workbench_px", { width: spec.requires.minWidth }),
    ],
    [t("workbench_spec_floor"), floorText],
    [
      t("workbench_spec_padding"),
      t(`workbench_value_${occupantPadding(spec)}`),
    ],
    [t("workbench_spec_scroll"), t(`workbench_value_${spec.requires.scroll}`)],
  ];

  return (
    <aside
      id={id}
      aria-label={t("workbench_spec")}
      hidden={!open}
      className="flex w-80 shrink-0 flex-col gap-6 overflow-y-auto border-s border-border p-4 text-sm"
    >
      <section>
        <h2 className="mb-2 font-semibold">{t("workbench_where_it_fits")}</h2>
        <ul className="flex flex-col gap-1.5">
          {HOSTED_SURFACES.map((s) => {
            const result = fitsSurface(s, spec);
            return (
              <Result key={s.name} pass={result.fits} failTone="muted">
                <span className="font-medium">{surfaceLabel(s.name)}</span>
                <span className="block text-muted-foreground">
                  {result.fits ? t("workbench_fits") : result.reasons[0]}
                </span>
              </Result>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">{t("workbench_spec")}</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          {specRows.map(([term, value]) => (
            <div key={term} className="contents">
              <dt className="text-muted-foreground">{term}</dt>
              <dd data-workbench-spec={term}>{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-muted-foreground">
          {t("workbench_widths_note")}
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">{t("workbench_checks")}</h2>
        <ul data-workbench-checks className="flex flex-col gap-1.5">
          {HOSTED_SURFACES.map((s) => {
            // The selected surface at the chosen width; the others where they start.
            const at = s.name === surface ? width : defaultWidth(spec, s.name);
            const result = fitsAt(s, spec, at);
            return (
              <Result key={s.name} pass={result.fits}>
                {t("workbench_check_fits", {
                  surface: surfaceLabel(s.name),
                  width: at,
                })}
                {result.reasons.map((reason) => (
                  <span key={reason} className="block text-muted-foreground">
                    {reason}
                  </span>
                ))}
              </Result>
            );
          })}
          {overflow && (
            <Result pass={overflow.problems.length === 0}>
              <span data-workbench-overflow>
                {t(
                  overflow.problems.length === 0
                    ? "workbench_check_overflow_none"
                    : "workbench_check_overflow",
                  { width: overflow.width },
                )}
              </span>
              {overflow.problems.slice(0, 3).map((problem) => (
                <span key={problem} className="block text-muted-foreground">
                  {problem}
                </span>
              ))}
            </Result>
          )}
        </ul>
        <p className="mt-3 text-muted-foreground">
          {t("workbench_full_checks", { name: spec.name })}
        </p>
      </section>

      <div className="flex flex-col gap-2">
        <Button asChild variant="outline">
          <Link href={`/patterns/${spec.name}`}>
            {t("workbench_open_patterns")}
          </Link>
        </Button>
        <Button variant="outline" onClick={copyLink}>
          {t("workbench_copy_link")}
        </Button>
        <p aria-live="polite" className="text-muted-foreground">
          {copied &&
            t(
              copied === "copied"
                ? "workbench_link_copied"
                : "workbench_copy_failed",
            )}
        </p>
      </div>
    </aside>
  );
}
