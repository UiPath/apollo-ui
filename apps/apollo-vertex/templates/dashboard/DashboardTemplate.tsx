"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  dashboardCatchAllRoute,
  dashboardHomeRoute,
  dashboardIndexRoute,
  dashboardMinimalCatchAllRoute,
  dashboardMinimalIndexRoute,
  dashboardMinimalShellRoute,
  dashboardRootRoute,
  dashboardShellRoute,
} from "./DashboardRoutes";

export interface DashboardTemplateProps {
  shellVariant?: "minimal";
}

const DASHBOARD_PREVIEW_PATH_KEY = "dashboard-preview-path";
const DASHBOARD_MINIMAL_PREVIEW_PATH_KEY = "dashboard-minimal-preview-path";

type DashboardPreviewPathKey =
  | typeof DASHBOARD_PREVIEW_PATH_KEY
  | typeof DASHBOARD_MINIMAL_PREVIEW_PATH_KEY;

const queryClient = new QueryClient();

const routeTree = dashboardRootRoute.addChildren([
  dashboardShellRoute.addChildren([
    dashboardIndexRoute,
    dashboardHomeRoute,
    dashboardCatchAllRoute,
  ]),
  dashboardMinimalShellRoute.addChildren([
    dashboardMinimalIndexRoute,
    dashboardMinimalCatchAllRoute,
  ]),
]);

function getInitialEntry(
  storageKey: DashboardPreviewPathKey,
  variant?: "minimal",
) {
  const stored = localStorage.getItem(storageKey);
  if (stored) return stored;
  return variant === "minimal"
    ? "/preview/dashboard-minimal"
    : "/preview/dashboard";
}

function createDashboardRouter(
  storageKey: DashboardPreviewPathKey,
  variant?: "minimal",
) {
  const history = createMemoryHistory({
    initialEntries: [getInitialEntry(storageKey, variant)],
  });
  return createRouter({ routeTree, history });
}

export function DashboardTemplate({ shellVariant }: DashboardTemplateProps) {
  const storageKey =
    shellVariant === "minimal"
      ? DASHBOARD_MINIMAL_PREVIEW_PATH_KEY
      : DASHBOARD_PREVIEW_PATH_KEY;
  const [router] = useState(() =>
    createDashboardRouter(storageKey, shellVariant),
  );

  useEffect(() => {
    const unsubscribe = router.subscribe("onResolved", ({ toLocation }) => {
      localStorage.setItem(storageKey, toLocation.pathname);
    });
    return unsubscribe;
  }, [router, storageKey]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
