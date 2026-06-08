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
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  LayoutDashboard,
  Library,
  ShoppingCart,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { AutopilotGradientIcon } from "@/registry/ai-chat/components/icons/autopilot-gradient";
import { ApolloShell, type ShellNavItem } from "@/registry/shell/shell";
import { Catalog } from "./catalog/Catalog";
import { BuyFlow } from "./catalog/v1/BuyFlow";
import { CartProvider } from "./catalog/v1/CartProvider";
import { ConversationProvider } from "./catalog/v1/ConversationProvider";
import { Review } from "./catalog/v1/Review";
import { Workbench } from "./workbench/Workbench";

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
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="flex h-full items-center justify-center"
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <CheckCircle2 className="size-10 text-[#0f7b8a]" aria-hidden />
        <h1 className="text-2xl font-semibold text-foreground">
          Request submitted
        </h1>
        {/* Slim Autopilot presence — the agent stays through confirmation. */}
        <div className="flex items-center gap-1.5">
          <AutopilotGradientIcon size={16} aria-hidden="true" />
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Autopilot</span> ·
            I’ve got this queued — I’ll track it from here.
          </span>
        </div>
      </div>
    </motion.div>
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
  component: BuyFlow,
});

const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/catalog",
  component: Catalog,
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
      // The prototype lands on /buy — the Intake front door. The /catalog link
      // jumps straight to the resolved workspace (Catalog seeds the thread).
      history: createMemoryHistory({ initialEntries: ["/buy"] }),
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <ConversationProvider>
          <RouterProvider router={router} />
        </ConversationProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}
