"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  shellMinimalAnalyticsRoute,
  shellMinimalCatchAllRoute,
  shellMinimalIndexRoute,
  shellMinimalProjectsRoute,
  shellMinimalRoute,
} from "./ShellMinimalRoutes";
import { NotFoundPage } from "./ShellPages";
import {
  shellAnalyticsRoute,
  shellCatchAllRoute,
  shellDashboardRoute,
  shellIndexRoute,
  shellInvoiceDetailRoute,
  shellProjectsActiveRoute,
  shellProjectsArchiveRoute,
  shellProjectsRoute,
  shellRoute,
  shellSettingsRoute,
  shellTeamRoute,
} from "./ShellRoutes";
import { rootRoute } from "./ShellRouteTree";

export interface ShellTemplateProps {
  variant?: "minimal";
  initialPath?: string;
}

const SHELL_PREVIEW_PATH_KEY = "shell-preview-path";
const SHELL_MINIMAL_PREVIEW_PATH_KEY = "shell-minimal-preview-path";

type ShellPreviewPathKey =
  | typeof SHELL_PREVIEW_PATH_KEY
  | typeof SHELL_MINIMAL_PREVIEW_PATH_KEY;

const queryClient = new QueryClient();

const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$",
  component: () => <NotFoundPage to="/preview/shell/dashboard" />,
});

const routeTree = rootRoute.addChildren([
  shellRoute.addChildren([
    shellIndexRoute,
    shellDashboardRoute,
    shellInvoiceDetailRoute,
    shellProjectsRoute,
    shellProjectsActiveRoute,
    shellProjectsArchiveRoute,
    shellAnalyticsRoute,
    shellTeamRoute,
    shellSettingsRoute,
    shellCatchAllRoute,
  ]),
  shellMinimalRoute.addChildren([
    shellMinimalIndexRoute,
    shellMinimalProjectsRoute,
    shellMinimalAnalyticsRoute,
    shellMinimalCatchAllRoute,
  ]),
  catchAllRoute,
]);

function getInitialEntry(
  storageKey: ShellPreviewPathKey,
  variant?: "minimal",
  initialPath?: string,
) {
  if (initialPath) return initialPath;
  const stored = localStorage.getItem(storageKey);
  if (stored) return stored;
  return variant === "minimal" ? "/preview/shell-minimal" : "/preview/shell";
}

function createShellRouter(
  storageKey: ShellPreviewPathKey,
  variant?: "minimal",
  initialPath?: string,
) {
  const history = createMemoryHistory({
    initialEntries: [getInitialEntry(storageKey, variant, initialPath)],
  });
  return createRouter({ routeTree, history });
}

export function ShellTemplate({ variant, initialPath }: ShellTemplateProps) {
  const storageKey =
    variant === "minimal"
      ? SHELL_MINIMAL_PREVIEW_PATH_KEY
      : SHELL_PREVIEW_PATH_KEY;
  const [router] = useState(() =>
    createShellRouter(storageKey, variant, initialPath),
  );

  useEffect(() => {
    if (initialPath) return;
    const unsubscribe = router.subscribe("onResolved", ({ toLocation }) => {
      localStorage.setItem(storageKey, toLocation.pathname);
    });
    return unsubscribe;
  }, [router, storageKey, initialPath]);
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
