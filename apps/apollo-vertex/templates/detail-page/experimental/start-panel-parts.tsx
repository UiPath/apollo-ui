import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Experimental: shared pieces for start panel controls, options B and C. */

interface PanelToggleProps {
  id: string;
  expanded: boolean;
  controls: string;
  onClick: () => void;
}

export function PanelToggle({
  id,
  expanded,
  controls,
  onClick,
}: PanelToggleProps) {
  const Icon = expanded ? PanelLeftClose : PanelLeftOpen;
  return (
    <Button
      id={id}
      variant="ghost"
      size="icon"
      aria-label="Start panel"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
    >
      <Icon />
    </Button>
  );
}

export function OccupantLabel({ label }: { label: string }) {
  return (
    <span className="min-w-0 truncate text-sm font-medium text-foreground">
      {label}
    </span>
  );
}
