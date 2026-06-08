import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Agent-surfaced off-catalog request: something the requester asked for that
 * isn't a catalog good, with a path to a custom quote or agent configuration.
 * Static for the prototype. TODO(intake): drive from real off-catalog matches.
 */
export function NotInCatalogBanner() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-warning/50 bg-warning/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-foreground">
            Mobile service 12 lines for Denver
          </h3>
          <Badge variant="secondary" status="warning">
            Not in catalog
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Your T-Mobile MSA can absorb new lines. Want me to walk through plan
          tier, devices, and activation?
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {/* TODO(quote): kick off the custom-quote (Workbench) path. */}
        <Button variant="outline">Request custom quote</Button>
        {/* TODO(agent): launch the agent configuration flow. */}
        <Button className="bg-[#0f7b8a] text-white hover:bg-[#0c6976]">
          Configure with agent
        </Button>
      </div>
    </div>
  );
}
