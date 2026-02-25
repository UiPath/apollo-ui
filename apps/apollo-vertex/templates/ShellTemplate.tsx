"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { ApolloShell } from "@/registry/shell/shell";

interface ShellTemplateProps {
  variant?: "minimal";
}
const queryClient = new QueryClient();
const baseUrl = typeof window === "undefined" ? "" : window.location.origin;

export function ShellTemplate({
  variant,
  children,
}: PropsWithChildren<ShellTemplateProps>) {
  return (
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
      >
        {children}
      </ApolloShell>
    </QueryClientProvider>
  );
}
