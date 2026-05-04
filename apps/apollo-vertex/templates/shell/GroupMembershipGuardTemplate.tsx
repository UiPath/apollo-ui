"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";
import { Button } from "@/registry/button/button";
import { GroupMembershipGuard } from "@/registry/shell/group-membership-guard";
import {
  AuthContext,
  type AuthContextValue,
  type UserInfo,
} from "@/registry/shell/shell-auth-provider";

type DemoState = "loading" | "denied" | "granted";

const DEMO_OPTIONS = {
  baseUrl: "https://staging.uipath.com",
  orgName: "demo-org",
  orgId: "demo-org-id",
  groupIds: ["demo-group-admins", "demo-group-editors"],
};

const DEMO_USER: UserInfo = {
  name: "Alex Doe",
  email: "alex.doe@example.com",
  sub: "demo-user",
};

const QUERY_KEYS = DEMO_OPTIONS.groupIds.map((groupId) => [
  "identity",
  "group-members",
  DEMO_OPTIONS.baseUrl,
  DEMO_OPTIONS.orgName,
  DEMO_OPTIONS.orgId,
  groupId,
]);

const buildAuthContext = (state: DemoState): AuthContextValue => ({
  user: state === "loading" ? null : DEMO_USER,
  isAuthenticated: state !== "loading",
  isLoading: state === "loading",
  // oxlint-disable-next-line no-empty-function
  login: async () => {},
  // oxlint-disable-next-line no-empty-function
  logout: () => {},
  accessToken: state === "loading" ? null : "demo-access-token",
});

const buildQueryClient = (state: DemoState) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  if (state === "granted") {
    const [firstKey, ...restKeys] = QUERY_KEYS;
    client.setQueryData(firstKey, [
      { id: "1", name: "Alex Doe", email: DEMO_USER.email },
    ]);
    for (const key of restKeys) {
      client.setQueryData(key, []);
    }
  } else if (state === "denied") {
    for (const key of QUERY_KEYS) {
      client.setQueryData(key, []);
    }
  }
  return client;
};

function DemoProviders({
  state,
  children,
}: PropsWithChildren<{ state: DemoState }>) {
  const [queryClient] = useState(() => buildQueryClient(state));
  const [authContext] = useState(() => buildAuthContext(state));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authContext}>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export function GroupMembershipGuardTemplate() {
  const [state, setState] = useState<DemoState>("denied");

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-2 p-3 border-b border-border bg-muted/30">
        {(["loading", "denied", "granted"] as const).map((option) => (
          <Button
            key={option}
            size="sm"
            variant={state === option ? "default" : "outline"}
            onClick={() => setState(option)}
          >
            {option}
          </Button>
        ))}
      </div>
      <div className="flex-1 relative" key={state}>
        <DemoProviders state={state}>
          <GroupMembershipGuard {...DEMO_OPTIONS}>
            <div className="flex h-full items-center justify-center bg-background">
              <p className="text-muted-foreground">
                Your application content renders here.
              </p>
            </div>
          </GroupMembershipGuard>
        </DemoProviders>
      </div>
    </div>
  );
}
