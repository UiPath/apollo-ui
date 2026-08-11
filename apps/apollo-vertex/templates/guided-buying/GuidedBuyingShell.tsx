"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
// Type-only: RoutePaths isn't re-exported from @tanstack/react-router's own
// entrypoint, but it's the utility that derives the actual union of
// registered paths from a route tree, which is the whole point here — see
// the step 2 report on why a hand-written union wouldn't do the same job.
import type { RoutePaths } from "@tanstack/router-core";
import {
  Check,
  ClipboardCheck,
  ClipboardList,
  Home as HomeIcon,
  ShoppingCart,
  Store,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { ApolloShell, type ShellNavItem } from "@/registry/shell/shell";
import { AutopilotChatProvider } from "./AutopilotChatProvider";
import { AutopilotFab } from "./AutopilotFab";
import { Catalog } from "./catalog/Catalog";
import { AssistantThreadProvider } from "./catalog/v1/assistant-thread-context";
import { BuyFlow } from "./catalog/v1/BuyFlow";
import { CartProvider } from "./catalog/v1/CartProvider";
import { CatalogSubmitted } from "./catalog/v1/CatalogSubmitted";
import { ConfigureFlow } from "./catalog/v1/ConfigureFlow";
import { ConversationProvider } from "./catalog/v1/ConversationProvider";
import { Review } from "./catalog/v1/Review";
import { Home } from "./home/Home";
import { Approvals } from "./requests/Approvals";
import { avatarColorFor } from "./requests/avatar-color";
import { DecisionWindow } from "./requests/DecisionWindow";
import { getDecisionDetail } from "./requests/data";
import { MyRequests } from "./requests/MyRequests";
import { PORecordPage } from "./requests/PORecord";
import { RequestsProvider } from "./requests/RequestsProvider";
import { RequestWindow } from "./requests/RequestWindow";
import { TierProvider, useTier } from "./tier-context";
import { Workbench } from "./workbench/Workbench";

// Home, Buy, and Catalog are requester surfaces. Home is the composer +
// "Your requests"; Buy creates a request; Catalog (Selection.tsx under the
// hood) has its own add-to-cart affordances writing into the same unscoped
// cart/conversation state Buy uses (see the step 2 report on Catalog) — none
// of the three has a notion of whose request it is, so none of them are
// safe to also expose to the buyer or approver nav. Each of those gets only
// its own queue.
const requesterNavItems: ShellNavItem[] = [
  { path: "/home", label: "home", icon: HomeIcon },
  { path: "/buy", label: "buy", icon: ShoppingCart },
  { path: "/catalog", label: "catalog", icon: Store },
  { path: "/requests", label: "requests", icon: ClipboardList },
];

const buyerNavItems: ShellNavItem[] = [
  { path: "/workbench", label: "workbench", icon: Wrench },
];

const approverNavItems: ShellNavItem[] = [
  { path: "/approvals", label: "approvals", icon: ClipboardCheck },
];

type PersonaId = "requester" | "buyer" | "approver";

interface Persona {
  id: PersonaId;
  name: string;
  /** The word the popover's persona list uses for "{name} · {role}". See
   * the step 1 report: "Buyer" and "Approver" are new words, not present
   * in today's seed data. */
  role: string;
  /** The identity chip's subtitle, authored directly rather than derived —
   * the three legacy strings (role+location, department, job title) don't
   * share a composition rule. See the step 2 report. */
  chipSubtitle: string;
  /** Validated against the actual route tree below (RoutePaths), not a
   * hand-written union — see the step 2 report on why a plain `string`
   * let an unregistered route through undetected. */
  homeRoute: RoutePaths<typeof routeTree>;
  navItems: ShellNavItem[];
}

const PERSONAS: Record<PersonaId, Persona> = {
  requester: {
    id: "requester",
    name: "Marcus Webb",
    role: "Requester",
    chipSubtitle: "Requester · Denver team",
    homeRoute: "/requests",
    navItems: requesterNavItems,
  },
  buyer: {
    id: "buyer",
    name: "Sam Rivera",
    role: "Buyer",
    chipSubtitle: "Procurement",
    homeRoute: "/workbench",
    navItems: buyerNavItems,
  },
  approver: {
    id: "approver",
    name: "Alex Chen",
    role: "Approver",
    chipSubtitle: "Design Director",
    homeRoute: "/approvals",
    navItems: approverNavItems,
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

// Which persona owns a given route prefix — used once, at mount, to pick
// the identity chip that matches the surface actually being viewed. Landing
// straight on an approver or buyer route (a link from elsewhere, a shared
// URL, a fresh load) previously always started on the requester's identity
// regardless of the route, since persona state had no route-derived value
// at all. This doesn't reintroduce a route-derived override on every
// navigation — it only seeds the initial value, so the switcher stays the
// single authority once mounted, per this file's own comment on
// `switchPersona`.
function personaForPath(pathname: string): PersonaId {
  if (pathname.startsWith("/decision") || pathname.startsWith("/approvals")) {
    return "approver";
  }
  if (pathname.startsWith("/workbench")) return "buyer";
  return "requester";
}

function EmptyPage({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
    </div>
  );
}

// Menu order — Requester, Buyer, Approver, per the spec.
const PERSONA_MENU_ORDER: PersonaId[] = ["requester", "buyer", "approver"];

// Same section-label and checked-state treatment as TierMenuSection, no
// colored dots — personas have no color semantics and inventing three would
// read as meaningful when it isn't.
function PersonaMenuSection({
  personaId,
  onSelect,
}: {
  personaId: PersonaId;
  onSelect: (id: PersonaId) => void;
}) {
  return (
    <>
      <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Prototype persona
      </DropdownMenuLabel>
      {PERSONA_MENU_ORDER.map((id) => {
        const persona = PERSONAS[id];
        return (
          <DropdownMenuItem
            key={id}
            onClick={() => onSelect(id)}
            className="justify-between"
          >
            <span>
              {persona.name} · {persona.role}
            </span>
            {personaId === id && (
              <Check className="size-3.5 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}

function GuidedBuyingLayout() {
  const navigate = useNavigate();
  // Selector-scoped, not a bare useRouterState() destructure — this file's
  // own established pattern (see BuyFlow.tsx) to avoid re-rendering the
  // root layout on every router-internal state change, not just pathname.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Seeded from the entry route (see personaForPath) so a direct load onto
  // an approver/buyer surface doesn't show the requester's identity — see
  // that function's own comment for why this isn't a route-derived
  // override on every navigation, just the initial value.
  const [personaId, setPersonaId] = useState<PersonaId>(() =>
    personaForPath(pathname),
  );

  // Persona state is the single authority over the identity chip now — no
  // route-derived override past the initial value above.
  const persona = PERSONAS[personaId];
  const user = { name: persona.name, email: persona.chipSubtitle };
  // Same person, same avatar color everywhere they appear — the identity
  // chip is no longer tier-tinted, since tier isn't who this is.
  const personaAvatarColor = avatarColorFor(persona.name);
  const avatarClassName = cn(personaAvatarColor.bg, personaAvatarColor.fg);

  // The only context-preserving switch in scope: from a request's own detail
  // page, switching to the approver lands on that same request's decision
  // instead of a fresh queue — this is what replaces the deleted "Approver
  // view (demo)" affordance. Guarded on getDecisionDetail actually having
  // that id, so any request other than REQ-2052 falls back to the approver's
  // own queue rather than a "Decision request not found" dead end. The
  // buyer has no equivalent — there's no /workbench/$id to land on (see the
  // step 2 report) — so switching to Sam Rivera always goes to /workbench.
  const switchPersona = (target: PersonaId) => {
    if (target === personaId) return;

    if (target === "approver") {
      const requestId = pathname.match(/^\/requests\/([^/]+)$/)?.[1];
      if (requestId && getDecisionDetail(requestId)) {
        setPersonaId(target);
        void navigate({ to: "/decision/$id", params: { id: requestId } });
        return;
      }
    }

    setPersonaId(target);
    void navigate({ to: PERSONAS[target].homeRoute });
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
      navItems={persona.navItems}
      user={user}
      userMenuAdditionalItems={
        <>
          <PersonaMenuSection personaId={personaId} onSelect={switchPersona} />
          <TierMenuSection />
        </>
      }
      avatarClassName={avatarClassName}
    >
      {/* Clips the Buy↔Configure horizontal slide so it can't flash a scrollbar. */}
      <div className="relative h-full overflow-hidden">
        <Outlet />
      </div>
      {/* One Autopilot home — the orb FAB, same corner on every surface. */}
      <AutopilotFab />
      {/* One toast host for the whole prototype — top-center, per the
          in-product notification guidelines. */}
      <Toaster />
    </ApolloShell>
  );
}

const rootRoute = createRootRoute({ component: GuidedBuyingLayout });

// The prototype's front door is Home — bare /guided-buying redirects there,
// same landing behavior memory history used to get for free via
// initialEntries. beforeLoad (not a component redirect) so browser back
// from /home doesn't bounce forward through "/" again.
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/home" });
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => <EmptyPage title="Dashboard" />,
});

// The requester landing — not part of the Buy flow's phase machine (see
// Home.tsx's own doc comment), so it's a plain, unparameterized route.
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  component: Home,
});

// The catalog fork's two pre-Review phases (Details/Choose) are addressable
// via this search param — Bridge and Selection each get a real, reloadable
// URL (/buy?phase=bridge, /buy?phase=selection) without needing distinct
// routes of their own. Intake has none (the default, un-parameterized /buy).
// The other conversational forks (service/sourcing/offcatalog) aren't wired
// to the URL this pass — see the routing report.
const buyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/buy",
  validateSearch: (
    search: Record<string, unknown>,
  ): { phase?: "bridge" | "selection" } =>
    search.phase === "bridge" || search.phase === "selection"
      ? { phase: search.phase }
      : {},
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

// PO Record — purchase order detail, reachable from the request detail
// sidebar's Linked records chip.
const poRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/po/$id",
  component: PORecordPage,
});

// Decision Window — approver's view of a pending-approval request.
const decisionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/decision/$id",
  component: DecisionWindow,
});

// Approvals — the approver's own queue, mirroring My Requests' role for the
// requester. List rows read straight from DECISION_DETAILS.
const approvalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/approvals",
  component: Approvals,
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
  homeRoute,
  buyRoute,
  catalogRoute,
  configureRoute,
  workbenchRoute,
  requestsRoute,
  requestDetailRoute,
  poRoute,
  decisionRoute,
  approvalsRoute,
  reviewRoute,
  trackRoute,
]);

const queryClient = new QueryClient();

// A Coded App build serves from a sub-path (see next.config.mjs's basePath) —
// the router's basepath has to include that prefix too, or browser-history
// navigation would resolve against the wrong root. Plain deployments (this
// app's own Vercel preview) leave it unset, so basepath is just the mount path.
const codedAppPath = process.env.NEXT_PUBLIC_APOLLO_CODED_APP_PATH;
const routerBasepath = codedAppPath
  ? `/${codedAppPath}/guided-buying`
  : "/guided-buying";

export function GuidedBuyingShell() {
  const [router] = useState(() =>
    createRouter({
      routeTree,
      basepath: routerBasepath,
      // Real URLs: reloading or sharing a link to any route below resolves
      // through the Next catch-all (app/guided-buying/[[...slug]]) and this
      // router picks up wherever window.location already points.
      history: createBrowserHistory(),
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TierProvider>
        <CartProvider>
          <ConversationProvider>
            <AssistantThreadProvider>
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
            </AssistantThreadProvider>
          </ConversationProvider>
        </CartProvider>
      </TierProvider>
    </QueryClientProvider>
  );
}
