"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { ApolloShell } from "@/registry/shell/shell";

interface ShellTemplateWithAuthProps {
  variant?: "minimal";
}
const queryClient = new QueryClient();

const baseUrl = typeof window === "undefined" ? "" : window.location.origin;
export function ShellTemplateComponent({
  variant,
}: ShellTemplateWithAuthProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ApolloShell
        clientId="e74e5981-cde0-4cd4-971c-6525cfba86b5"
        scope="openid profile email offline_access"
        baseUrl={baseUrl}
        companyName="UiPath"
        productName="Apollo Vertex"
        variant={variant}
      >
        <div />
      </ApolloShell>
    </QueryClientProvider>
  );
}

export const ShellTemplate = dynamic(
  () => {
    return Promise.resolve(ShellTemplateComponent);
  },
  {
    ssr: false,
  },
);
