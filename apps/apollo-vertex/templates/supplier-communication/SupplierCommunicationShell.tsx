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
import { LayoutDashboard, Mail } from "lucide-react";
import { useState } from "react";
import { ApolloShell, type ShellNavItem } from "@/registry/shell/shell";
import { CommunicationsPage } from "./communications/CommunicationsPage";

const navItems: ShellNavItem[] = [
  { path: "/dashboard", label: "dashboard", icon: LayoutDashboard },
  { path: "/communications", label: "communications", icon: Mail },
];

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
    </div>
  );
}

function SupplierCommunicationLayout() {
  return (
    <ApolloShell
      companyName="UiPath"
      productName="Supplier Communication"
      companyLogo={{
        url: "/UiPath.svg",
        darkUrl: "/UiPath_dark.svg",
        alt: "UiPath logo",
      }}
      navItems={navItems}
    >
      <Outlet />
    </ApolloShell>
  );
}

const rootRoute = createRootRoute({ component: SupplierCommunicationLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <PlaceholderPage title="Dashboard" />,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => <PlaceholderPage title="Dashboard" />,
});

const communicationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/communications",
  component: CommunicationsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  communicationsRoute,
]);

const queryClient = new QueryClient();

export function SupplierCommunicationShell() {
  const [router] = useState(() =>
    createRouter({
      routeTree,
      // Communications is the built route; Dashboard is still a placeholder.
      history: createMemoryHistory({ initialEntries: ["/communications"] }),
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
