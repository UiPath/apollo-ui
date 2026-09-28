import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ScrollOwner, SurfacePadding } from "@/lib/composition";
import type { ScrollableSlotName } from "./DetailPageExample";
import type {
  DetailPagePanels,
  DetailPageSlotName,
  PanelClosedBy,
  PanelPlacement,
  PanelSide,
  PanelWidth,
} from "./detail-page.template";
import { END_PANEL_DEFAULT_PX, enabledPanels } from "./detail-page.template";
import type { PreviewSettings, ShellVariant } from "./preview-url-state";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface FieldProps<T extends string> {
  label: string;
  /** Accessible name for the toggle group, when the label alone is ambiguous. */
  ariaLabel?: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  hint?: string;
}

function Field<T extends string>({
  label,
  ariaLabel,
  value,
  options,
  onChange,
  hint,
}: FieldProps<T>) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        {hint && (
          <span className="text-xs text-muted-foreground italic">{hint}</span>
        )}
      </div>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        className="w-full"
        value={value}
        onValueChange={(next) => {
          const match = options.find((option) => option.value === next);
          if (match) onChange(match.value);
        }}
        aria-label={ariaLabel ?? label}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className="flex-1"
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0"
    >
      <h2 className="text-xs font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

const SHELL_OPTIONS: Option<ShellVariant>[] = [
  { value: "sidebar", label: "Sidebar" },
  { value: "minimal", label: "Minimal" },
];

const PANELS_OPTIONS: Option<DetailPagePanels>[] = [
  { value: "none", label: "None" },
  { value: "start", label: "Start" },
  { value: "end", label: "End" },
  { value: "both", label: "Both" },
];

const PLACEMENT_OPTIONS: Option<PanelPlacement>[] = [
  { value: "below-header", label: "Below header" },
  { value: "beside-header", label: "Beside header" },
];

const OPEN_OPTIONS: Option<"open" | "closed">[] = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

const CONTENT_OPTIONS: Option<"short" | "long">[] = [
  { value: "short", label: "Off" },
  { value: "long", label: "On" },
];

const SCROLL_OPTIONS: Option<ScrollOwner>[] = [
  { value: "surface", label: "Surface" },
  { value: "occupant", label: "Occupant" },
];

const PADDING_OPTIONS: Option<SurfacePadding>[] = [
  { value: "padded", label: "Padded" },
  { value: "flush", label: "Flush" },
];

interface PreviewControlBarProps {
  settings: PreviewSettings;
  onChange: (update: (prev: PreviewSettings) => PreviewSettings) => void;
  open: Record<PanelSide, boolean>;
  closedBy: Record<PanelSide, PanelClosedBy | null>;
  onOpenChange: (side: PanelSide, open: boolean) => void;
  /** The end panel's rendered width, after the width rules. */
  endWidth: number;
  /** The width the user chose, which the rules may be clamping. */
  endWidthChosen: PanelWidth;
  onResetEndWidth: () => void;
  /** Preview-only override of --side-panel-tint, as a percentage. */
  tintStrength: number;
  onTintStrengthChange: (strength: number) => void;
}

/**
 * Preview-only configuration card. Sections follow page order, and
 * sections that do not apply are hidden rather than disabled.
 */
export function PreviewControlBar({
  settings,
  onChange,
  open,
  closedBy,
  onOpenChange,
  endWidth,
  endWidthChosen,
  onResetEndWidth,
  tintStrength,
  onTintStrengthChange,
}: PreviewControlBarProps) {
  const { config, paddings } = settings;
  const enabled = enabledPanels(config.panels);
  const anyBeside =
    (enabled.start && config.start.placement === "beside-header") ||
    (enabled.end && config.end.placement === "beside-header");

  const setPadding = (slot: DetailPageSlotName, padding: SurfacePadding) =>
    onChange((prev) => ({
      ...prev,
      paddings: { ...prev.paddings, [slot]: padding },
    }));

  const scrollFields = (slot: ScrollableSlotName, title: string) => (
    <>
      <Field
        label="Long content"
        ariaLabel={`${title} content`}
        value={settings.contents[slot]}
        options={CONTENT_OPTIONS}
        onChange={(content) =>
          onChange((prev) => ({
            ...prev,
            contents: { ...prev.contents, [slot]: content },
          }))
        }
      />
      <Field
        label="Scrolls"
        ariaLabel={`${title} scroll owner`}
        value={settings.scrolls[slot]}
        options={SCROLL_OPTIONS}
        onChange={(scroll) =>
          onChange((prev) => ({
            ...prev,
            scrolls: { ...prev.scrolls, [slot]: scroll },
          }))
        }
      />
    </>
  );

  const panelFields = (side: PanelSide, title: string) => (
    <Section title={title}>
      <Field
        label="Placement"
        ariaLabel={`${title} placement`}
        value={config[side].placement}
        options={PLACEMENT_OPTIONS}
        onChange={(placement) =>
          onChange((prev) => ({
            ...prev,
            config: {
              ...prev.config,
              [side]: { ...prev.config[side], placement },
            },
          }))
        }
      />
      <Field
        label="State"
        ariaLabel={`${title} state`}
        value={open[side] ? "open" : "closed"}
        options={OPEN_OPTIONS}
        {...(closedBy[side] === "rule" && { hint: "closed by rule" })}
        onChange={(state) => onOpenChange(side, state === "open")}
      />
      <Field
        label="Padding"
        ariaLabel={`${title} padding`}
        value={paddings[side === "start" ? "start-panel" : "end-panel"]}
        options={PADDING_OPTIONS}
        onChange={(padding) =>
          setPadding(side === "start" ? "start-panel" : "end-panel", padding)
        }
      />
      {scrollFields(side === "start" ? "start-panel" : "end-panel", title)}
      {side === "end" && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Width</span>
            <span
              data-testid="end-panel-width"
              className="text-sm font-medium tabular-nums"
            >
              {`${endWidth}px`}
              {(endWidthChosen === "max" || endWidthChosen !== endWidth) && (
                <span className="text-xs font-normal text-muted-foreground">
                  {endWidthChosen === "max"
                    ? " (max)"
                    : ` (chosen ${endWidthChosen}px)`}
                </span>
              )}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={endWidthChosen === END_PANEL_DEFAULT_PX}
            onClick={onResetEndWidth}
          >
            Reset width
          </Button>
        </div>
      )}
    </Section>
  );

  return (
    <div className="flex w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-6rem)] flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-background p-4 shadow-md">
      <Section title="Layout">
        <Field
          label="Shell"
          value={settings.shellVariant}
          options={SHELL_OPTIONS}
          onChange={(shellVariant) =>
            onChange((prev) => ({ ...prev, shellVariant }))
          }
        />
        <Field
          label="Panels"
          value={config.panels}
          options={PANELS_OPTIONS}
          onChange={(panels) =>
            onChange((prev) => ({
              ...prev,
              config: { ...prev.config, panels },
            }))
          }
        />
      </Section>
      {anyBeside && (
        <Section title="Panel tint">
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <span
                id="tint-strength-label"
                className="text-xs text-muted-foreground"
              >
                Tint strength
              </span>
              <span
                data-testid="tint-strength-value"
                className="text-sm font-medium tabular-nums"
              >
                {`${tintStrength}%`}
              </span>
            </div>
            <Slider
              aria-labelledby="tint-strength-label"
              min={0}
              max={100}
              step={1}
              value={[tintStrength]}
              onValueChange={([next]) => {
                if (typeof next === "number") onTintStrengthChange(next);
              }}
            />
            <span className="text-xs text-muted-foreground">
              Beside-header panels only. Preview override of --side-panel-tint;
              not saved in the URL.
            </span>
          </div>
        </Section>
      )}
      <Section title="Header">
        <Field
          label="Padding"
          ariaLabel="Header padding"
          value={paddings.header}
          options={PADDING_OPTIONS}
          onChange={(padding) => setPadding("header", padding)}
        />
      </Section>
      {enabled.start && panelFields("start", "Start panel")}
      <Section title="Main">
        <Field
          label="Padding"
          ariaLabel="Main padding"
          value={paddings.main}
          options={PADDING_OPTIONS}
          onChange={(padding) => setPadding("main", padding)}
        />
        {scrollFields("main", "Main")}
      </Section>
      {enabled.end && panelFields("end", "End panel")}
    </div>
  );
}
