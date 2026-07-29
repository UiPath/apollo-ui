"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  Check,
  ClipboardList,
  ShoppingCart,
  Store,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
import { CloseWindow } from "./requests/CloseWindow";
import { DecisionWindow } from "./requests/DecisionWindow";
import { MyRequests } from "./requests/MyRequests";
import { PORecord } from "./requests/PORecord";
import { RequestsProvider } from "./requests/RequestsProvider";
import { RequestWindow } from "./requests/RequestWindow";
import { TierProvider, useTier } from "./tier-context";
import { Workbench } from "./workbench/Workbench";

// Buy and Catalog are shared front doors. The queue nav item is seat-dependent:
// the requester (Marcus Webb) gets My Requests (their own queue); the buyer
// (procurement) gets the Workbench, where requests that needed judgment land.
const baseNavItems: ShellNavItem[] = [
  { path: "/buy", label: "buy", icon: ShoppingCart },
  { path: "/catalog", label: "catalog", icon: Store },
];

const requesterNavItems: ShellNavItem[] = [
  ...baseNavItems,
  { path: "/requests", label: "requests", icon: ClipboardList },
];

const buyerNavItems: ShellNavItem[] = [
  ...baseNavItems,
  { path: "/workbench", label: "workbench", icon: Wrench },
];

type Seat = "requester" | "buyer";

// Where each seat lands when the identity chip swaps it — its own queue.
const SEAT_HOME: Record<Seat, "/requests" | "/workbench"> = {
  requester: "/requests",
  buyer: "/workbench",
};

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

function TierMenuSection() {
  const { tier, setTier } = useTier();
  return (
    <>
      <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Prototype tier
      </DropdownMenuLabel>
      <DropdownMenuItem
        onClick={() => setTier("p1")}
        className="justify-between"
      >
        <span className="flex items-center gap-2">
          <span className="flex size-4 items-center justify-center shrink-0">
            <span className="size-2 rounded-full bg-primary" />
          </span>
          P1 · Now (CGA)
        </span>
        {tier === "p1" && <Check className="size-3.5 shrink-0 text-primary" />}
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => setTier("p2")}
        className="justify-between"
      >
        <span className="flex items-center gap-2">
          <span className="flex size-4 items-center justify-center shrink-0">
            <span className="size-2 rounded-full bg-(--insight-600)" />
          </span>
          P2 · Next (V2)
        </span>
        {tier === "p2" && (
          <Check className="size-3.5 shrink-0 text-(--insight-600)" />
        )}
      </DropdownMenuItem>
    </>
  );
}

function EmptyPage({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
    </div>
  );
}

function GuidedBuyingLayout() {
  const [seat, setSeat] = useState<Seat>("requester");
  const { location } = useRouterState();
  const { navItems } = SEATS[seat];
  const navigate = useNavigate();
  const { tier } = useTier();
  const avatarClassName =
    tier === "p1"
      ? "bg-primary/15 text-primary"
      : "bg-(--insight-600)/15 text-(--insight-600)";

  // Decision route belongs to Alex Chen — reflect that in the shell identity chip
  // rather than showing Marcus while the page header says Alex.
  const isDecisionRoute = location.pathname.startsWith("/decision/");
  const user = isDecisionRoute
    ? { name: "Alex Chen", email: "Design Director" }
    : SEATS[seat].user;

  // Switching seats swaps the nav and lands on that seat's own queue: the buyer
  // (procurement) drops into the Workbench; the requester into My Requests.
  const switchSeat = () => {
    const next: Seat = seat === "requester" ? "buyer" : "requester";
    setSeat(next);
    void navigate({ to: SEAT_HOME[next] });
  };

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
      onUserClick={switchSeat}
      userMenuAdditionalItems={<TierMenuSection />}
      avatarClassName={avatarClassName}
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

// My Requests — the requester's durable queue of their own submitted requests.
const requestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/requests",
  component: MyRequests,
});

// Request Window — full-page detail for a single request.
const requestDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/requests/$id",
  component: RequestWindow,
});

// Close Window — delivery receipt after goods arrive.
const closeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/close/$id",
  component: CloseWindow,
});

// PO Record — purchase order detail, reachable from the Close screen chip only.
const poRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/po/$id",
  component: PORecord,
});

// Decision Window — approver's view of a pending-approval request.
const decisionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/decision/$id",
  component: DecisionWindow,
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
  requestsRoute,
  requestDetailRoute,
  closeRoute,
  poRoute,
  decisionRoute,
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
      <TierProvider>
        <CartProvider>
          <ConversationProvider>
            <RequestsProvider>
              <AutopilotChatProvider>
                {/* Global gradient def — all AiMark icons reference "gb-ai-mark" */}
                <svg width={0} height={0} aria-hidden className="absolute">
                  <defs>
                    <linearGradient
                      id="gb-ai-mark"
                      x1="2"
                      y1="4"
                      x2="22"
                      y2="20"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0" stopColor="var(--ai-gradient-start)" />
                      <stop offset="1" stopColor="var(--ai-gradient-end)" />
                    </linearGradient>
                  </defs>
                </svg>
                <RouterProvider router={router} />
              </AutopilotChatProvider>
            </RequestsProvider>
          </ConversationProvider>
        </CartProvider>
      </TierProvider>
    </QueryClientProvider>
  );
}
