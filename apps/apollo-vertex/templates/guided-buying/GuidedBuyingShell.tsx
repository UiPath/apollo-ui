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
import { LayoutDashboard, ShoppingCart, Store, Wrench } from "lucide-react";
import { useState } from "react";
import { ApolloShell, type ShellNavItem } from "@/registry/shell/shell";
import { AutopilotChatProvider } from "./AutopilotChatProvider";
import { AutopilotFab } from "./AutopilotFab";
import { Catalog } from "./catalog/Catalog";
import { BuyFlow } from "./catalog/v1/BuyFlow";
import { CartProvider } from "./catalog/v1/CartProvider";
import { CatalogSubmitted } from "./catalog/v1/CatalogSubmitted";
import { ConfigureFlow } from "./catalog/v1/ConfigureFlow";
import { ConversationProvider } from "./catalog/v1/ConversationProvider";
import { Review } from "./catalog/v1/Review";
import { Workbench } from "./workbench/Workbench";

// The requester seat (Marcus Webb) self-serves the buy flow; the buyer seat
// (procurement) also gets the Workbench, where routed requests land.
const requesterNavItems: ShellNavItem[] = [
  { path: "/dashboard", label: "dashboard", icon: LayoutDashboard },
  { path: "/buy", label: "buy", icon: ShoppingCart },
  { path: "/catalog", label: "catalog", icon: Store },
];

const workbenchNavItem: ShellNavItem = {
  path: "/workbench",
  label: "workbench",
  icon: Wrench,
};

const buyerNavItems: ShellNavItem[] = [...requesterNavItems, workbenchNavItem];

type Seat = "requester" | "buyer";

const SEATS: Record<
  Seat,
  { user: { name: string; email: string }; navItems: ShellNavItem[] }
> = {
  requester: {
    user: { name: "Marcus Webb", email: "Requester · Denver team" },
    navItems: requesterNavItems,
  },
  buyer: {
    user: { name: "Sam Rivera", email: "Procurement" },
    navItems: buyerNavItems,
  },
};

function EmptyPage({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
    </div>
  );
}

function GuidedBuyingLayout() {
  const [seat, setSeat] = useState<Seat>("requester");
  const { user, navItems } = SEATS[seat];

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
      user={user}
      onUserClick={() =>
        setSeat((s) => (s === "requester" ? "buyer" : "requester"))
      }
    >
      {/* Clips the Buy↔Configure horizontal slide so it can't flash a scrollbar. */}
      <div className="relative h-full overflow-hidden">
        <Outlet />
      </div>
      {/* One Autopilot home — the orb FAB, same corner on every surface. */}
      <AutopilotFab />
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
  component: BuyFlow,
});

const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/catalog",
  component: Catalog,
});

// Configure with agent (off-catalog contract path — launched from the Buy chip).
const configureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/configure",
  component: ConfigureFlow,
});

const workbenchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workbench",
  component: Workbench,
});

// Review & submit (reached from the cart's "Review & submit").
const reviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/review",
  component: Review,
});

// Submit destination — the catalog request "submitted" finish line.
const trackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/track",
  component: CatalogSubmitted,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  buyRoute,
  catalogRoute,
  configureRoute,
  workbenchRoute,
  reviewRoute,
  trackRoute,
]);

const queryClient = new QueryClient();

export function GuidedBuyingShell() {
  const [router] = useState(() =>
    createRouter({
      routeTree,
      // The prototype lands on /buy — the Intake front door. The /catalog link
      // jumps straight to the resolved workspace (Catalog seeds the thread).
      history: createMemoryHistory({ initialEntries: ["/buy"] }),
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <ConversationProvider>
          <AutopilotChatProvider>
            <RouterProvider router={router} />
          </AutopilotChatProvider>
        </ConversationProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}
