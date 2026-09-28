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
import {
  type CSSProperties,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { SIDE_PANEL_TINT_STRENGTH } from "@/lib/composition";
import { ApolloShell, type ShellNavItem } from "@/registry/shell/shell";
import { DetailPageExample } from "./DetailPageExample";
import type { PanelSide } from "./detail-page.template";
import { PreviewControlBar } from "./PreviewControlBar";
import {
  DEFAULT_PREVIEW_SETTINGS,
  type PreviewSettings,
  parsePreviewSettings,
  serializePreviewSettings,
} from "./preview-url-state";
import { type DetailPageState, useDetailPage } from "./use-detail-page";

interface PreviewContextValue {
  settings: PreviewSettings;
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

function PreviewPage() {
  const preview = useContext(PreviewContext);
  if (!preview) return null;
  return (
    <DetailPageExample
      state={preview.detailPage}
      paddings={preview.settings.paddings}
      contents={preview.settings.contents}
      scrolls={preview.settings.scrolls}
    />
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
  // Preview-only tuning of --side-panel-tint. Starts at the token's 60% and
  // is not stored in the URL. Null means use the token as shipped.
  const [tintStrength, setTintStrength] = useState<number | null>(null);
  const tintStyle: CSSProperties &
    Partial<Record<"--side-panel-tint", string>> =
    tintStrength === null
      ? {}
      : {
          "--side-panel-tint": `color-mix(in oklab, var(--sidebar) ${tintStrength}%, transparent)`,
        };
  const detailPage = useDetailPage(settings.config);

  // Resets and Back both replace everything with a given set of settings:
  // the preview's own, the hook's panel intent and chosen width, and the
  // tint override.
  const applySettings = (next: PreviewSettings) => {
    setSettings(next);
    detailPage.restore(next.config);
    setTintStrength(null);
  };

  // Reset to defaults. pushState (not replaceState, as everywhere else) so
  // Back undoes it. Focus returns to the card's first control afterwards.
  const focusAfterReset = useRef(false);
  const resetToDefaults = () => {
    window.history.pushState(
      null,
      "",
      `${window.location.pathname}${window.location.hash}`,
    );
    applySettings(DEFAULT_PREVIEW_SETTINGS);
    focusAfterReset.current = true;
  };
  useEffect(() => {
    if (!focusAfterReset.current) return;
    focusAfterReset.current = false;
    // The card's first control is its first toggle group. Focus its
    // checked item, the one Tab would land on after a fresh render. Radix
    // otherwise keeps whichever item was last focused as the Tab stop.
    const firstGroup = document.querySelector<HTMLElement>(
      `#${CONFIG_CARD_ID} [role="group"]`,
    );
    const target =
      firstGroup?.querySelector<HTMLElement>('[aria-checked="true"]') ??
      firstGroup?.querySelector<HTMLElement>('[role="radio"]');
    target?.focus();
  });

  // Back and Forward: read the settings back out of the URL.
  const applyRef = useRef(applySettings);
  useEffect(() => {
    applyRef.current = applySettings;
  });
  useEffect(() => {
    const onPopState = () =>
      applyRef.current(parsePreviewSettings(window.location.search));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Keep the URL in step with the settings. replaceState, so tweaking the
  // preview does not fill the back button history.
  // The end width comes from the hook, which holds the user's chosen width.
  const endWidthChosen = detailPage.endWidthChosen;
  useEffect(() => {
    const query = serializePreviewSettings({
      ...settings,
      config: {
        ...settings.config,
        end: { ...settings.config.end, defaultWidth: endWidthChosen },
      },
    });
    const url = `${window.location.pathname}${query}${window.location.hash}`;
    window.history.replaceState(null, "", url);
  }, [settings, endWidthChosen]);

  // Save the user's choice as the panel's defaultOpen so it lands in the
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
      {/* Scopes the tint override to the preview; `contents` adds no box. */}
      <div className="contents" style={tintStyle}>
        <PreviewContext.Provider value={{ settings, detailPage }}>
          <RouterProvider router={router} />
        </PreviewContext.Provider>
      </div>
      <div className="fixed right-4 bottom-4 z-60 flex flex-col items-end gap-2">
        <div id={CONFIG_CARD_ID} hidden={!isCardOpen}>
          <PreviewControlBar
            settings={settings}
            onChange={setSettings}
            open={detailPage.open}
            closedBy={detailPage.closedBy}
            onOpenChange={setPanelOpen}
            endWidth={detailPage.endWidth}
            endWidthChosen={detailPage.endWidthChosen}
            onResetEndWidth={detailPage.resetEndWidth}
            tintStrength={tintStrength ?? SIDE_PANEL_TINT_STRENGTH}
            onTintStrengthChange={setTintStrength}
            onReset={resetToDefaults}
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
