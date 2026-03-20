"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApolloShell } from "@/registry/shell/shell";

interface ShellTemplateProps {
  variant?: "minimal";
  children?: ReactNode;
  sidebarActions?: ReactNode;
  headerActions?: ReactNode;
  backgroundMode?: string;
}
const queryClient = new QueryClient();

export function ShellTemplate({
  variant,
  children,
  sidebarActions,
  headerActions,
  backgroundMode,
}: ShellTemplateProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ApolloShell
        bypassAuth
        companyName="UiPath"
        productName="Apollo Vertex"
        companyLogo={{
          url: "/UiPath.svg",
          darkUrl: "/UiPath_dark.svg",
          alt: "UiPath logo",
        }}
        variant={variant}
        sidebarActions={sidebarActions}
        headerActions={headerActions}
        backgroundMode={backgroundMode}
      >
        {children ?? <div />}
      </ApolloShell>
    </QueryClientProvider>
  );
}
