import { createRootRoute, createRoute, redirect } from "@tanstack/react-router";
import { Catalog } from "./catalog/Catalog";
import { BuyFlow } from "./catalog/v1/BuyFlow";
import { CatalogSubmitted } from "./catalog/v1/CatalogSubmitted";
import { ConfigureFlow } from "./catalog/v1/ConfigureFlow";
import { Review } from "./catalog/v1/Review";
import { GuidedBuyingLayout } from "./GuidedBuyingLayout";
import { Home } from "./home/Home";
import { IntakeFlow } from "./intake/IntakeFlow";
import { PriyaHome } from "./intake/PriyaHome";
import { Approvals } from "./requests/Approvals";
import { DecisionWindow } from "./requests/DecisionWindow";
import { MyRequests } from "./requests/MyRequests";
import { PORecordPage } from "./requests/PORecord";
import { RequestWindow } from "./requests/RequestWindow";
import { Workbench } from "./workbench/Workbench";

const rootRoute = createRootRoute({ component: GuidedBuyingLayout });

// The prototype's front door is Home, bare /guided-buying redirects there,
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
  component: () => (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
    </div>
  ),
});

// The requester landing, not part of the Buy flow's phase machine (see
// Home.tsx's own doc comment), so it's a plain, unparameterized route.
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  component: Home,
});

// The catalog fork's two pre-Review phases (Details/Choose) are addressable
// via this search param, Bridge and Selection each get a real, reloadable
// URL (/buy?phase=bridge, /buy?phase=selection) without needing distinct
// routes of their own. Intake has none (the default, un-parameterized /buy).
// The other conversational forks (service/sourcing/offcatalog) aren't wired
// to the URL this pass, see the routing report.
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

// Configure with agent (off-catalog contract path, launched from the Buy chip).
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

// J3 intake, Priya's own surface. Same convention as /buy: bare renders the
// composer, the flow phases are addressable via ?phase=..., matching
// Marcus's own /buy?phase=bridge / ?phase=selection.
const intakeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/intake",
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    phase?:
      | "details"
      | "vendor"
      | "data-info"
      | "general-info"
      | "review"
      | "done";
  } =>
    search.phase === "details" ||
    search.phase === "vendor" ||
    search.phase === "data-info" ||
    search.phase === "general-info" ||
    search.phase === "review" ||
    search.phase === "done"
      ? { phase: search.phase }
      : {},
  component: IntakeFlow,
});

// Priya's own landing, distinct from Marcus's /home for the same reason
// every other persona already has its own homeRoute (/requests, /workbench,
// /approvals all differ too). Named for what it is (a starting point), not
// for her, since it shows up in the address bar during demos.
const startRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/start",
  component: PriyaHome,
});

// My Requests, the requester's durable queue of their own submitted requests.
const requestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/requests",
  component: MyRequests,
});

// Request Window, full-page detail for a single request.
const requestDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/requests/$id",
  component: RequestWindow,
});

// PO Record, purchase order detail, reachable from the request detail
// sidebar's Linked records chip.
const poRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/po/$id",
  component: PORecordPage,
});

// Decision Window, approver's view of a pending-approval request.
const decisionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/decision/$id",
  component: DecisionWindow,
});

// Approvals, the approver's own queue, mirroring My Requests' role for the
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

// Submit destination, the catalog request "submitted" finish line.
const trackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/track",
  component: CatalogSubmitted,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  homeRoute,
  buyRoute,
  catalogRoute,
  configureRoute,
  workbenchRoute,
  intakeRoute,
  startRoute,
  requestsRoute,
  requestDetailRoute,
  poRoute,
  decisionRoute,
  approvalsRoute,
  reviewRoute,
  trackRoute,
]);
