"use client";

import { Ban, CircleCheck } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface DockProps {
  children: ReactNode;
}

/** The dock: one floating piece at the stage's bottom, above whatever the stage holds. */
export function Dock({ children }: DockProps) {
  return (
    <div
      data-slot="workbench-dock"
      className="absolute inset-x-4 bottom-6 z-10 mx-auto flex w-fit max-w-full flex-wrap items-center gap-4 rounded-xl border border-border bg-background/75 px-4 py-3 shadow-lg backdrop-blur-md"
    >
      {children}
    </div>
  );
}

interface FitIconProps {
  fits: boolean;
  /** How "doesn't fit" reads: muted as information, red as a failed check. */
  tone?: "muted" | "destructive";
  className?: string;
}

/** Fits, or doesn't: a check or a ban, never the only signal. */
export function FitIcon({ fits, tone = "muted", className }: FitIconProps) {
  if (fits)
    return (
      <CircleCheck aria-hidden className={cn("text-success", className)} />
    );
  return (
    <Ban
      aria-hidden
      className={cn(
        tone === "muted" ? "text-muted-foreground" : "text-destructive",
        className,
      )}
    />
  );
}

interface FitToggleGroupProps {
  /** The group's accessible name: "Surface", "Slot". */
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string; fits: boolean }[];
}

/** Pick one place (a surface, a slot), each marked fits or doesn't. */
export function FitToggleGroup({
  label,
  value,
  onChange,
  options,
}: FitToggleGroupProps) {
  const { t } = useTranslation();
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-label={label}
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          data-fits={option.fits}
          aria-label={t(
            option.fits ? "workbench_place_fits" : "workbench_place_no_fit",
            { place: option.label },
          )}
        >
          <FitIcon fits={option.fits} />
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

interface DockSliderProps {
  /** The thumb's accessible name. */
  label: string;
  /** Read out as the thumb's value. */
  valueText: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  /** Which width it sets: a surface's, or the template's page. */
  measures: "width" | "page-width";
  /** Marks under the track. */
  children?: ReactNode;
}

/** A width slider, and its value in px beside it. */
export function DockSlider({
  label,
  valueText,
  min,
  max,
  step,
  value,
  onChange,
  measures,
  children,
}: DockSliderProps) {
  const { t } = useTranslation();
  // The registry Slider's thumb takes no props, so it's named here.
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const thumb = ref.current?.querySelector("[role=slider]");
    thumb?.setAttribute("aria-label", label);
    thumb?.setAttribute("aria-valuetext", valueText);
  });
  return (
    <>
      <span ref={ref} className="relative block w-56 py-2">
        <Slider
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={([next]) => onChange(next ?? value)}
        />
        {children}
      </span>
      <output
        data-slot={`workbench-${measures}`}
        className="w-16 text-end text-sm tabular-nums"
      >
        {t("workbench_px", { width: value })}
      </output>
    </>
  );
}
