import { useTranslation } from "react-i18next";
import {
  Occupant,
  OccupantStateView,
  type OccupantViewProps,
} from "@/components/ui/occupant";
import { Skeleton } from "@/components/ui/skeleton";
import { TimelineMarker, TimelineRowLayout } from "@/components/ui/timeline";
import { eventMarker } from "@/lib/progress-markers";
import type { ProgressViewModel } from "@/lib/progress-view-model";
import { activityTimelineOccupant } from "./activity-timeline.occupant";

interface ActivityTimelineListProps {
  view: ProgressViewModel;
}

/** Every event, oldest first, as a vertical timeline. */
function ActivityTimelineList({ view }: ActivityTimelineListProps) {
  const { t } = useTranslation();
  const { events } = view;
  return (
    <ol aria-label={t("activity_timeline_label", { subject: view.subject })}>
      {events.map((event, index) => (
        <li key={event.id}>
          <TimelineRowLayout
            isLast={index === events.length - 1}
            marker={<TimelineMarker {...eventMarker(event)} />}
          >
            <div className="min-w-0 flex-1 pb-6">
              <p className="text-sm font-medium text-foreground wrap-anywhere">
                {event.title}
              </p>
              {event.detail && (
                <p className="text-xs text-muted-foreground wrap-anywhere">
                  {event.detail}
                </p>
              )}
              {event.time && (
                <p className="mt-1 text-xs text-muted-foreground wrap-anywhere">
                  <time>{event.time}</time>
                </p>
              )}
            </div>
          </TimelineRowLayout>
        </li>
      ))}
    </ol>
  );
}

function ActivityTimelineSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {["w-3/4", "w-2/3", "w-4/5"].map((width) => (
        <div key={width} className="flex gap-4">
          <Skeleton className="size-7 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <Skeleton className={`h-4 ${width}`} />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

type ActivityTimelineProps = OccupantViewProps<ProgressViewModel>;

/**
 * Occupant: every event for an item, oldest first, with who did it (a
 * person or an agent) and how it stands.
 */
function ActivityTimeline({
  view,
  state = "ready",
  onRetry,
}: ActivityTimelineProps) {
  const { t } = useTranslation();
  // No events is the empty state.
  const shown = state === "ready" && view.events.length === 0 ? "empty" : state;
  return (
    <Occupant spec={activityTimelineOccupant}>
      <OccupantStateView
        state={shown}
        subject={t("activity_timeline_subject")}
        emptyDescription={t("activity_timeline_empty")}
        skeleton={<ActivityTimelineSkeleton />}
        onRetry={onRetry}
      >
        <ActivityTimelineList view={view} />
      </OccupantStateView>
    </Occupant>
  );
}

export { ActivityTimeline, activityTimelineOccupant };
export type { ActivityTimelineProps };
