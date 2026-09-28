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
import { createContext, useContext, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ApolloShell, type ShellNavItem } from "@/registry/shell/shell";
import { DetailPageExample } from "./DetailPageExample";

type ShellVariant = "sidebar" | "minimal";

const PREVIEW_PATH = "/preview/detail-page";

const navItems: ShellNavItem[] = [
  { path: `${PREVIEW_PATH}/home`, label: "dashboard", icon: Home },
  { path: PREVIEW_PATH, label: "projects", icon: FolderOpen },
  { path: `${PREVIEW_PATH}/analytics`, label: "analytics", icon: BarChart3 },
];

const ShellVariantContext = createContext<ShellVariant>("sidebar");

function PreviewShell() {
  const variant = useContext(ShellVariantContext);
  return (
    <ApolloShell
      companyName="UiPath"
      productName="Apollo Vertex"
      companyLogo={{
        url: "/UiPath.svg",
        darkUrl: "/UiPath_dark.svg",
        alt: "UiPath logo",
      }}
      {...(variant === "minimal" && { variant: "minimal" })}
      navItems={navItems}
    >
      <Outlet />
    </ApolloShell>
  );
}

// Every path renders the same page, so nav clicks stay on the preview.
const rootRoute = createRootRoute({ component: PreviewShell });
const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$",
  component: DetailPageExample,
});
const routeTree = rootRoute.addChildren([catchAllRoute]);

const queryClient = new QueryClient();

function createPreviewRouter() {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [PREVIEW_PATH] }),
  });
}

export function DetailPagePreview() {
  const [variant, setVariant] = useState<ShellVariant>("sidebar");
  const [router] = useState(createPreviewRouter);

  return (
    <QueryClientProvider client={queryClient}>
      <ShellVariantContext.Provider value={variant}>
        <RouterProvider router={router} />
      </ShellVariantContext.Provider>
      <div className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-lg border border-border bg-background p-1 shadow-md">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={variant}
          onValueChange={(value) => {
            if (value === "sidebar" || value === "minimal") setVariant(value);
          }}
          aria-label="Shell variant"
        >
          <ToggleGroupItem value="sidebar">Sidebar shell</ToggleGroupItem>
          <ToggleGroupItem value="minimal">Minimal shell</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </QueryClientProvider>
  );
}
