import type { ReactNode } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SurfacePadding } from "@/lib/composition";
import type { PaddedSlotName } from "./preview-options";
import type {
  DetailPagePanels,
  PanelClosedBy,
  PanelPlacement,
  PanelSide,
  StartPanelControls,
} from "./detail-page.template";
import { enabledPanels } from "./detail-page.template";
import type {
  OccupantCount,
  PreviewSettings,
  ShellVariant,
  SidebarState,
} from "./preview-url-state";

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

const SIDEBAR_OPTIONS: Option<SidebarState>[] = [
  { value: "expanded", label: "Expanded" },
  { value: "collapsed", label: "Collapsed" },
];

const PANELS_OPTIONS: Option<DetailPagePanels>[] = [
  { value: "none", label: "None" },
  { value: "start", label: "Start" },
  { value: "end", label: "End" },
  { value: "both", label: "Both" },
];

const CONTROLS_OPTIONS: Option<StartPanelControls>[] = [
  { value: "in-panel", label: "In panel" },
  { value: "rail", label: "Rail" },
];

const OCCUPANTS_OPTIONS: Option<OccupantCount>[] = [
  { value: "one", label: "One" },
  { value: "two", label: "Two" },
];

const PLACEMENT_OPTIONS: Option<PanelPlacement>[] = [
  { value: "below-header", label: "Below header" },
  { value: "beside-header", label: "Beside header" },
];

const OPEN_OPTIONS: Option<"open" | "closed">[] = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
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
}: PreviewControlBarProps) {
  const { config, paddings } = settings;
  const enabled = enabledPanels(config.panels);

  const setPadding = (slot: PaddedSlotName, padding: SurfacePadding) =>
    onChange((prev) => ({
      ...prev,
      paddings: { ...prev.paddings, [slot]: padding },
    }));

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
        {settings.shellVariant === "sidebar" && (
          <Field
            label="Sidebar"
            value={settings.sidebar}
            options={SIDEBAR_OPTIONS}
            onChange={(sidebar) => onChange((prev) => ({ ...prev, sidebar }))}
          />
        )}
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
      {enabled.start && (
        <Section title="Start panel controls">
          <Field
            label="Controls"
            value={config.startControls ?? "in-panel"}
            options={CONTROLS_OPTIONS}
            onChange={(startControls) =>
              onChange((prev) => ({
                ...prev,
                config: { ...prev.config, startControls },
              }))
            }
          />
          <Field
            label="Occupants"
            value={settings.occupants}
            options={OCCUPANTS_OPTIONS}
            onChange={(occupants) =>
              onChange((prev) => ({ ...prev, occupants }))
            }
          />
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
      </Section>
      {enabled.end && panelFields("end", "End panel")}
    </div>
  );
}
