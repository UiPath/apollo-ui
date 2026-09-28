import { ActivityTimeline } from "./activity-timeline";
import { PlanSelector } from "./plan-selector";
import { ProductGrid } from "./product-grid";
import { RecommendedActions } from "./recommended-actions";

/** Compositions: the AI mark, color, and components combined into real patterns. */
export function Examples() {
  return (
    <div className="my-6 space-y-20">
      <section>
        <h3 className="mb-1 text-sm font-semibold text-foreground">
          Activity timeline
        </h3>
        <p className="mb-6 max-w-prose text-sm text-muted-foreground">
          A mix of AI and user activity. AI steps carry the mark across its
          states (complete, in progress, upcoming), while people appear as
          avatars.
        </p>
        <div className="rounded-xl border border-border px-6 py-6">
          <ActivityTimeline />
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-sm font-semibold text-foreground">
          Product recommendation
        </h3>
        <p className="mb-6 max-w-prose text-sm text-muted-foreground">
          Three glass product cards. The first is the AI pick: it uses the
          primary glass card with the glow and a gradient fill badge to set it
          apart from the standard results.
        </p>
        <ProductGrid />
        <div className="mt-10 max-w-prose">
          <p className="mb-1 text-sm font-medium text-foreground">
            Pairing a glow with a label
          </p>
          <p className="text-sm text-muted-foreground">
            The glow lifts the recommended card off the grid, and the gradient
            fill badge names why it stands out. The two work as a pair: the glow
            draws the eye, the label explains the emphasis. Use the combination
            for a single best match per view so the signal stays meaningful, and
            keep the glow soft. It guides attention without the hard edge of a
            border or a solid color block.
          </p>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-sm font-semibold text-foreground">
          Recommended actions
        </h3>
        <p className="mb-6 max-w-prose text-sm text-muted-foreground">
          A card group over one shared glow, headed by the mark. Each card pairs
          an action with its impact metrics and offers to automate or dismiss
          it.
        </p>
        <RecommendedActions />
        <div className="mt-10 max-w-prose">
          <p className="mb-1 text-sm font-medium text-foreground">
            Mark the group once, not every control
          </p>
          <p className="text-sm text-muted-foreground">
            When several AI recommendations are grouped together, establish the
            AI context a single time at the section level. The shared glow
            contains the group, and the mark with the section title signals that
            everything inside is AI generated. Repeating the mark on every card,
            badge, and button within dilutes it and leads to mark fatigue, so
            the controls inside can stay neutral. Setting the expression at the
            boundary keeps it present and meaningful without overuse.
          </p>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-sm font-semibold text-foreground">
          Plan selection
        </h3>
        <p className="mb-6 max-w-prose text-sm text-muted-foreground">
          Selectable cards in a guided choice. The agent&apos;s pick is the AI
          variant with its gradient glow on select and an Agent pick badge,
          while the alternatives are standard. An AI note frames the
          recommendation above the options.
        </p>
        <PlanSelector />
      </section>
    </div>
  );
}
