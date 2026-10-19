import { Slider } from '@uipath/apollo-wind';
import { useState } from 'react';

const THRESHOLD_STEP = 0.1;

export interface ClassifierThresholdSliderProps {
  /** Shown before the track, e.g. "Strictness". */
  label: string;
  /** 0..1. */
  value: number;
  ariaLabel: string;
  /** Under the track at 0.3, 0.5 and 0.8, Agents' anchors. */
  marks: { strict: string; balanced: string; lenient: string };
  /** Called once per gesture, when the thumb is released. */
  onChange: (value: number) => void;
}

/**
 * A 0..1 flag threshold for one classifier question, in steps of 0.1. Lower flags more often,
 * which the marks say in words. The thumb moves freely and reports on release, so dragging does
 * not rewrite the guardrail's parameters on every step.
 */
export function ClassifierThresholdSlider({
  label,
  value,
  ariaLabel,
  marks,
  onChange,
}: ClassifierThresholdSliderProps) {
  const [live, setLive] = useState(value);
  // Adjusting state during render, React's pattern for state derived from a prop: an outside
  // change (undo, a reseeded row) moves the thumb, and a drag in progress is left alone.
  const [seeded, setSeeded] = useState(value);
  if (value !== seeded) {
    setSeeded(value);
    setLive(value);
  }

  return (
    <div data-slot="classifier-threshold-slider" className="flex items-center gap-3 pb-5">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="relative min-w-[220px] max-w-[360px] flex-1">
        <Slider
          value={[live]}
          min={0}
          max={1}
          step={THRESHOLD_STEP}
          aria-label={ariaLabel}
          onValueChange={([next]) => {
            if (next !== undefined) setLive(next);
          }}
          onValueCommit={([next]) => {
            if (next !== undefined) onChange(next);
          }}
        />
        <span
          aria-hidden="true"
          className="absolute top-full left-[30%] mt-1 -translate-x-1/2 text-xs text-muted-foreground"
        >
          {marks.strict}
        </span>
        <span
          aria-hidden="true"
          className="absolute top-full left-1/2 mt-1 -translate-x-1/2 text-xs text-muted-foreground"
        >
          {marks.balanced}
        </span>
        <span
          aria-hidden="true"
          className="absolute top-full left-[80%] mt-1 -translate-x-1/2 text-xs text-muted-foreground"
        >
          {marks.lenient}
        </span>
      </div>
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {Math.round(live * 100)}%
      </span>
    </div>
  );
}
