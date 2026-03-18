"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { BarChart3, FolderOpen, Home, Settings, Users } from "lucide-react";
import { useRouter as useNextRouter } from "next/navigation";
import type { PropsWithChildren } from "react";
import type { ShellNavItem } from "@/registry/shell/shell";
import { ApolloShell } from "@/registry/shell/shell";

interface ShellTemplateProps {
  variant?: "minimal";
}

const queryClient = new QueryClient();
const baseUrl = typeof window === "undefined" ? "" : window.location.origin;

const navItems: ShellNavItem[] = [
  { path: "/preview/shell/dashboard", label: "dashboard", icon: Home },
  { path: "/preview/shell/projects", label: "projects", icon: FolderOpen },
  { path: "/preview/shell/analytics", label: "analytics", icon: BarChart3 },
  { path: "/preview/shell/team", label: "team", icon: Users },
  { path: "/preview/shell/settings", label: "settings", icon: Settings },
];

const minimalNavItems: ShellNavItem[] = [
  { path: "/preview/shell-minimal", label: "dashboard", icon: Home },
  {
    path: "/preview/shell-minimal/projects",
    label: "projects",
    icon: FolderOpen,
  },
  {
    path: "/preview/shell-minimal/analytics",
    label: "analytics",
    icon: BarChart3,
  },
];

export function ShellTemplate({
  variant,
  children,
}: PropsWithChildren<ShellTemplateProps>) {
  const nextRouter = useNextRouter();

  const rootRoute = createRootRoute();
  const history = createMemoryHistory({
    initialEntries: [
      typeof window === "undefined" ? "/" : window.location.pathname,
    ],
  });
  const tanstackRouter = createRouter({ routeTree: rootRoute, history });

  tanstackRouter.subscribe("onBeforeNavigate", ({ toLocation }) => {
    nextRouter.push(toLocation.pathname);
  });

  return (
    <RouterContextProvider router={tanstackRouter}>
      <QueryClientProvider client={queryClient}>
        <ApolloShell
          companyName="UiPath"
          productName="Apollo Vertex"
          companyLogo={{
            url: "/UiPath.svg",
            darkUrl: "/UiPath_dark.svg",
            alt: "UiPath logo",
          }}
          variant={variant}
          clientId="e74e5981-cde0-4cd4-971c-6525cfba86b5"
          scope="openid profile email offline_access"
          baseUrl={baseUrl}
          navItems={variant === "minimal" ? minimalNavItems : navItems}
        >
          {children}
        </ApolloShell>
      </QueryClientProvider>
    </RouterContextProvider>
  );
}
