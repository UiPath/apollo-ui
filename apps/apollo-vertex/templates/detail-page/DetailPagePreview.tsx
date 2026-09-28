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
import {
  BarChart3,
  FolderOpen,
  Home,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { SurfacePadding } from "@/lib/composition";
import { ApolloShell, type ShellNavItem } from "@/registry/shell/shell";
import { DetailPageExample, type SlotPaddings } from "./DetailPageExample";
import type { DetailPageSlotName, PanelSide } from "./detail-page.template";
import { PreviewControlBar, type ShellVariant } from "./PreviewControlBar";
import {
  DEFAULT_PREVIEW_SETTINGS,
  type PreviewSettings,
  parsePreviewSettings,
  serializePreviewSettings,
} from "./preview-url-state";
import { type DetailPageState, useDetailPage } from "./use-detail-page";

interface PreviewContextValue {
  shellVariant: ShellVariant;
  paddings: SlotPaddings;
  detailPage: DetailPageState | null;
}

const PREVIEW_PATH = "/preview/detail-page";

const navItems: ShellNavItem[] = [
  { path: `${PREVIEW_PATH}/home`, label: "dashboard", icon: Home },
  { path: PREVIEW_PATH, label: "projects", icon: FolderOpen },
  { path: `${PREVIEW_PATH}/analytics`, label: "analytics", icon: BarChart3 },
];

// The router renders outside the preview's own tree, so settings reach the
// route through context.
const PreviewContext = createContext<PreviewContextValue>({
  shellVariant: "sidebar",
  paddings: DEFAULT_PREVIEW_SETTINGS.paddings,
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

const CONFIG_CARD_ID = "detail-page-preview-config";

export function DetailPagePreview() {
  const [router] = useState(createPreviewRouter);
  // The preview only renders client-side, so the URL is readable up front.
  const [settings, setSettings] = useState<PreviewSettings>(() =>
    parsePreviewSettings(window.location.search),
  );
  // Not stored in the URL, so shared links open looking like a real page.
  const [isCardOpen, setIsCardOpen] = useState(false);
  const { shellVariant, config, paddings } = settings;
  const detailPage = useDetailPage(config);

  // Keep the URL in step with the settings. replaceState, so tweaking the
  // preview does not fill the back button history.
  useEffect(() => {
    const query = serializePreviewSettings(settings);
    const url = `${window.location.pathname}${query}${window.location.hash}`;
    window.history.replaceState(null, "", url);
  }, [settings]);

  const setShellVariant = (variant: ShellVariant) =>
    setSettings((prev) => ({ ...prev, shellVariant: variant }));

  const setConfig = (next: PreviewSettings["config"]) =>
    setSettings((prev) => ({ ...prev, config: next }));

  const setPadding = (slot: DetailPageSlotName, padding: SurfacePadding) =>
    setSettings((prev) => ({
      ...prev,
      paddings: { ...prev.paddings, [slot]: padding },
    }));

  // Record the user's choice as the panel's defaultOpen so it lands in the
  // URL. Closes made by the main-width rule never reach here.
  const setPanelOpen = (side: PanelSide, open: boolean) => {
    detailPage.setPanelOpen(side, open);
    setSettings((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [side]: { ...prev.config[side], defaultOpen: open },
      },
    }));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <PreviewContext.Provider value={{ shellVariant, paddings, detailPage }}>
        <RouterProvider router={router} />
      </PreviewContext.Provider>
      <div className="fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-2">
        <div id={CONFIG_CARD_ID} hidden={!isCardOpen}>
          <PreviewControlBar
            shellVariant={shellVariant}
            onShellVariantChange={setShellVariant}
            config={config}
            onConfigChange={setConfig}
            open={detailPage.open}
            closedBy={detailPage.closedBy}
            onOpenChange={setPanelOpen}
            paddings={paddings}
            onPaddingChange={setPadding}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shadow-md"
          aria-expanded={isCardOpen}
          aria-controls={CONFIG_CARD_ID}
          onClick={() => setIsCardOpen((open) => !open)}
        >
          {isCardOpen ? <X /> : <SlidersHorizontal />}
          Configure
        </Button>
      </div>
    </QueryClientProvider>
  );
}
