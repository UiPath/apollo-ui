import type { ReactNode } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SurfacePadding } from "@/lib/composition";
import type {
  DetailPageConfig,
  DetailPagePanels,
  DetailPageSlotName,
  PanelClosedBy,
  PanelPlacement,
  PanelSide,
} from "./detail-page.template";
import { detailPageTemplate, enabledPanels } from "./detail-page.template";
import type { SlotPaddings } from "./DetailPageExample";

export type ShellVariant = "sidebar" | "minimal";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface ControlProps<T extends string> {
  /** Visible label. Omit when a neighbouring control already shows it. */
  label?: string;
  /** Accessible name for the toggle group. */
  ariaLabel: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

function Control<T extends string>({
  label,
  ariaLabel,
  value,
  options,
  onChange,
  disabled,
}: ControlProps<T>) {
  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
      )}
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={value}
        disabled={disabled}
        onValueChange={(next) => {
          const match = options.find((option) => option.value === next);
          if (match) onChange(match.value);
        }}
        aria-label={ariaLabel}
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
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

const PADDING_OPTIONS: Option<SurfacePadding>[] = [
  { value: "padded", label: "Padded" },
  { value: "flush", label: "Flush" },
];

const SIDE_LABELS: Record<PanelSide, string> = { start: "Start", end: "End" };

const SLOT_LABELS: Record<DetailPageSlotName, string> = {
  header: "Header",
  "start-panel": "Start",
  main: "Main",
  "end-panel": "End",
};

interface PreviewControlBarProps {
  shellVariant: ShellVariant;
  onShellVariantChange: (variant: ShellVariant) => void;
  config: DetailPageConfig;
  onConfigChange: (config: DetailPageConfig) => void;
  open: Record<PanelSide, boolean>;
  closedBy: Record<PanelSide, PanelClosedBy | null>;
  onOpenChange: (side: PanelSide, open: boolean) => void;
  paddings: SlotPaddings;
  onPaddingChange: (slot: DetailPageSlotName, padding: SurfacePadding) => void;
}

interface GroupProps {
  title: string;
  children: ReactNode;
}

function Group({ title, children }: GroupProps) {
  return (
    <div
      role="group"
      aria-label={title}
      className="flex flex-wrap items-center gap-x-4 gap-y-2"
    >
      <span className="w-20 shrink-0 text-xs font-semibold text-foreground">
        {title}
      </span>
      {children}
    </div>
  );
}

/** Preview-only. Lives outside the template's markup; the preview places it. */
export function PreviewControlBar({
  shellVariant,
  onShellVariantChange,
  config,
  onConfigChange,
  open,
  closedBy,
  onOpenChange,
  paddings,
  onPaddingChange,
}: PreviewControlBarProps) {
  const enabled = enabledPanels(config.panels);
  const sides: PanelSide[] = ["start", "end"];

  return (
    <div className="flex w-max max-w-[calc(100vw-2rem)] flex-col gap-2 rounded-lg border border-border bg-background p-3 shadow-md">
      <Group title="Layout">
        <Control
          label="Shell"
          ariaLabel="Shell"
          value={shellVariant}
          options={SHELL_OPTIONS}
          onChange={onShellVariantChange}
        />
        <Control
          label="Panels"
          ariaLabel="Panels"
          value={config.panels}
          options={PANELS_OPTIONS}
          onChange={(panels) => onConfigChange({ ...config, panels })}
        />
      </Group>
      <Group title="Side panels">
        {sides.map((side) => (
          <div key={side} className="flex flex-wrap items-center gap-2">
            <Control
              label={SIDE_LABELS[side]}
              ariaLabel={`${SIDE_LABELS[side]} placement`}
              value={config[side].placement}
              options={PLACEMENT_OPTIONS}
              disabled={!enabled[side]}
              onChange={(placement) =>
                onConfigChange({
                  ...config,
                  [side]: { ...config[side], placement },
                })
              }
            />
            <Control
              ariaLabel={`${SIDE_LABELS[side]} state`}
              value={open[side] ? "open" : "closed"}
              options={OPEN_OPTIONS}
              disabled={!enabled[side]}
              onChange={(state) => onOpenChange(side, state === "open")}
            />
            {closedBy[side] === "rule" && (
              <span className="text-xs text-muted-foreground italic">
                closed by rule
              </span>
            )}
          </div>
        ))}
      </Group>
      <Group title="Padding">
        {detailPageTemplate.slots.map(({ name }) => (
          <Control
            key={name}
            label={SLOT_LABELS[name]}
            ariaLabel={`${SLOT_LABELS[name]} padding`}
            value={paddings[name]}
            options={PADDING_OPTIONS}
            onChange={(padding) => onPaddingChange(name, padding)}
          />
        ))}
      </Group>
    </div>
  );
}
