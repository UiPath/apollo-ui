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
import { BarChart3, FolderOpen, Home } from "lucide-react";
import { createContext, type ReactNode, useContext, useState } from "react";
import { ApolloShell, type ShellNavItem } from "@/registry/shell/shell";

export type PreviewShellVariant = "sidebar" | "minimal";

interface PreviewShellProps {
  variant: PreviewShellVariant;
  /** Where the shell's nav items point. Every path shows the same page. */
  basePath: string;
  children: ReactNode;
}

const navItemsFor = (basePath: string): ShellNavItem[] => [
  { path: `${basePath}/home`, label: "dashboard", icon: Home },
  { path: basePath, label: "projects", icon: FolderOpen },
  { path: `${basePath}/analytics`, label: "analytics", icon: BarChart3 },
];

// The routes are defined once, so the shell and page reach them through context.
const PreviewShellContext = createContext<PreviewShellProps | null>(null);

function ShellRoute() {
  const props = useContext(PreviewShellContext);
  if (!props) return null;
  return (
    <ApolloShell
      companyName="UiPath"
      productName="Apollo Vertex"
      companyLogo={{
        url: "/UiPath.svg",
        darkUrl: "/UiPath_dark.svg",
        alt: "UiPath logo",
      }}
      {...(props.variant === "minimal" && { variant: "minimal" })}
      navItems={navItemsFor(props.basePath)}
    >
      <Outlet />
    </ApolloShell>
  );
}

function PageRoute() {
  return useContext(PreviewShellContext)?.children ?? null;
}

// Every path renders the same page, so nav clicks stay on the preview.
const rootRoute = createRootRoute({ component: ShellRoute });
const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$",
  component: PageRoute,
});
const routeTree = rootRoute.addChildren([catchAllRoute]);

const queryClient = new QueryClient();

/**
 * ApolloShell around a preview's page, on its own memory router, so a
 * preview can show a page inside the real shell without a route of its own.
 */
export function PreviewShell(props: PreviewShellProps) {
  const [router] = useState(() =>
    createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [props.basePath] }),
    }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <PreviewShellContext.Provider value={props}>
        <RouterProvider router={router} />
      </PreviewShellContext.Provider>
    </QueryClientProvider>
  );
}
