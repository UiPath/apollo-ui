"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { ShellAuthProvider } from "@/registry/shell/shell-auth-provider";
import {
  AICHAT_CLIENT_ID,
  AICHAT_SCOPE,
} from "@/templates/ai-chat/ai-chat-example-utils";
import { DashboardChatProvider } from "./DashboardChatProvider";
import { DashboardDataSeedProvider } from "./DashboardDataProvider";
import {
  dashboardCatchAllRoute,
  dashboardHomeRoute,
  dashboardIndexRoute,
  dashboardMinimalCatchAllRoute,
  dashboardMinimalIndexRoute,
  dashboardMinimalShellRoute,
  dashboardRootRoute,
  dashboardShellRoute,
} from "./DashboardRoutes";
import type { DashboardDataset } from "./dashboard-data";

class DashboardErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null; componentStack: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null, componentStack: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { error, componentStack: "" };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      "[DashboardErrorBoundary] caught:",
      error.message,
      info.componentStack,
    );
    this.setState({ error, componentStack: info.componentStack ?? "" });
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            fontFamily: "monospace",
            fontSize: 12,
            color: "red",
            background: "#fff",
            overflow: "auto",
            height: "100%",
          }}
        >
          <strong>DashboardTemplate Error</strong>
          <p>{this.state.error.message}</p>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 12, color: "#333" }}>
            {this.state.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export interface DashboardTemplateProps {
  shellVariant?: "minimal";
  dataset?: DashboardDataset;
  /** Skip auth requirements — for product demos and standalone previews */
  demoMode?: boolean;
}

const DASHBOARD_PREVIEW_PATH_KEY = "dashboard-preview-path";
const DASHBOARD_MINIMAL_PREVIEW_PATH_KEY = "dashboard-minimal-preview-path";

type DashboardPreviewPathKey =
  | typeof DASHBOARD_PREVIEW_PATH_KEY
  | typeof DASHBOARD_MINIMAL_PREVIEW_PATH_KEY;

const queryClient = new QueryClient();

const routeTree = dashboardRootRoute.addChildren([
  dashboardShellRoute.addChildren([
    dashboardIndexRoute,
    dashboardHomeRoute,
    dashboardCatchAllRoute,
  ]),
  dashboardMinimalShellRoute.addChildren([
    dashboardMinimalIndexRoute,
    dashboardMinimalCatchAllRoute,
  ]),
]);

function getInitialEntry(
  storageKey: DashboardPreviewPathKey,
  variant?: "minimal",
) {
  const stored = localStorage.getItem(storageKey);
  if (stored) return stored;
  return variant === "minimal"
    ? "/preview/dashboard-minimal"
    : "/preview/dashboard";
}

function createDashboardRouter(
  storageKey: DashboardPreviewPathKey,
  variant?: "minimal",
) {
  const history = createMemoryHistory({
    initialEntries: [getInitialEntry(storageKey, variant)],
  });
  return createRouter({ routeTree, history });
}

export function DashboardTemplate({
  shellVariant,
  dataset,
  demoMode = false,
}: DashboardTemplateProps) {
  // Diagnostic: check for undefined components
  if (process.env.NODE_ENV === "development") {
    const checks = {
      QueryClientProvider,
      ShellAuthProvider,
      DashboardChatProvider,
      RouterProvider,
      DashboardDataSeedProvider,
    };
    for (const [name, comp] of Object.entries(checks)) {
      if (!comp) console.error(`[DashboardTemplate] ${name} is undefined!`);
    }
  }

  const storageKey =
    shellVariant === "minimal"
      ? DASHBOARD_MINIMAL_PREVIEW_PATH_KEY
      : DASHBOARD_PREVIEW_PATH_KEY;
  const [router] = useState(() =>
    createDashboardRouter(storageKey, shellVariant),
  );

  useEffect(() => {
    const unsubscribe = router.subscribe("onResolved", ({ toLocation }) => {
      localStorage.setItem(storageKey, toLocation.pathname);
    });
    return unsubscribe;
  }, [router, storageKey]);

  // In demo mode: skip ShellAuthProvider so authContext is null in ApolloShellContent,
  // bypassing the login gate. DashboardChatProvider uses its own demo mock for autopilot.
  const content = demoMode ? (
    <QueryClientProvider client={queryClient}>
      <DashboardChatProvider demo>
        <RouterProvider router={router} />
      </DashboardChatProvider>
    </QueryClientProvider>
  ) : (
    <QueryClientProvider client={queryClient}>
      <ShellAuthProvider
        clientId={AICHAT_CLIENT_ID}
        scope={AICHAT_SCOPE}
        baseUrl=""
        redirectPath="/auth_callback"
      >
        <DashboardChatProvider>
          <RouterProvider router={router} />
        </DashboardChatProvider>
      </ShellAuthProvider>
    </QueryClientProvider>
  );

  if (dataset) {
    return (
      <DashboardErrorBoundary>
        <DashboardDataSeedProvider dataset={dataset}>
          {content}
        </DashboardDataSeedProvider>
      </DashboardErrorBoundary>
    );
  }

  return <DashboardErrorBoundary>{content}</DashboardErrorBoundary>;
}
