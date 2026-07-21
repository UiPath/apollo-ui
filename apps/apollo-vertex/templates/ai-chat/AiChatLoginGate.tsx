"use client";

import { useLocalStorage } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";
import { ChevronRight, LogIn, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { STORAGE_KEYS } from "@/lib/auth";
import { STALE_TIME_MS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/select/select";
import { useAuth } from "@/registry/shell/shell-auth-provider";
import {
  AICHAT_DIRECT_BASE_URL,
  AICHAT_IS_CODED_APP,
  AICHAT_STATIC_ORG,
  AICHAT_STORAGE_KEYS,
} from "./ai-chat-example-utils";

export interface OrgTenantInfo {
  orgId: string;
  orgName: string;
  tenantId: string;
  tenantName: string;
}

interface OrgInfo {
  orgId: string;
  orgName: string;
  tenants: { id: string; name: string }[];
}

const TenantsAndOrgSchema = z.object({
  organization: z.object({ id: z.string(), name: z.string() }),
  tenants: z.array(z.object({ id: z.string(), name: z.string() })),
});

const PrtIdSchema = z.object({ prt_id: z.string() });

async function fetchOrgInfo(
  orgId: string,
  accessToken: string,
): Promise<OrgInfo> {
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
  return {
    orgId: organization.id,
    orgName: organization.name,
    tenants,
  };
}

function getOrgIdFromToken(accessToken: string | null): string | null {
  if (!accessToken) return null;
  try {
    const decoded = jwtDecode(accessToken);
    const parsed = PrtIdSchema.safeParse(decoded);
    return parsed.success ? parsed.data.prt_id : null;
  } catch {
    return null;
  }
}

function useOrgInfo(accessToken: string | null) {
  const orgId = getOrgIdFromToken(accessToken);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orgInfo", orgId],
    queryFn: () => {
      if (!orgId || !accessToken)
        throw new Error("Missing orgId or accessToken");
      // Coded App builds cannot reach the portal proxy that lists tenants, so
      // the deployment's org/tenant is baked in at build time instead.
      if (AICHAT_STATIC_ORG) {
        return Promise.resolve({
          orgId,
          orgName: AICHAT_STATIC_ORG.orgName,
          tenants: AICHAT_STATIC_ORG.tenants,
        });
      }
      return fetchOrgInfo(orgId, accessToken);
    },
    enabled: !!accessToken && !!orgId,
    staleTime: STALE_TIME_MS,
  });

  return { orgInfo: data ?? null, isLoading: isLoading && !!orgId, isError };
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

function resolveOrgTenant(
  orgInfo: OrgInfo | null,
  selectedTenantId: string | null,
): OrgTenantInfo | null {
  if (!orgInfo) return null;
  const tenant =
    orgInfo.tenants.find((t) => t.id === selectedTenantId) ??
    orgInfo.tenants[0];
  return {
    orgId: orgInfo.orgId,
    orgName: orgInfo.orgName,
    tenantId: tenant.id,
    tenantName: tenant.name,
  };
}

export function AiChatLoginGate({ children }: AiChatLoginGateProps) {
  const { isAuthenticated, isLoading, login, logout, user, accessToken } =
    useAuth();
  const {
    orgInfo,
    isLoading: isOrgLoading,
    isError: isOrgError,
  } = useOrgInfo(accessToken);
  const [selectedTenantId, setSelectedTenantId] = useLocalStorage<
    string | null
  >({
    key: AICHAT_STORAGE_KEYS.TENANT_ID,
    defaultValue: null,
  });

  const orgTenant = resolveOrgTenant(orgInfo, selectedTenantId);

  function handleLogout() {
    const tokenDataStr = localStorage.getItem(STORAGE_KEYS.TOKEN);
    let idToken: string | null = null;
    if (tokenDataStr) {
      try {
        const parsed: unknown = JSON.parse(tokenDataStr);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          "id_token" in parsed &&
          typeof parsed.id_token === "string"
        ) {
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

    // Coded App builds reach identity on the baked platform host; dev reaches
    // it through the same-origin proxy.
    const identityOrigin = AICHAT_IS_CODED_APP
      ? AICHAT_DIRECT_BASE_URL
      : window.location.origin;
    const endSessionUrl = new URL(
      "/identity_/connect/endsession",
      identityOrigin,
    );
    if (idToken) {
      endSessionUrl.searchParams.set("id_token_hint", idToken);
    }
    endSessionUrl.searchParams.set(
      "post_logout_redirect_uri",
      `${identityOrigin}/portal_/cloudrpa`,
    );
    window.location.href = endSessionUrl.toString();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 min-h-0 text-muted-foreground">
        Signing in...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-0 gap-4 border rounded-lg bg-card">
        <p className="text-muted-foreground">
          Sign in to UiPath to use the AI Chat demo
        </p>
        <Button
          className="cursor-pointer"
          onClick={() => {
            void login();
          }}
        >
          <LogIn className="size-4 mr-2" />
          Sign in
        </Button>
      </div>
    );
  }

  if (isOrgError) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-0 gap-4 border rounded-lg bg-card">
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
      <div className="flex items-center justify-center flex-1 min-h-0 text-muted-foreground">
        Loading organization info...
      </div>
    );
  }

  if (!orgTenant || !orgInfo) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-0 gap-4 border rounded-lg bg-card">
        <p className="text-muted-foreground">
          Unable to resolve your organization. Please try signing out and
          signing back in.
        </p>
        <SignOutButton onSignOut={handleLogout} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 flex-1 min-h-0">
      <div className="flex items-center justify-end gap-2">
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          {user && (
            <>
              {user.name}
              <ChevronRight className="size-3" />
            </>
          )}
          org: {orgTenant.orgName}
          <ChevronRight className="size-3" />
          tenant:{" "}
        </span>
        {orgInfo.tenants.length > 1 ? (
          <Select
            value={orgTenant.tenantId}
            onValueChange={setSelectedTenantId}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {orgInfo.tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm text-muted-foreground">
            {orgTenant.tenantName}
          </span>
        )}
        <SignOutButton onSignOut={handleLogout} size="sm" />
      </div>
      {children({ accessToken, orgTenant })}
    </div>
  );
}
