import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";
import { DashboardContent } from "./DashboardContent";
import { DashboardShellWrapper } from "./DashboardShellWrapper";

export const dashboardRootRoute = createRootRoute();

// --- Sidebar variant routes ---

export const dashboardShellRoute = createRoute({
  getParentRoute: () => dashboardRootRoute,
  path: "/preview/dashboard",
  component: () => (
    <DashboardShellWrapper>
      <Outlet />
    </DashboardShellWrapper>
  ),
});

export const dashboardIndexRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "/",
  component: DashboardContent,
});

export const dashboardHomeRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "/home",
  component: DashboardContent,
});

export const dashboardCatchAllRoute = createRoute({
  getParentRoute: () => dashboardShellRoute,
  path: "$",
  component: DashboardContent,
});

// --- Minimal variant routes ---

export const dashboardMinimalShellRoute = createRoute({
  getParentRoute: () => dashboardRootRoute,
  path: "/preview/dashboard-minimal",
  component: () => (
    <DashboardShellWrapper variant="minimal">
      <Outlet />
    </DashboardShellWrapper>
  ),
});

export const dashboardMinimalIndexRoute = createRoute({
  getParentRoute: () => dashboardMinimalShellRoute,
  path: "/",
  component: DashboardContent,
});

export const dashboardMinimalCatchAllRoute = createRoute({
  getParentRoute: () => dashboardMinimalShellRoute,
  path: "$",
  component: DashboardContent,
});
