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
import type { SurfacePadding } from "@/lib/composition";
import { ApolloShell, type ShellNavItem } from "@/registry/shell/shell";
import { DetailPageExample, type SlotPaddings } from "./DetailPageExample";
import type {
  DetailPageConfig,
  DetailPageSlotName,
} from "./detail-page.template";
import { PreviewControlBar, type ShellVariant } from "./PreviewControlBar";
import { type DetailPageState, useDetailPage } from "./use-detail-page";

interface PreviewContextValue {
  shellVariant: ShellVariant;
  paddings: SlotPaddings;
  detailPage: DetailPageState | null;
}

const PREVIEW_PATH = "/preview/detail-page";

const DEFAULT_CONFIG: DetailPageConfig = {
  panels: "both",
  start: { placement: "below-header", defaultOpen: true },
  end: { placement: "below-header", defaultOpen: true },
};

const DEFAULT_PADDINGS: SlotPaddings = {
  header: "padded",
  "start-panel": "padded",
  main: "padded",
  "end-panel": "padded",
};

const navItems: ShellNavItem[] = [
  { path: `${PREVIEW_PATH}/home`, label: "dashboard", icon: Home },
  { path: PREVIEW_PATH, label: "projects", icon: FolderOpen },
  { path: `${PREVIEW_PATH}/analytics`, label: "analytics", icon: BarChart3 },
];

// The router renders outside the preview's own tree, so settings reach the
// route through context.
const PreviewContext = createContext<PreviewContextValue>({
  shellVariant: "sidebar",
  paddings: DEFAULT_PADDINGS,
  detailPage: null,
});

function PreviewShell() {
  const { shellVariant } = useContext(PreviewContext);
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
  const { paddings, detailPage } = useContext(PreviewContext);
  if (!detailPage) return null;
  return <DetailPageExample state={detailPage} paddings={paddings} />;
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

export function DetailPagePreview() {
  const [router] = useState(createPreviewRouter);
  const [shellVariant, setShellVariant] = useState<ShellVariant>("sidebar");
  const [config, setConfig] = useState<DetailPageConfig>(DEFAULT_CONFIG);
  const [paddings, setPaddings] = useState<SlotPaddings>(DEFAULT_PADDINGS);
  const detailPage = useDetailPage(config);

  const setPadding = (slot: DetailPageSlotName, padding: SurfacePadding) =>
    setPaddings((prev) => ({ ...prev, [slot]: padding }));

  return (
    <QueryClientProvider client={queryClient}>
      <PreviewContext.Provider value={{ shellVariant, paddings, detailPage }}>
        <RouterProvider router={router} />
      </PreviewContext.Provider>
      <PreviewControlBar
        shellVariant={shellVariant}
        onShellVariantChange={setShellVariant}
        config={config}
        onConfigChange={setConfig}
        open={detailPage.open}
        closedBy={detailPage.closedBy}
        onOpenChange={detailPage.setPanelOpen}
        paddings={paddings}
        onPaddingChange={setPadding}
      />
    </QueryClientProvider>
  );
}
