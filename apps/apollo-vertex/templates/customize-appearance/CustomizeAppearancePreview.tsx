"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  RouterProvider,
} from "@tanstack/react-router";
import { BarChart3, FolderOpen, Home, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { ApolloShell, type ShellNavItem } from "@/components/ui/shell";
import { Toaster } from "@/components/ui/sonner";
import { brandingStore, useBrandingStore } from "./branding-store";
import { buildBrandingStyle } from "./color-utils";
import { CustomizeAppearance } from "./CustomizeAppearance";

export interface CustomizeAppearancePreviewProps {
  variant?: "minimal";
}

const PLACEHOLDER_KEYS = {
  dashboard: "Dashboard",
  projects: "Projects",
  analytics: "Analytics",
} as const;

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="text-muted-foreground">
          Navigate to Settings to customize appearance.
        </p>
      </div>
    </div>
  );
}

function BrandedShell({ variant }: { variant?: "minimal" }) {
  const { appTitle, logoUrl, logoAlt } = useBrandingStore();

  const navItems: ShellNavItem[] =
    variant === "minimal"
      ? [
          {
            path: "/preview/customize-appearance-minimal",
            label: "dashboard",
            icon: Home,
          },
          {
            path: "/preview/customize-appearance-minimal/projects",
            label: "projects",
            icon: FolderOpen,
          },
          {
            path: "/preview/customize-appearance-minimal/settings",
            label: "settings",
            icon: Settings,
          },
        ]
      : [
          {
            path: "/preview/customize-appearance/dashboard",
            label: "dashboard",
            icon: Home,
          },
          {
            path: "/preview/customize-appearance/projects",
            label: "projects",
            icon: FolderOpen,
          },
          {
            path: "/preview/customize-appearance/analytics",
            label: "analytics",
            icon: BarChart3,
          },
          {
            path: "/preview/customize-appearance/settings",
            label: "settings",
            icon: Settings,
          },
        ];

  return (
    <ApolloShell
      companyName={appTitle || "Your Company"}
      productName="Apollo Vertex"
      companyLogo={
        logoUrl
          ? {
              url: logoUrl,
              alt: logoAlt || "Company logo",
              isCustom: true,
            }
          : {
              url: "/UiPath.svg",
              darkUrl: "/UiPath_dark.svg",
              alt: "UiPath",
            }
      }
      variant={variant}
      navItems={navItems}
    >
      <Outlet />
    </ApolloShell>
  );
}

function buildRouter(variant?: "minimal") {
  const rootRoute = createRootRoute();
  const basePath =
    variant === "minimal"
      ? "/preview/customize-appearance-minimal"
      : "/preview/customize-appearance";

  const shellRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: basePath,
    component: () => <BrandedShell variant={variant} />,
  });

  const routes = [
    createRoute({
      getParentRoute: () => shellRoute,
      path: "/",
      component: () => <PlaceholderPage title={PLACEHOLDER_KEYS.dashboard} />,
    }),
    createRoute({
      getParentRoute: () => shellRoute,
      path: "/dashboard",
      component: () => <PlaceholderPage title={PLACEHOLDER_KEYS.dashboard} />,
    }),
    createRoute({
      getParentRoute: () => shellRoute,
      path: "/projects",
      component: () => <PlaceholderPage title={PLACEHOLDER_KEYS.projects} />,
    }),
    createRoute({
      getParentRoute: () => shellRoute,
      path: "/analytics",
      component: () => <PlaceholderPage title={PLACEHOLDER_KEYS.analytics} />,
    }),
    createRoute({
      getParentRoute: () => shellRoute,
      path: "/settings",
      component: CustomizeAppearance,
    }),
  ];

  // The shell's company logo links to "/" — redirect any hit outside the
  // preview subtree (including "/") back to the dashboard so the logo click
  // lands somewhere meaningful inside the memory router.
  const catchAllRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "$",
    beforeLoad: () => {
      // oxlint-disable-next-line typescript-eslint/only-throw-error -- TanStack Router uses thrown redirects as its redirect API
      throw redirect({ to: `${basePath}/dashboard` });
    },
  });

  const routeTree = rootRoute.addChildren([
    shellRoute.addChildren(routes),
    catchAllRoute,
  ]);

  const storageKey =
    variant === "minimal"
      ? "customize-appearance-minimal-preview-path"
      : "customize-appearance-preview-path";

  const initialPath =
    typeof window === "undefined"
      ? `${basePath}/settings`
      : (window.localStorage.getItem(storageKey) ?? `${basePath}/settings`);

  const history = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({ routeTree, history });

  router.subscribe("onResolved", ({ toLocation }) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, toLocation.pathname);
    }
  });

  return router;
}

const queryClient = new QueryClient();

function BrandingScope({ children }: { children: React.ReactNode }) {
  const { themeMode, primaryColor, accentColor } = useBrandingStore();
  const style =
    themeMode === "custom" ? buildBrandingStyle(primaryColor, accentColor) : {};

  return (
    <div className="h-full" style={style}>
      {children}
    </div>
  );
}

export function CustomizeAppearancePreview({
  variant,
}: CustomizeAppearancePreviewProps) {
  const [router] = useState(() => buildRouter(variant));

  useEffect(() => {
    void brandingStore.hydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrandingScope>
        <RouterProvider router={router} />
        <Toaster />
      </BrandingScope>
    </QueryClientProvider>
  );
}
