"use client";

import {
  bgColorOptions,
  insightOptions,
  primaryOptions,
  type CardConfig,
  type CardGradient,
  type CardSize,
  type GlowConfig,
  type InsightCardConfig,
  type LayoutConfig,
} from "./glow-config";
import { SelectControl, Slider, Toggle } from "./dev-controls-primitives";

function GradientSection({
  gradient,
  onChange,
}: {
  gradient: CardGradient;
  onChange: (g: CardGradient) => void;
}) {
  const update = (partial: Partial<CardGradient>) =>
    onChange({ ...gradient, ...partial });

  return (
    <div className="space-y-2 pl-2 border-l border-muted">
      <Toggle
        label="Gradient"
        checked={gradient.enabled}
        onChange={(v) => update({ enabled: v })}
      />
      {gradient.enabled && (
        <>
          <SelectControl
            label="Start (Insight)"
            value={gradient.start}
            options={insightOptions}
            onChange={(v) => update({ start: v })}
          />
          <SelectControl
            label="End (Primary)"
            value={gradient.end}
            options={primaryOptions}
            onChange={(v) => update({ end: v })}
          />
          <Slider
            label="Angle"
            value={gradient.angle}
            min={0}
            max={360}
            step={15}
            onChange={(v) => update({ angle: v })}
            displayValue={`${gradient.angle}°`}
          />
          <Slider
            label="Opacity"
            value={gradient.opacity}
            min={0}
            max={100}
            step={5}
            onChange={(v) => update({ opacity: v })}
            displayValue={`${gradient.opacity}%`}
          />
        </>
      )}
    </div>
  );
}

export function GlowTab({
  config,
  onChange,
}: {
  config: GlowConfig;
  onChange: (c: GlowConfig) => void;
}) {
  const update = (partial: Partial<GlowConfig>) =>
    onChange({ ...config, ...partial });

  return (
    <div className="space-y-3">
      <SelectControl
        label="Start (Insight)"
        value={config.start}
        options={insightOptions}
        onChange={(v) => update({ start: v })}
      />
      <SelectControl
        label="End (Primary)"
        value={config.end}
        options={primaryOptions}
        onChange={(v) => update({ end: v })}
      />
      <Slider
        label="Container Opacity"
        value={config.containerOpacity}
        min={0}
        max={100}
        step={5}
        onChange={(v) => update({ containerOpacity: v })}
        displayValue={`${config.containerOpacity}%`}
      />
      <Slider
        label="Fill Opacity"
        value={config.fillOpacity}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => update({ fillOpacity: v })}
      />
      <Slider
        label="Start Stop Opacity"
        value={config.startStopOpacity}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => update({ startStopOpacity: v })}
      />
      <Slider
        label="End Stop Opacity"
        value={config.endStopOpacity}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => update({ endStopOpacity: v })}
      />
      <Slider
        label="End Offset"
        value={config.endOffset}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => update({ endOffset: v })}
      />
    </div>
  );
}

export function CardsTab({
  config,
  onChange,
}: {
  config: CardConfig;
  onChange: (c: CardConfig) => void;
}) {
  const update = (partial: Partial<CardConfig>) =>
    onChange({ ...config, ...partial });

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium border-b pb-1">Overview Card</div>
      <SelectControl
        label="Background"
        value={config.overviewBg}
        options={bgColorOptions}
        onChange={(v) => update({ overviewBg: v })}
      />
      <Slider
        label="Opacity"
        value={config.overviewOpacity}
        min={0}
        max={100}
        step={1}
        onChange={(v) => update({ overviewOpacity: v })}
        displayValue={`${config.overviewOpacity}%`}
      />
      <GradientSection
        gradient={config.overviewGradient}
        onChange={(g) => update({ overviewGradient: g })}
      />

      <div className="text-xs font-medium border-b pb-1 pt-1">
        Insight Cards
      </div>
      <SelectControl
        label="Background"
        value={config.insightBg}
        options={bgColorOptions}
        onChange={(v) => update({ insightBg: v })}
      />
      <Slider
        label="Opacity"
        value={config.insightOpacity}
        min={0}
        max={100}
        step={1}
        onChange={(v) => update({ insightOpacity: v })}
        displayValue={`${config.insightOpacity}%`}
      />
      <GradientSection
        gradient={config.insightGradient}
        onChange={(g) => update({ insightGradient: g })}
      />

      <div className="text-xs font-medium border-b pb-1 pt-1">Prompt Bar</div>
      <SelectControl
        label="Background"
        value={config.promptBg}
        options={bgColorOptions}
        onChange={(v) => update({ promptBg: v })}
      />
      <Slider
        label="Opacity"
        value={config.promptOpacity}
        min={0}
        max={100}
        step={1}
        onChange={(v) => update({ promptOpacity: v })}
        displayValue={`${config.promptOpacity}%`}
      />
      <GradientSection
        gradient={config.promptGradient}
        onChange={(g) => update({ promptGradient: g })}
      />

      <div className="text-xs font-medium border-b pb-1 pt-1">Shared</div>
      <Toggle
        label="Borders"
        checked={config.borderVisible}
        onChange={(v) => update({ borderVisible: v })}
      />
      <Toggle
        label="Backdrop Blur"
        checked={config.backdropBlur}
        onChange={(v) => update({ backdropBlur: v })}
      />
    </div>
  );
}

const sizeOptions = [
  { label: "Small (1 col)", value: "sm" },
  { label: "Medium (1 col)", value: "md" },
  { label: "Large (full)", value: "lg" },
];

const containerBgOptions = [
  { label: "None", value: "none" },
  ...bgColorOptions,
];

export function LayoutTab({
  config,
  onChange,
}: {
  config: LayoutConfig;
  onChange: (c: LayoutConfig) => void;
}) {
  const update = (partial: Partial<LayoutConfig>) =>
    onChange({ ...config, ...partial });

  const updateInsightCard = (
    index: number,
    partial: Partial<InsightCardConfig>,
  ) => {
    const cards = [...config.insightCards] as [
      InsightCardConfig,
      InsightCardConfig,
      InsightCardConfig,
      InsightCardConfig,
    ];
    cards[index] = { ...cards[index], ...partial };
    update({ insightCards: cards });
  };

  return (
    <div className="space-y-3">
      <SelectControl
        label="Container Background"
        value={config.containerBg}
        options={containerBgOptions}
        onChange={(v) => update({ containerBg: v })}
      />
      <Slider
        label="Gap (px)"
        value={config.gap}
        min={0}
        max={24}
        step={1}
        onChange={(v) => update({ gap: v })}
        displayValue={`${config.gap}px`}
      />
      <Slider
        label="Padding (px)"
        value={config.padding}
        min={0}
        max={48}
        step={4}
        onChange={(v) => update({ padding: v })}
        displayValue={`${config.padding}px`}
      />

      <div className="text-xs font-medium border-b pb-1 pt-1">Left Column</div>
      <Slider
        label="Overview Ratio"
        value={config.overviewRatio}
        min={1}
        max={8}
        step={1}
        onChange={(v) => update({ overviewRatio: v })}
      />
      <Slider
        label="Prompt Ratio"
        value={config.promptRatio}
        min={1}
        max={4}
        step={1}
        onChange={(v) => update({ promptRatio: v })}
      />

      <div className="text-xs font-medium border-b pb-1 pt-1">
        Insight Cards
      </div>
      {["Top Left", "Top Right", "Bottom Left", "Bottom Right"].map(
        (label, i) => (
          <div key={label} className="space-y-1 pb-2 border-b border-muted">
            <div className="flex items-center justify-between">
              <span className="text-xs">{label}</span>
              <Toggle
                label=""
                checked={config.insightCards[i].visible}
                onChange={(v) => updateInsightCard(i, { visible: v })}
              />
            </div>
            {config.insightCards[i].visible && (
              <SelectControl
                label="Size"
                value={config.insightCards[i].size}
                options={sizeOptions}
                onChange={(v) => updateInsightCard(i, { size: v as CardSize })}
              />
            )}
          </div>
        ),
      )}
    </div>
  );
}
