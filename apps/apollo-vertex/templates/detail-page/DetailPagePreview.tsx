"use client";

import { Button } from "@/components/ui/button";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderNav,
  PageHeaderTitle,
} from "@/components/ui/page-header";
import { DetailPage } from "@/registry/detail-page/detail-page";
import { useDetailPage } from "@/registry/detail-page/use-detail-page";

/**
 * A record page: header across the top, a queue beside it, the record in
 * the middle, and activity under the header on the end.
 */
export function DetailPagePreview() {
  const state = useDetailPage({
    panels: "both",
    start: { placement: "beside-header", defaultOpen: true },
    end: { placement: "below-header", defaultOpen: true },
  });

  return (
    <div className="h-full bg-background text-foreground">
      <DetailPage
        state={state}
        header={
          <PageHeader bordered>
            <PageHeaderNav>
              <PageHeaderTitle>INV-4021</PageHeaderTitle>
            </PageHeaderNav>
            <PageHeaderActions>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => state.setPanelOpen("start", !state.open.start)}
              >
                {state.open.start ? "Hide queue" : "Show queue"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => state.setPanelOpen("end", !state.open.end)}
              >
                {state.open.end ? "Hide activity" : "Show activity"}
              </Button>
            </PageHeaderActions>
          </PageHeader>
        }
        startSidebar={
          <aside
            aria-label="Queue"
            className="flex h-full w-full flex-col gap-2 bg-muted/40 p-4"
          >
            <h2 className="text-sm font-semibold">Queue</h2>
            <p className="text-sm text-muted-foreground">INV-4021</p>
            <p className="text-sm text-muted-foreground">INV-4020</p>
            <p className="text-sm text-muted-foreground">INV-4018</p>
          </aside>
        }
        content={
          <div className="h-full overflow-y-auto p-6">
            <h2 className="text-base font-semibold">Acme Corp</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              $12,450.00 due Mar 27, 2026. The record stays in the middle while
              the sidebars open and close around it.
            </p>
          </div>
        }
        endSidebar={
          <aside
            aria-label="Activity"
            className="flex h-full w-full flex-col gap-2 p-4"
          >
            <h2 className="text-sm font-semibold">Activity</h2>
            <p className="text-sm text-muted-foreground">
              Matched to PO-2026-0142
            </p>
            <p className="text-sm text-muted-foreground">
              Assigned to the AP queue
            </p>
          </aside>
        }
      />
    </div>
  );
}
