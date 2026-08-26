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
import { DATE_GROUPS, dateGroup, relativeTime } from "./case-time";
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

  // Same buckets and order as the AP list, empty ones dropped.
  const groups = DATE_GROUPS.map((g) => ({
    ...g,
    threads: threads.filter((t) => dateGroup(t.receivedAt) === g.id),
  })).filter((g) => g.threads.length > 0);

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
            <div className="flex h-full flex-col bg-muted/30">
              <ScrollArea className={cn("min-h-0 flex-1", SCROLL_PANE)}>
                {groups.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    Nothing in this folder.
                  </p>
                ) : (
                  groups.map((g) => (
                    <section key={g.id}>
                      <h3 className="sticky top-0 z-20 bg-muted/30 px-4 py-2 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
                        {g.label}
                      </h3>
                      <ul className="flex flex-col gap-2 px-4 pb-3">
                        {g.threads.map((t) => {
                          const selected = t.id === thread?.id;

                          return (
                            <li key={t.id}>
                              <Card
                                variant="glass"
                                className={cn(
                                  "relative gap-0 py-0 transition-colors",
                                  selected
                                    ? "border-primary dark:border-primary"
                                    : "hover:border-primary/40 dark:hover:border-primary/40",
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={() => setSelectedId(t.id)}
                                  aria-current={selected ? "true" : "false"}
                                  aria-label={`${t.from}: ${t.subject}`}
                                  className="absolute inset-0 z-0 rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
                                />
                                <CardContent className="pointer-events-none relative z-10 px-3 py-3">
                                  <div className="flex min-w-0 items-baseline justify-between gap-2">
                                    <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                                      {t.from.replace(/\s*<.*>$/, "")}
                                    </span>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                      {relativeTime(t.receivedAt)}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 min-w-0 truncate text-xs font-medium text-foreground">
                                    {t.subject}
                                  </p>
                                  <p className="mt-0.5 min-w-0 truncate text-xs text-muted-foreground">
                                    {t.preview}
                                  </p>
                                </CardContent>
                              </Card>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))
                )}
              </ScrollArea>
            </div>
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
                            ["Time", relativeTime(thread.receivedAt)],
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
