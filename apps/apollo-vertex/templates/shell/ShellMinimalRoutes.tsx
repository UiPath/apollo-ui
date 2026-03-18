import { createRoute, Outlet } from "@tanstack/react-router";
import { LoanQcDashboard } from "@/app/(preview)/preview/shell-minimal/loan-qc-dashboard";
import { NotFoundPage, PlaceholderPage } from "./ShellPages";
import { ShellWrapper } from "./ShellRoot";
import { rootRoute } from "./ShellRouteTree";

export const shellMinimalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/preview/shell-minimal",
  component: () => (
    <ShellWrapper variant="minimal">
      <Outlet />
    </ShellWrapper>
  ),
});

export const shellMinimalIndexRoute = createRoute({
  getParentRoute: () => shellMinimalRoute,
  path: "/",
  component: LoanQcDashboard,
});

export const shellMinimalProjectsRoute = createRoute({
  getParentRoute: () => shellMinimalRoute,
  path: "/projects",
  component: () => <PlaceholderPage title="Projects" />,
});

export const shellMinimalAnalyticsRoute = createRoute({
  getParentRoute: () => shellMinimalRoute,
  path: "/analytics",
  component: () => <PlaceholderPage title="Analytics" />,
});

export const shellMinimalCatchAllRoute = createRoute({
  getParentRoute: () => shellMinimalRoute,
  path: "$",
  component: () => <NotFoundPage href="/preview/shell-minimal" />,
});
