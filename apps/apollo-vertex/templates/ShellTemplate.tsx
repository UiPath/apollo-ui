"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApolloShell } from "@/registry/shell/shell";

interface ShellTemplateWithAuthProps {
  variant?: "minimal";
}
const queryClient = new QueryClient();


export function ShellTemplate({ variant }: ShellTemplateWithAuthProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ApolloShell
        bypassAuth
        companyName="UiPath"
        productName="Apollo Vertex"
        variant={variant}
      >
        <div />
      </ApolloShell>
    </QueryClientProvider>
  );
}
