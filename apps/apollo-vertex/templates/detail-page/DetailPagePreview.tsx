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
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { ApolloShell, type ShellNavItem } from "@/registry/shell/shell";
import { DetailPageExample } from "./DetailPageExample";
import type { PanelSide } from "./detail-page.template";
import { PreviewControlBar } from "./PreviewControlBar";
import {
  DEFAULT_PREVIEW_SETTINGS,
  type PreviewSettings,
  parsePreviewSettings,
  type SidebarState,
  serializePreviewSettings,
} from "./preview-url-state";
import { type DetailPageState, useDetailPage } from "./use-detail-page";

type SettingsUpdate = (
  update: (prev: PreviewSettings) => PreviewSettings,
) => void;

interface PreviewContextValue {
  settings: PreviewSettings;
  update: SettingsUpdate;
  detailPage: DetailPageState;
}

const PREVIEW_PATH = "/preview/detail-page";

const navItems: ShellNavItem[] = [
  { path: `${PREVIEW_PATH}/home`, label: "dashboard", icon: Home },
  { path: PREVIEW_PATH, label: "projects", icon: FolderOpen },
  { path: `${PREVIEW_PATH}/analytics`, label: "analytics", icon: BarChart3 },
];

// The router renders outside the preview's own tree, so settings reach the
// route through context.
const PreviewContext = createContext<PreviewContextValue | null>(null);

function PreviewShell() {
  const settings =
    useContext(PreviewContext)?.settings ?? DEFAULT_PREVIEW_SETTINGS;
  return (
    <ApolloShell
      companyName="UiPath"
      productName="Apollo Vertex"
      companyLogo={{
        url: "/UiPath.svg",
        darkUrl: "/UiPath_dark.svg",
        alt: "UiPath logo",
      }}
      {...(settings.shellVariant === "minimal" && { variant: "minimal" })}
      navItems={navItems}
    >
      <Outlet />
    </ApolloShell>
  );
}

interface SidebarSyncProps {
  desired: SidebarState;
  onChange: (state: SidebarState) => void;
}

/**
 * Keeps the Shell's sidebar in step with the preview setting, both ways.
 * Rendered inside the Shell, where useSidebar is available. Only used with
 * the sidebar shell; the minimal shell has no sidebar.
 */
function SidebarSync({ desired, onChange }: SidebarSyncProps) {
  const { open, setOpen } = useSidebar();
  // setOpen is recreated every render; hold the latest in a ref so the
  // setting alone drives the first effect.
  const setOpenRef = useRef(setOpen);
  const lastOpen = useRef(open);

  useEffect(() => {
    setOpenRef.current = setOpen;
  });

  // Wait two frames: the Shell's sidebar width is a framer-motion spring,
  // and a change made while it is still mounting can stall mid-animation.
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        setOpenRef.current(desired === "expanded");
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [desired]);

  // The Shell's own collapse button changes `open`; report it back.
  useEffect(() => {
    if (open === lastOpen.current) return;
    lastOpen.current = open;
    onChange(open ? "expanded" : "collapsed");
  }, [open, onChange]);

  return null;
}

function PreviewPage() {
  const preview = useContext(PreviewContext);
  if (!preview) return null;
  const { settings, update, detailPage } = preview;
  return (
    <>
      {settings.shellVariant === "sidebar" && (
        <SidebarSync
          desired={settings.sidebar}
          onChange={(sidebar) =>
            update((prev) =>
              prev.sidebar === sidebar ? prev : { ...prev, sidebar },
            )
          }
        />
      )}
      <DetailPageExample
        state={detailPage}
        paddings={settings.paddings}
        occupantCount={settings.occupants === "one" ? 1 : 2}
        activeOccupant={settings.startOccupant}
        onActiveOccupantChange={(startOccupant) =>
          update((prev) => ({ ...prev, startOccupant }))
        }
      />
    </>
  );
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
  const detailPage = useDetailPage(settings.config);

  // Keep the URL in step with the settings. replaceState, so tweaking the
  // preview does not fill the back button history.
  useEffect(() => {
    const query = serializePreviewSettings(settings);
    const url = `${window.location.pathname}${query}${window.location.hash}`;
    window.history.replaceState(null, "", url);
  }, [settings]);

  // Every open or close the user makes, from the card or from the page's
  // own toggles, is recorded as the panel's defaultOpen so it lands in the
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

  const pageState: DetailPageState = { ...detailPage, setPanelOpen };

  return (
    <QueryClientProvider client={queryClient}>
      <PreviewContext.Provider
        value={{ settings, update: setSettings, detailPage: pageState }}
      >
        <RouterProvider router={router} />
      </PreviewContext.Provider>
      <div className="fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-2">
        <div id={CONFIG_CARD_ID} hidden={!isCardOpen}>
          <PreviewControlBar
            settings={settings}
            onChange={setSettings}
            open={detailPage.open}
            closedBy={detailPage.closedBy}
            onOpenChange={setPanelOpen}
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
