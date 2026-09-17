import {
  TimelineMarker,
  type TimelineMarkerVariant,
  TimelineRowLayout,
} from "@/registry/timeline";

const VARIANTS: { variant: TimelineMarkerVariant; label: string }[] = [
  { variant: "user", label: "User acted" },
  { variant: "completed-user", label: "User completed" },
  { variant: "completed-ai", label: "Agent completed" },
  { variant: "ai-upcoming", label: "Queued" },
  { variant: "ai-suspended", label: "Suspended" },
  { variant: "ai-progress", label: "Running" },
  { variant: "ai-failed", label: "Failed" },
  { variant: "ai-cancelled", label: "Cancelled" },
  { variant: "ai-complete", label: "Done" },
];

function VariantColumn({ compact }: { compact: boolean }) {
  return (
    <div>
      <p className="mb-4 text-xs font-medium text-muted-foreground">
        {compact ? "Compact" : "Full"}
      </p>
      <ol>
        {VARIANTS.map((entry, idx) => (
          <li key={entry.variant}>
            <TimelineRowLayout
              compact={compact}
              isLast={idx === VARIANTS.length - 1}
              marker={
                <TimelineMarker
                  variant={entry.variant}
                  compact={compact}
                  initials="PV"
                />
              }
            >
              <div className={compact ? "pb-4" : "pb-6"}>
                <p className="text-sm font-medium text-foreground">
                  {entry.label}
                </p>
                <p className="text-xs text-muted-foreground">{entry.variant}</p>
              </div>
            </TimelineRowLayout>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Every timeline marker variant, in both the full and compact sizes. */
export function TimelineMarkers() {
  return (
    <div className="my-6 grid max-w-xl gap-10 sm:grid-cols-2">
      <VariantColumn compact={false} />
      <VariantColumn compact />
    </div>
  );
}
