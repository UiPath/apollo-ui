"use client";

import { useQuery } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";
import { LogIn, LogOut } from "lucide-react";
import { type ReactNode, useCallback, useMemo } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { STORAGE_KEYS } from "@/lib/auth";
import { useAuth } from "@/registry/shell/shell-auth-provider";

export interface OrgTenantInfo {
  orgId: string;
  orgName: string;
  tenantId: string;
  tenantName: string;
}

const TenantsAndOrgSchema = z.object({
  organization: z.object({ id: z.string(), name: z.string() }),
  tenants: z.array(z.object({ id: z.string(), name: z.string() })),
});

const PrtIdSchema = z.object({ prt_id: z.string() });

async function fetchOrgTenant(
  orgId: string,
  accessToken: string,
): Promise<OrgTenantInfo> {
  const res = await fetch(
    `/_proxy/portal/${orgId}/filtering/leftnav/tenantsAndOrganizationInfo`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch org tenant info (${res.status})`);
  }

  const data = TenantsAndOrgSchema.safeParse(await res.json());
  if (!data.success) {
    throw new Error("Invalid org tenant response");
  }
  if (data.data.tenants.length === 0) {
    throw new Error("No tenants found for organization");
  }

  const { organization, tenants } = data.data;
  const firstTenant = tenants[0];
  return {
    orgId: organization.id,
    orgName: organization.name,
    tenantId: firstTenant.id,
    tenantName: firstTenant.name,
  };
}

function useOrgTenant(accessToken: string | null) {
  const orgId = useMemo(() => {
    if (!accessToken) return null;
    let decoded: unknown;
    try {
      decoded = jwtDecode(accessToken);
    } catch {
      return null;
    }
    const parsed = PrtIdSchema.safeParse(decoded);
    return parsed.success ? parsed.data.prt_id : null;
  }, [accessToken]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orgTenant", orgId],
    queryFn: () => {
      if (!orgId || !accessToken)
        throw new Error("Missing orgId or accessToken");
      return fetchOrgTenant(orgId, accessToken);
    },
    enabled: !!accessToken && !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  return { orgTenant: data ?? null, isLoading: isLoading && !!orgId, isError };
}

function SignOutButton(
  props: Omit<React.ComponentProps<typeof Button>, "onClick"> & {
    onSignOut: () => void;
  },
) {
  const { onSignOut, ...rest } = props;
  return (
    <Button
      className="cursor-pointer"
      variant="outline"
      onClick={onSignOut}
      {...rest}
    >
      <LogOut className="size-4 mr-2" />
      Sign out
    </Button>
  );
}

interface AiChatLoginGateProps {
  children: (props: {
    accessToken: string;
    orgTenant: OrgTenantInfo;
  }) => ReactNode;
}

export function AiChatLoginGate({ children }: AiChatLoginGateProps) {
  const { isAuthenticated, isLoading, login, logout, user, accessToken } =
    useAuth();
  const {
    orgTenant,
    isLoading: isOrgLoading,
    isError: isOrgError,
  } = useOrgTenant(accessToken);

  const handleLogout = useCallback(() => {
    const tokenDataStr = localStorage.getItem(STORAGE_KEYS.TOKEN);
    let idToken: string | null = null;
    if (tokenDataStr) {
      try {
        const parsed = JSON.parse(tokenDataStr) as { id_token?: unknown };
        if (typeof parsed.id_token === "string") {
          idToken = parsed.id_token;
        }
      } catch {
        idToken = null;
      }
    }

    sessionStorage.setItem(
      STORAGE_KEYS.LOGOUT_RETURN_TO,
      window.location.pathname,
    );
    logout();

    const endSessionUrl = new URL(
      "/identity_/connect/endsession",
      window.location.origin,
    );
    if (idToken) {
      endSessionUrl.searchParams.set("id_token_hint", idToken);
    }
    endSessionUrl.searchParams.set(
      "post_logout_redirect_uri",
      `${window.location.origin}/portal_/cloudrpa`,
    );
    window.location.href = endSessionUrl.toString();
  }, [logout]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px] text-muted-foreground">
        Signing in...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] gap-4 border rounded-lg bg-card">
        <p className="text-muted-foreground">
          Sign in to UiPath to use the AI Chat demo
        </p>
        <Button className="cursor-pointer" onClick={login}>
          <LogIn className="size-4 mr-2" />
          Sign in
        </Button>
      </div>
    );
  }

  if (isOrgError) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] gap-4 border rounded-lg bg-card">
        <p className="text-muted-foreground">
          We couldn&apos;t load your organization info. Please try signing out
          and signing back in.
        </p>
        <SignOutButton onSignOut={handleLogout} />
      </div>
    );
  }

  if (isOrgLoading || !accessToken) {
    return (
      <div className="flex items-center justify-center h-[500px] text-muted-foreground">
        Loading organization info...
      </div>
    );
  }

  if (!orgTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] gap-4 border rounded-lg bg-card">
        <p className="text-muted-foreground">
          Unable to resolve your organization. Please try signing out and
          signing back in.
        </p>
        <SignOutButton onSignOut={handleLogout} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-2">
        {user && (
          <span className="text-sm text-muted-foreground">
            {user.name} \ {orgTenant.orgName} \ {orgTenant.tenantName}
          </span>
        )}
        <SignOutButton onSignOut={handleLogout} size="sm" />
      </div>
      {children({ accessToken, orgTenant })}
    </div>
  );
}
