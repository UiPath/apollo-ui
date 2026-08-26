"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SUPPLIER_THREADS } from "../data/supplier-cases";
import { PaneRail } from "./pane-rail";
import type { RailSection } from "./pane-rail-types";
import { SCROLL_PANE } from "./scroll-pane";

type FolderId = "inbox" | "sent" | "archive";

const SECTIONS: RailSection<FolderId>[] = [
  {
    heading: "Folders",
    interactive: true,
    items: [
      { id: "inbox", label: "Inbox", count: SUPPLIER_THREADS.length },
      { id: "sent", label: "Sent" },
      { id: "archive", label: "Archive" },
    ],
  },
];

/**
 * The same cases from the supplier's side. The point of this view is what is
 * absent: no portal, no login, no status widgets, no supplier-side actions.
 * Resist adding chrome here. The layout matches the AP tab (shared rail,
 * resizable list, centred reading pane) so switching tabs doesn't reflow.
 */
export function SupplierInbox() {
  const [folder, setFolder] = useState<FolderId>("inbox");
  const [selectedId, setSelectedId] = useState(SUPPLIER_THREADS[0].id);

  // Only the inbox holds messages in this dataset; the other folders are real
  // mail-client furniture with nothing behind them, so they read as empty.
  const threads = folder === "inbox" ? SUPPLIER_THREADS : [];
  const thread = threads.find((t) => t.id === selectedId) ?? threads[0] ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <p className="shrink-0 border-b border-border bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
        What the supplier sees: an ordinary email in their own inbox. No portal,
        no login.
      </p>

      <div className="flex min-h-0 flex-1">
        <PaneRail
          label="Mail folders"
          sections={SECTIONS}
          value={folder}
          onChange={setFolder}
        />

        <ResizablePanelGroup
          orientation="horizontal"
          className="min-w-0 flex-1"
        >
          <ResizablePanel
            defaultSize="20rem"
            minSize="17rem"
            maxSize="34rem"
            groupResizeBehavior="preserve-pixel-size"
            className="h-full"
          >
            <ScrollArea className={cn("size-full", SCROLL_PANE)}>
              {threads.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  Nothing in this folder.
                </p>
              ) : (
                <ul>
                  {threads.map((t) => {
                    const selected = t.id === thread?.id;

                    return (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(t.id)}
                          aria-current={selected ? "true" : "false"}
                          className={cn(
                            "w-full border-b border-l-2 border-b-border px-4 py-3 text-left transition-colors",
                            "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                            selected
                              ? "border-l-primary bg-accent"
                              : "border-l-transparent hover:bg-muted/60",
                          )}
                        >
                          <div className="flex min-w-0 items-baseline justify-between gap-2">
                            <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                              {t.from.replace(/\s*<.*>$/, "")}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {t.time}
                            </span>
                          </div>
                          <p className="mt-0.5 min-w-0 truncate text-xs font-medium text-foreground">
                            {t.subject}
                          </p>
                          <p className="mt-0.5 min-w-0 truncate text-xs text-muted-foreground">
                            {t.preview}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ScrollArea>
          </ResizablePanel>

          <ResizableHandle withHandle className="hover:bg-primary/40" />

          <ResizablePanel className="h-full">
            {thread ? (
              <ScrollArea className={cn("size-full", SCROLL_PANE)}>
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-3.5 p-4">
                  <h2 className="text-base font-semibold text-foreground">
                    {thread.subject}
                  </h2>

                  <Card variant="glass" className="gap-2 py-3">
                    <CardContent className="px-4">
                      <dl className="space-y-1 text-xs">
                        {(
                          [
                            ["From", thread.from],
                            ["To", thread.to],
                            ["Time", thread.time],
                          ] as const
                        ).map(([label, value]) => (
                          <div key={label} className="flex gap-3">
                            <dt className="w-12 shrink-0 text-muted-foreground">
                              {label}
                            </dt>
                            <dd className="min-w-0 text-foreground">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </CardContent>
                  </Card>

                  <Card variant="glass" className="gap-2 py-3">
                    <CardContent className="px-4">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {thread.body}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Reply
                    </Button>
                    <Button size="sm" variant="outline">
                      Forward
                    </Button>
                  </div>

                  {/* dark: scope matches glass's own dark fill, which would
                      otherwise win and flatten this card's tint */}
                  <Card
                    variant="glass"
                    className="gap-2 border-primary/30 bg-primary/5 py-3 dark:bg-primary/10"
                  >
                    <CardHeader className="px-4">
                      <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Behind the scenes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4">
                      <p className="text-sm leading-relaxed text-foreground">
                        {thread.context}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex h-full items-center justify-center p-6">
                <p className="text-sm text-muted-foreground">
                  Pick a message to read it.
                </p>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
