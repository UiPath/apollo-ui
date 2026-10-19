import { Slider } from '@uipath/apollo-wind';
import { useState } from 'react';
import type { GuardrailClassifierLabels } from '../i18n';

export interface ClassifierThresholdSliderProps {
  /** 0..1. */
  value: number;
  ariaLabel: string;
  labels: GuardrailClassifierLabels;
  onChange: (value: number) => void;
}

/** A question's 0..1 flag threshold, step 0.1, reported once per gesture on release. */
export function ClassifierThresholdSlider({
  value,
  ariaLabel,
  labels,
  onChange,
}: ClassifierThresholdSliderProps) {
  const [live, setLive] = useState(value);
  // State derived from a prop: an outside change moves the thumb, a drag in progress is kept.
  const [seeded, setSeeded] = useState(value);
  if (value !== seeded) {
    setSeeded(value);
    setLive(value);
  }

  // The label and value sit above the track, which takes the full row: beside it, a 280px panel
  // left the track too short for its legend.
  return (
    <div data-slot="classifier-threshold-slider" className="grid gap-1.5 pb-5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{labels.strictnessLabel}</span>
        <span className="tabular-nums">{Math.round(live * 100)}%</span>
      </div>
      <div className="relative min-w-0">
        <Slider
          value={[live]}
          min={0}
          max={1}
          step={0.1}
          aria-label={ariaLabel}
          onValueChange={([next]) => next !== undefined && setLive(next)}
          onValueCommit={([next]) => next !== undefined && onChange(next)}
        />
        {/* A legend for the scale's ends and middle: pinned to values, the labels collide on a
            short track. */}
        <span
          aria-hidden="true"
          className="absolute top-full left-0 mt-1 text-xs text-muted-foreground"
        >
          {labels.thresholdStrict}
        </span>
        <span
          aria-hidden="true"
          className="absolute top-full left-1/2 mt-1 -translate-x-1/2 text-xs text-muted-foreground"
        >
          {labels.thresholdBalanced}
        </span>
        <span
          aria-hidden="true"
          className="absolute top-full right-0 mt-1 text-xs text-muted-foreground"
        >
          {labels.thresholdLenient}
        </span>
      </div>
    </div>
  );
}
