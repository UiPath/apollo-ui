"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { ApolloShell } from "@/registry/shell/shell";

interface ShellTemplateWithAuthProps {
  variant?: "minimal";
}
const queryClient = new QueryClient();

const baseUrl = "https://alpha.uipath.com";

const redirectUri =
  typeof window !== "undefined"
    ? `${window.location.origin}/vertex-components/shell`
    : "";

export function ShellTemplateComponent({
  variant,
}: ShellTemplateWithAuthProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ApolloShell
        tokenEndpoint={`${baseUrl}/identity_/connect/token`}
        redirectUri={redirectUri}
        clientId="e74e5981-cde0-4cd4-971c-6525cfba86b5"
        scope="openid profile email offline_access"
        authorizationEndpoint={`${baseUrl}/identity_/connect/authorize`}
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
