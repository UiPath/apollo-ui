"use client";

import {
  ApolloShell,
  AuthConfiguration,
  UserInfo,
} from "@/registry/shell/shell";
import { ShellLayout } from "@/registry/shell/shell-layout";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";

interface ShellTemplateProps {
  variant?: "minimal";
}

export function ShellTemplateWithAuth({ variant }: ShellTemplateProps) {
  const configuration: AuthConfiguration = {
    authority: "https://alpha.uipath.com/identity_",
    clientId: "e74e5981-cde0-4cd4-971c-6525cfba86b5",
    redirectUri: "http://localhost:3000/vertex-components/shell",
    postLogoutRedirectUri: "http://localhost:3000/vertex-components/shell",
    scope: "openid profile email offline_access",
  };
  return (
    <ApolloShell
      configuration={configuration}
      companyName="UiPath"
      variant={variant}
      productName="Apollo Vertex"
      onSigninCallback={(user: UserInfo | null) => {
        if (user) {
          console.log("user", user);
        }
      }}
    >
      <div />
    </ApolloShell>
  );
}
