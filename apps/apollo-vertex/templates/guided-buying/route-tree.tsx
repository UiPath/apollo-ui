import { createRootRoute, createRoute, redirect } from "@tanstack/react-router";
import { Catalog } from "./catalog/Catalog";
import { BuyFlow } from "./catalog/v1/BuyFlow";
import { CatalogSubmitted } from "./catalog/v1/CatalogSubmitted";
import { ConfigureFlow } from "./catalog/v1/ConfigureFlow";
import { Review } from "./catalog/v1/Review";
import { CoeFindingDetail } from "./coe/CoeFindingDetail";
import { CoeQueue } from "./coe/CoeQueue";
import { GuidedBuyingLayout } from "./GuidedBuyingLayout";
import { HomeRoute } from "./home/HomeRoute";
import { IntakeFlow } from "./intake/IntakeFlow";
import { Outcomes } from "./outcomes/Outcomes";
import { Approvals } from "./requests/Approvals";
import { DecisionWindow } from "./requests/DecisionWindow";
import { MyRequests } from "./requests/MyRequests";
import { PORecordPage } from "./requests/PORecord";
import { RequestWindow } from "./requests/RequestWindow";
import { Workbench } from "./workbench/Workbench";

const rootRoute = createRootRoute({ component: GuidedBuyingLayout });

// Requester parity: any of Marcus's and Priya's shared nav paths (/home,
// /buy, /catalog, /requests) can carry ?as=priya, so personaForPath
// (personas.ts) can disambiguate a cold load on all of them, not just
// /home. One small helper merged into each route's own validateSearch,
// rather than the same ternary duplicated four times.
function personaSearch(search: Record<string, unknown>): { as?: "priya" } {
  return search.as === "priya" ? { as: "priya" } : {};
}

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

// The requester landing, shared by both requester personas (Marcus and
// Priya, requester parity) — not part of the Buy flow's phase machine (see
// Home.tsx's own doc comment). ?as=priya disambiguates a cold load between
// them, since both personas now share this same path (see personaForPath).
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  validateSearch: personaSearch,
  component: HomeRoute,
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
  ): { phase?: "bridge" | "selection"; as?: "priya" } => ({
    ...(search.phase === "bridge" || search.phase === "selection"
      ? { phase: search.phase }
      : {}),
    ...personaSearch(search),
  }),
  component: BuyFlow,
});

const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/catalog",
  validateSearch: personaSearch,
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

// Elena's procurement outcomes view (prompt 58).
const outcomesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/outcomes",
  component: Outcomes,
});

// Ravi's CoE queue (prompt 93), behind the <P2> gate at the persona
// switcher; the route itself is registered like any other so its home
// route type checks, the same way every P1 route already does.
const coeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/coe",
  component: CoeQueue,
});

// Ravi's finding detail (prompt 94), the same "$id" param and synchronous
// record lookup convention as decisionRoute below, not a router loader.
const coeFindingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/coe/$id",
  component: CoeFindingDetail,
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

// My Requests, the requester's durable queue of their own submitted requests.
const requestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/requests",
  validateSearch: personaSearch,
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
  outcomesRoute,
  coeRoute,
  coeFindingRoute,
  intakeRoute,
  requestsRoute,
  requestDetailRoute,
  poRoute,
  decisionRoute,
  approvalsRoute,
  reviewRoute,
  trackRoute,
]);
