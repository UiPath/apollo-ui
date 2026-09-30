import { useTranslation } from "react-i18next";
import {
  Occupant,
  OccupantStateView,
  OccupantTruncatedText,
  type OccupantViewProps,
} from "@/components/ui/occupant";
import { useSurface } from "@/lib/surface-context";
import { cn } from "@/lib/utils";
import { keyFactsOccupant } from "./key-facts.occupant";
import type { KeyFactsViewModel } from "./key-facts.view-model";

type KeyFactsProps = OccupantViewProps<KeyFactsViewModel>;

/**
 * Occupant: the few facts that matter most about an item, as label and
 * value pairs. In a vertical surface they stack; in a horizontal one they
 * sit in a wrapping row. Labels truncate with their full text in a title,
 * and values wrap, so the minimum width holds for any data.
 */
function KeyFacts({ view, state = "ready", onRetry }: KeyFactsProps) {
  const { t } = useTranslation();
  // Adapt to the shape of the space, never to the surface's name.
  const { orientation } = useSurface();
  const row = orientation === "horizontal";
  // Nothing to show is the empty state.
  const shown = state === "ready" && view.facts.length === 0 ? "empty" : state;
  return (
    <Occupant spec={keyFactsOccupant}>
      <OccupantStateView
        state={shown}
        subject={t("key_facts_subject")}
        emptyDescription={t("key_facts_empty")}
        onRetry={onRetry}
      >
        <dl
          aria-label={t("key_facts_label", { subject: view.subject })}
          className={cn(
            "grid min-w-0",
            row
              ? "grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-x-6 gap-y-2"
              : "grid-cols-1 gap-3",
          )}
        >
          {view.facts.map(({ id, label, value }) => (
            <div key={id} className="flex min-w-0 flex-col">
              <dt className="min-w-0">
                <OccupantTruncatedText className="text-xs text-muted-foreground">
                  {label}
                </OccupantTruncatedText>
              </dt>
              <dd
                className={cn(
                  "text-sm wrap-anywhere",
                  value
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {value?.length ? value : t("key_facts_not_set")}
              </dd>
            </div>
          ))}
        </dl>
      </OccupantStateView>
    </Occupant>
  );
}

export { KeyFacts, keyFactsOccupant };
export type { KeyFactsProps };
