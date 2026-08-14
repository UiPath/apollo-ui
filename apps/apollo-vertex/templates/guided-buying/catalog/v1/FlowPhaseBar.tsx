import { JourneyBar, type JourneyStage } from "../../JourneyBar";

interface FlowPhaseBarProps {
  phases: readonly string[];
  /** 0-based index of the currently active phase. */
  currentIndex: number;
  /** Called with the phase index when the user clicks a completed phase. */
  onClickPhase?: (index: number) => void;
}

/**
 * Slim linear progress indicator for the Buy flow.
 * Thin wrapper over JourneyBar with labelPosition="inline".
 */
export function FlowPhaseBar({
  phases,
  currentIndex,
  onClickPhase,
}: FlowPhaseBarProps) {
  const stages: JourneyStage[] = phases.map((label, i) => ({
    label,
    state:
      i < currentIndex ? "done" : i === currentIndex ? "active" : "upcoming",
    ...(i < currentIndex && onClickPhase
      ? { onClick: () => onClickPhase(i) }
      : {}),
  }));

  return <JourneyBar stages={stages} labelPosition="inline" />;
}
