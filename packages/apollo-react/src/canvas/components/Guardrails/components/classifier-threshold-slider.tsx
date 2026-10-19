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

  return (
    <div data-slot="classifier-threshold-slider" className="flex items-center gap-3 pb-5">
      <span className="shrink-0 text-xs text-muted-foreground">{labels.strictnessLabel}</span>
      <div className="relative min-w-[220px] max-w-[360px] flex-1">
        <Slider
          value={[live]}
          min={0}
          max={1}
          step={0.1}
          aria-label={ariaLabel}
          onValueChange={([next]) => next !== undefined && setLive(next)}
          onValueCommit={([next]) => next !== undefined && onChange(next)}
        />
        {/* Agents' anchors: 0.3, 0.5, 0.8. */}
        <span
          aria-hidden="true"
          className="absolute top-full left-[30%] mt-1 -translate-x-1/2 text-xs text-muted-foreground"
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
          className="absolute top-full left-[80%] mt-1 -translate-x-1/2 text-xs text-muted-foreground"
        >
          {labels.thresholdLenient}
        </span>
      </div>
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {Math.round(live * 100)}%
      </span>
    </div>
  );
}
