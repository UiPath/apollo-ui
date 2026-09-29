import { useTranslation } from "react-i18next";
import { Occupant, type OccupantViewProps } from "@/components/ui/occupant";
import { TimelineMarker } from "@/components/ui/timeline";
import { type MarkerView, stageMarker } from "@/lib/progress-markers";
import type {
  ProgressStageStatus,
  ProgressViewModel,
} from "@/lib/progress-view-model";
import { cn } from "@/lib/utils";
import { stageStripOccupant } from "./stage-strip.occupant";

const STATUS_KEY = {
  done: "stage_strip_status_done",
  current: "stage_strip_status_current",
  upcoming: "stage_strip_status_upcoming",
} as const satisfies Record<ProgressStageStatus, string>;

/**
 * A compact marker's circle fits one letter, so a person's marker shows only
 * their first initial here. Their full name is in the stage's label.
 */
const compactMarker = (marker: MarkerView): MarkerView =>
  marker.initials
    ? { ...marker, initials: marker.initials.slice(0, 1) }
    : marker;

interface StageStripViewProps {
  view: ProgressViewModel;
}

/**
 * The strip without its occupant root, for a view that embeds it (like an
 * item header's content area). A compact marker per stage, then the current
 * stage and its latest event.
 */
function StageStripView({ view }: StageStripViewProps) {
  const { t } = useTranslation();
  const { stages } = view;
  const step = stages.findIndex((stage) => stage.status === "current");
  const current = stages[step];
  const latest = view.events.at(-1);
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <ol
        aria-label={t("stage_strip_label", { subject: view.subject })}
        className="flex min-w-0 flex-wrap items-center gap-y-1"
      >
        {stages.map((stage, index) => (
          <li
            key={stage.id}
            className="flex items-center"
            {...(stage.status === "current" && { "aria-current": "step" })}
          >
            {index > 0 && (
              <span
                aria-hidden
                className={cn(
                  "h-px w-3",
                  stage.status === "upcoming"
                    ? "bg-border"
                    : "bg-muted-foreground",
                )}
              />
            )}
            <span aria-hidden className="flex">
              <TimelineMarker
                {...compactMarker(stageMarker(stage, view))}
                compact
              />
            </span>
            <span className="sr-only">
              {t("stage_strip_stage", {
                label: stage.label,
                status: t(STATUS_KEY[stage.status]),
              })}
            </span>
          </li>
        ))}
      </ol>
      {current && (
        <div className="flex min-w-0 flex-col wrap-anywhere">
          <p className="text-sm font-medium text-foreground">
            {current.label}
            <span className="font-normal text-muted-foreground">
              {t("stage_strip_step", { step: step + 1, total: stages.length })}
            </span>
          </p>
          {latest && (
            <p className="text-xs text-muted-foreground">{latest.title}</p>
          )}
        </div>
      )}
    </div>
  );
}

type StageStripProps = OccupantViewProps<ProgressViewModel>;

/** Occupant: where an item is in its stages, as a one-band summary. */
function StageStrip({ view }: StageStripProps) {
  return (
    <Occupant spec={stageStripOccupant}>
      <StageStripView view={view} />
    </Occupant>
  );
}

export { StageStrip, StageStripView, stageStripOccupant };
export type { StageStripProps, StageStripViewProps };
