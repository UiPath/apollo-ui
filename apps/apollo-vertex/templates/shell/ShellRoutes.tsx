import { createRoute, Outlet } from "@tanstack/react-router";
import { InvoiceDashboard } from "@/app/(preview)/preview/shell/invoice-dashboard";
import { NotFoundPage, PlaceholderPage, SelectPage } from "./ShellPages";
import { ShellWrapper } from "./ShellRoot";
import { rootRoute } from "./ShellRouteTree";

export const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/preview/shell",
  component: () => (
    <ShellWrapper>
      <Outlet />
    </ShellWrapper>
  ),
});

export const shellIndexRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/",
  component: SelectPage,
});

export const shellDashboardRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/dashboard",
  component: InvoiceDashboard,
});

export const shellProjectsRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/projects",
  component: () => <PlaceholderPage title="Projects" />,
});

export const shellAnalyticsRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/analytics",
  component: () => <PlaceholderPage title="Analytics" />,
});

export const shellTeamRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/team",
  component: () => <PlaceholderPage title="Team" />,
});

export const shellSettingsRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/settings",
  component: () => <PlaceholderPage title="Settings" />,
});

export const shellCatchAllRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "$",
  component: () => <NotFoundPage href="/preview/shell/dashboard" />,
});
