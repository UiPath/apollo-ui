import { useTranslation } from "react-i18next";
import {
  Occupant,
  OccupantStateView,
  type OccupantViewProps,
} from "@/components/ui/occupant";
import { participantsOccupant } from "./participants.occupant";
import type { ParticipantsViewModel } from "./participants.view-model";

type ParticipantsProps = OccupantViewProps<ParticipantsViewModel>;

/** Occupant: The people involved with an item, what each one does, and when they last acted. */
function Participants({ view, state = "ready", onRetry }: ParticipantsProps) {
  const { t } = useTranslation();
  // Nothing to show is the empty state.
  const shown =
    state === "ready" && view.participants.length === 0 ? "empty" : state;
  return (
    <Occupant spec={participantsOccupant}>
      <OccupantStateView
        state={shown}
        subject={t("participants_subject")}
        emptyDescription={t("participants_empty")}
        onRetry={onRetry}
      >
        <ul
          aria-label={t("participants_label", { subject: view.subject })}
          className={"flex min-w-0 flex-col gap-3"}
        >
          {view.participants.map((entry) => (
            <li key={entry.id} className="flex min-w-0 flex-col">
              <p className="text-sm font-medium text-foreground wrap-anywhere">
                {entry.name}
              </p>
              {entry.role && (
                <p className="text-xs text-muted-foreground wrap-anywhere">
                  {entry.role}
                </p>
              )}
              {entry.lastActive && (
                <p className="mt-1 text-xs text-muted-foreground wrap-anywhere">
                  {entry.lastActive}
                </p>
              )}
            </li>
          ))}
        </ul>
      </OccupantStateView>
    </Occupant>
  );
}

export { Participants, participantsOccupant };
export type { ParticipantsProps };
