"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
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
  shellProjectsRoute,
  shellRoute,
  shellSettingsRoute,
  shellTeamRoute,
} from "./ShellRoutes";
import { rootRoute } from "./ShellRouteTree";

export interface ShellTemplateProps {
  variant?: "minimal";
}

const queryClient = new QueryClient();

const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$",
  component: () => <NotFoundPage href="/preview/shell/dashboard" />,
});

const routeTree = rootRoute.addChildren([
  shellRoute.addChildren([
    shellIndexRoute,
    shellDashboardRoute,
    shellProjectsRoute,
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

function getInitialEntry(variant?: "minimal") {
  if (variant === "minimal") {
    return "/preview/shell-minimal";
  }
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/preview/shell")
  ) {
    return window.location.pathname;
  }
  return "/preview/shell";
}

function createShellRouter(variant?: "minimal") {
  const history = createMemoryHistory({
    initialEntries: [getInitialEntry(variant)],
  });
  return createRouter({ routeTree, history });
}

export function ShellTemplate({ variant }: ShellTemplateProps) {
  const router = createShellRouter(variant);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
