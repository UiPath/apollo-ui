"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { BarChart3, FolderOpen, Home } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SurfacePadding } from "@/lib/composition";
import { ApolloShell, type ShellNavItem } from "@/registry/shell/shell";
import { DetailPageExample, type SlotPaddings } from "./DetailPageExample";
import {
  type DetailPageSlotName,
  detailPageTemplate,
} from "./detail-page.template";

type ShellVariant = "sidebar" | "minimal";

interface PreviewSettings {
  shellVariant: ShellVariant;
  paddings: SlotPaddings;
}

const PREVIEW_PATH = "/preview/detail-page";

const DEFAULT_SETTINGS: PreviewSettings = {
  shellVariant: "sidebar",
  paddings: {
    header: "padded",
    "start-panel": "padded",
    main: "padded",
    "end-panel": "padded",
  },
};

const SLOT_LABELS: Record<DetailPageSlotName, string> = {
  header: "Header",
  "start-panel": "Start",
  main: "Main",
  "end-panel": "End",
};

const navItems: ShellNavItem[] = [
  { path: `${PREVIEW_PATH}/home`, label: "dashboard", icon: Home },
  { path: PREVIEW_PATH, label: "projects", icon: FolderOpen },
  { path: `${PREVIEW_PATH}/analytics`, label: "analytics", icon: BarChart3 },
];

const PreviewSettingsContext = createContext<PreviewSettings>(DEFAULT_SETTINGS);

function PreviewShell() {
  const { shellVariant } = useContext(PreviewSettingsContext);
  return (
    <ApolloShell
      companyName="UiPath"
      productName="Apollo Vertex"
      companyLogo={{
        url: "/UiPath.svg",
        darkUrl: "/UiPath_dark.svg",
        alt: "UiPath logo",
      }}
      {...(shellVariant === "minimal" && { variant: "minimal" })}
      navItems={navItems}
    >
      <Outlet />
    </ApolloShell>
  );
}

function PreviewPage() {
  const { paddings } = useContext(PreviewSettingsContext);
  return <DetailPageExample paddings={paddings} />;
}

// Every path renders the same page, so nav clicks stay on the preview.
const rootRoute = createRootRoute({ component: PreviewShell });
const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$",
  component: PreviewPage,
});
const routeTree = rootRoute.addChildren([catchAllRoute]);

const queryClient = new QueryClient();

function createPreviewRouter() {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [PREVIEW_PATH] }),
  });
}

function isSurfacePadding(value: string): value is SurfacePadding {
  return value === "padded" || value === "flush";
}

export function DetailPagePreview() {
  const [settings, setSettings] = useState<PreviewSettings>(DEFAULT_SETTINGS);
  const [router] = useState(createPreviewRouter);

  const setPadding = (slot: DetailPageSlotName, padding: SurfacePadding) =>
    setSettings((prev) => ({
      ...prev,
      paddings: { ...prev.paddings, [slot]: padding },
    }));

  return (
    <QueryClientProvider client={queryClient}>
      <PreviewSettingsContext.Provider value={settings}>
        <RouterProvider router={router} />
      </PreviewSettingsContext.Provider>
      <div className="fixed bottom-4 left-1/2 z-[60] flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-lg border border-border bg-background p-2 shadow-md">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={settings.shellVariant}
          onValueChange={(value) => {
            if (value === "sidebar" || value === "minimal") {
              setSettings((prev) => ({ ...prev, shellVariant: value }));
            }
          }}
          aria-label="Shell variant"
        >
          <ToggleGroupItem value="sidebar">Sidebar shell</ToggleGroupItem>
          <ToggleGroupItem value="minimal">Minimal shell</ToggleGroupItem>
        </ToggleGroup>
        {detailPageTemplate.slots.map(({ name }) => (
          <div key={name} className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {SLOT_LABELS[name]}
            </span>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={settings.paddings[name]}
              onValueChange={(value) => {
                if (isSurfacePadding(value)) setPadding(name, value);
              }}
              aria-label={`${SLOT_LABELS[name]} padding`}
            >
              <ToggleGroupItem value="padded">Padded</ToggleGroupItem>
              <ToggleGroupItem value="flush">Flush</ToggleGroupItem>
            </ToggleGroup>
          </div>
        ))}
      </div>
    </QueryClientProvider>
  );
}
