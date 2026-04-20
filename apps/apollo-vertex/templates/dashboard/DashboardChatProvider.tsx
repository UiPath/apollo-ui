"use client";

import { useQuery } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";
import { createContext, type ReactNode, useContext } from "react";
import { z } from "zod";
import { useAuth } from "@/registry/shell/shell-auth-provider";
import type { OrgTenantInfo } from "@/templates/ai-chat/AiChatLoginGate";

const PrtIdSchema = z.object({ prt_id: z.string() });

const TenantsAndOrgSchema = z.object({
  organization: z.object({ id: z.string(), name: z.string() }),
  tenants: z.array(z.object({ id: z.string(), name: z.string() })),
});

function getOrgIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const parsed = PrtIdSchema.safeParse(jwtDecode(token));
    return parsed.success ? parsed.data.prt_id : null;
  } catch {
    return null;
  }
}

async function fetchOrgTenant(
  orgId: string,
  accessToken: string,
): Promise<OrgTenantInfo> {
  const res = await fetch(
    `/_proxy/portal/${orgId}/filtering/leftnav/tenantsAndOrganizationInfo`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`Failed to fetch org info (${res.status})`);

  const data = TenantsAndOrgSchema.safeParse(await res.json());
  if (!data.success || data.data.tenants.length === 0)
    throw new Error("Invalid org response");

  const { organization, tenants } = data.data;
  return {
    orgId: organization.id,
    orgName: organization.name,
    tenantId: tenants[0].id,
    tenantName: tenants[0].name,
  };
}

export interface DashboardChatContextValue {
  accessToken: string | null;
  orgTenant: OrgTenantInfo | null;
  isLoading: boolean;
  login: () => void;
  demo: boolean;
}

const DashboardChatContext = createContext<DashboardChatContextValue>({
  accessToken: null,
  orgTenant: null,
  isLoading: false,
  login: () => {},
  demo: false,
});

export function useDashboardChat() {
  return useContext(DashboardChatContext);
}

export function DashboardChatProvider({
  children,
  demo = false,
}: {
  children: ReactNode;
  demo?: boolean;
}) {
  // Demo mode: bypass auth entirely — autopilot uses a mock connection
  if (demo) {
    return (
      <DashboardChatContext.Provider
        value={{ accessToken: null, orgTenant: null, isLoading: false, login: () => {}, demo: true }}
      >
        {children}
      </DashboardChatContext.Provider>
    );
  }

  return <DashboardChatProviderInner>{children}</DashboardChatProviderInner>;
}

function DashboardChatProviderInner({ children }: { children: ReactNode }) {
  const {
    isAuthenticated,
    isLoading: authLoading,
    login,
    accessToken,
  } = useAuth();

  const orgId = getOrgIdFromToken(accessToken ?? null);

  const { data: orgTenant, isLoading: orgLoading } = useQuery({
    queryKey: ["dashboard-org-tenant", orgId],
    queryFn: () => fetchOrgTenant(orgId!, accessToken!),
    enabled: !!accessToken && !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <DashboardChatContext.Provider
      value={{
        accessToken: accessToken ?? null,
        orgTenant: orgTenant ?? null,
        isLoading: authLoading || (isAuthenticated && orgLoading),
        login: () => {
          void login();
        },
        demo: false,
      }}
    >
      {children}
    </DashboardChatContext.Provider>
  );
}
