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
  CheckCircle2,
  LayoutDashboard,
  Library,
  ShoppingCart,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { ApolloShell, type ShellNavItem } from "@/registry/shell/shell";
import { Catalog } from "./catalog/Catalog";
import { CartProvider } from "./catalog/v1/CartProvider";
import { Review } from "./catalog/v1/Review";

const navItems: ShellNavItem[] = [
  { path: "/dashboard", label: "dashboard", icon: LayoutDashboard },
  { path: "/buy", label: "buy", icon: ShoppingCart },
  { path: "/catalog", label: "catalog", icon: Library },
  { path: "/workbench", label: "workbench", icon: Wrench },
];

function EmptyPage({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
    </div>
  );
}

// Stub destination for Submit — the real Track page is a separate task.
function TrackStub() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="space-y-2 text-center">
        <CheckCircle2 className="mx-auto size-10 text-[#0f7b8a]" aria-hidden />
        <h1 className="text-2xl font-semibold text-foreground">
          Request submitted
        </h1>
        <p className="text-sm text-muted-foreground">
          Tracking is coming soon.
        </p>
      </div>
    </div>
  );
}

function GuidedBuyingLayout() {
  return (
    <ApolloShell
      companyName="UiPath"
      productName="Guided Buying"
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

const rootRoute = createRootRoute({ component: GuidedBuyingLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <EmptyPage title="Dashboard" />,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => <EmptyPage title="Dashboard" />,
});

const buyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/buy",
  component: () => <EmptyPage title="Buy" />,
});

const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/catalog",
  component: Catalog,
});

const workbenchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workbench",
  component: () => <EmptyPage title="Workbench" />,
});

// Review & submit (reached from the cart's "Review & submit").
const reviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/review",
  component: Review,
});

// Track stub (Submit destination; the real Track page is a separate task).
const trackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/track",
  component: TrackStub,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  buyRoute,
  catalogRoute,
  workbenchRoute,
  reviewRoute,
  trackRoute,
]);

const queryClient = new QueryClient();

export function GuidedBuyingShell() {
  const [router] = useState(() =>
    createRouter({
      routeTree,
      // TODO: default to /dashboard once more sections are built; for now the
      // prototype lands on /catalog (the Selection screen) — the active work.
      history: createMemoryHistory({ initialEntries: ["/catalog"] }),
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </QueryClientProvider>
  );
}
