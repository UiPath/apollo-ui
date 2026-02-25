"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApolloShell } from "@/registry/shell/shell";

interface ShellTemplateProps {
  variant?: "minimal";
  children?: ReactNode;
  sidebarActions?: ReactNode;
}
const queryClient = new QueryClient();

export function ShellTemplate({ variant, children, sidebarActions }: ShellTemplateProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ApolloShell
        bypassAuth
        companyName="UiPath"
        productName="Apollo Vertex"
        variant={variant}
        sidebarActions={sidebarActions}
      >
        {children ?? <div />}
      </ApolloShell>
    </QueryClientProvider>
  );
}
