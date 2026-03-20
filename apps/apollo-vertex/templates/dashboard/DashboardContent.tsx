"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Layout type ---

type LayoutType = "executive" | "operational" | "analytics";

// --- Layout renderers ---

function ExecutiveLayout() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left half — 80/20 split */}
      <div className="grid grid-rows-[4fr_1fr] gap-4">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base font-bold">Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Total revenue this quarter: $2.4M (+14%)</p>
            <p>Active users: 12,847 across 3 regions</p>
            <p>Top performing segment: Enterprise ($1.8M)</p>
            <p>Pipeline value: $4.2M (68 deals)</p>
            <p>Avg. deal cycle: 32 days (-4 days)</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Conversational Prompt Bar
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="rounded-md border px-3 py-2 bg-muted/50">
              Ask a question about your data...
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Right half — 2x2 grid */}
      <div className="grid grid-cols-2 grid-rows-2 gap-4">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base font-bold">Insight</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Churn risk detected for 3 accounts</p>
            <p>Estimated impact: $120K ARR</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base font-bold">Insight</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Q1 target: 85% achieved</p>
            <p>15 days remaining in quarter</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base font-bold">Insight</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Support tickets down 12% WoW</p>
            <p>Avg. resolution: 4.2 hrs</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base font-bold">Insight</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>3 automations flagged for review</p>
            <p>Success rate: 98.1%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OperationalLayout() {
  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      Operational layout — coming soon
    </div>
  );
}

function AnalyticsLayout() {
  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      Analytics layout — coming soon
    </div>
  );
}

// --- Main component ---

const layoutLabels: Record<LayoutType, string> = {
  executive: "Executive",
  operational: "Operational",
  analytics: "Analytics",
};

const layoutDescriptions: Record<LayoutType, string> = {
  executive: "High-level overview with KPIs, summary table, and activity chart",
  operational:
    "Detailed operational view with data table, activity feed, and pipeline",
  analytics:
    "Data-focused layout with charts, compliance metrics, and detailed table",
};

export function DashboardContent() {
  const [layout, setLayout] = useState<LayoutType>("executive");

  return (
    <div className="p-6 space-y-4 relative z-10">
      {/* Header with layout toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-base font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {layoutDescriptions[layout]}
          </p>
        </div>
        <Tabs value={layout} onValueChange={(v) => setLayout(v as LayoutType)}>
          <TabsList>
            {(Object.keys(layoutLabels) as LayoutType[]).map((key) => (
              <TabsTrigger key={key} value={key}>
                {layoutLabels[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Layout content */}
      {layout === "executive" && <ExecutiveLayout />}
      {layout === "operational" && <OperationalLayout />}
      {layout === "analytics" && <AnalyticsLayout />}
    </div>
  );
}
