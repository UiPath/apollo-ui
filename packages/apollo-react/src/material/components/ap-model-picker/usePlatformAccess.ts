import { useCallback, useEffect, useRef, useState } from 'react';

import type { FolderSwitcherFolder } from './primitives/FolderSwitcher';

/**
 * Auth + routing context for the picker's built-in platform calls
 * (folder list, BYO-management entitlement). Mirrors how the
 * Automation Cloud portal reaches the same endpoints.
 */
export interface PlatformRequestContext {
  /** Bearer token (no `Bearer ` prefix). */
  token: string;
  /**
   * Origin + organization path segment, e.g.
   * `https://cloud.uipath.com/acme`. Defaults to `''` (same-origin,
   * org-implicit) — correct for portal-hosted SPAs where the app is
   * already served under the org prefix.
   */
  baseUrl?: string;
  /** Tenant name (path segment for Orchestrator routes). */
  tenantName: string;
  /** Organization GUID — used by the entitlements (license) check. */
  organizationId: string;
  /**
   * Current user's global id. When provided, the entitlement check is
   * evaluated user-scoped (matches the Automation Cloud portal behavior).
   */
  userId?: string;
}

/* ──────────────────────────────────────────────────────────────────────
 * Folders
 * ─────────────────────────────────────────────────────────────────── */

/** Raw folder DTO from Orchestrator's FoldersNavigation API. */
interface OrchestratorFolderDto {
  Id: number;
  Key: string;
  DisplayName: string;
  FullyQualifiedName?: string;
}

interface FoldersNavigationResponse {
  Count: number;
  PageItems: OrchestratorFolderDto[];
}

export interface UseUserFoldersResult {
  /**
   * Folders mapped for the picker's switcher: `id` is the folder's
   * GUID `Key` — pass it straight through as `folderKey` on the
   * Discovery request when the selection changes.
   */
  folders: FolderSwitcherFolder[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Enough for the switcher's flat menu; catalogs with more folders than
// this should scope the picker to a folder upstream instead.
const FOLDERS_PAGE_SIZE = 100;

/**
 * Fetches the Orchestrator folders visible to the current user, the
 * same way the Automation Cloud portal does:
 *
 *   GET {baseUrl}/{tenantName}/orchestrator_/api/FoldersNavigation/GetFoldersForCurrentUser?take=100
 *   Authorization: Bearer <token>
 *
 * Response shape: `{ Count, PageItems }` where
 * each item carries `Id` / `Key` (GUID) / `DisplayName` /
 * `FullyQualifiedName`.
 *
 * Pass `null` to disable (e.g. `enableFolders` is off). Minimal
 * fetch-and-state — hosts on SWR/React Query can fetch themselves and
 * pass the `folders` prop instead.
 */
export function useUserFolders(ctx: PlatformRequestContext | null): UseUserFoldersResult {
  const [folders, setFolders] = useState<FolderSwitcherFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchFolders = useCallback(async () => {
    if (!ctx) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    const base = (ctx.baseUrl ?? '').replace(/\/$/, '');
    const url =
      `${base}/${ctx.tenantName}/orchestrator_/api/FoldersNavigation/` +
      `GetFoldersForCurrentUser?take=${FOLDERS_PAGE_SIZE}`;

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${ctx.token}`,
          Accept: 'application/json',
        },
        signal: ctrl.signal,
      });
      if (!res.ok) {
        throw new Error(`FoldersNavigation API ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as FoldersNavigationResponse;
      if (!ctrl.signal.aborted) {
        setFolders(
          (data.PageItems ?? []).map((f) => ({
            id: f.Key,
            label: f.DisplayName,
          }))
        );
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      if (!ctrl.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [ctx]);

  useEffect(() => {
    if (!ctx) {
      // Disabled: abort anything in flight and clear previous results so
      // a stale list / spinner doesn't linger after toggling off.
      abortRef.current?.abort();
      setFolders([]);
      setLoading(false);
      setError(null);
      return undefined;
    }
    fetchFolders();
    return () => abortRef.current?.abort();
  }, [ctx, fetchFolders]);

  return { folders, loading, error, refetch: fetchFolders };
}

/* ──────────────────────────────────────────────────────────────────────
 * BYO management entitlement
 * ─────────────────────────────────────────────────────────────────── */

// License entitlement that gates BYO LLM model management in the
// Automation Cloud portal (AI Trust Layer → LLM configurations tab).
const BYO_LLM_ENTITLEMENT = 'AiTrustLayerByoLlm';

export interface UseCanManageByoResult {
  /**
   * `undefined` while loading or when the check is disabled; boolean
   * once resolved. The picker treats `undefined` as `false` (no admin
   * affordances) so nothing flashes for non-admins.
   */
  canManage: boolean | undefined;
  loading: boolean;
  error: Error | null;
}

/**
 * Checks whether the current user's org (user-scoped when `userId` is
 * provided) holds the `AiTrustLayerByoLlm` entitlement — the same
 * signal the Automation Cloud portal uses to show BYO LLM management:
 *
 *   POST {baseUrl}/lease_/api/entitlements/{organizationId}/entitled?userId={userId}
 *   body: { "EntitlementNames": ["AiTrustLayerByoLlm"] }
 *   → { "isEntitled": { "AiTrustLayerByoLlm": true } }
 *
 * Note the portal additionally gates the page
 * behind org/tenant-admin routes — hosts embedding the picker outside
 * an admin surface should pass `canManageByo` explicitly if they need
 * stricter gating than the entitlement alone.
 *
 * Pass `null` to disable (the `canManageByo` prop override is set, or
 * no request context is available).
 */
export function useCanManageByo(ctx: PlatformRequestContext | null): UseCanManageByoResult {
  const [canManage, setCanManage] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!ctx) {
      // Disabled (explicit `canManageByo` override or no request
      // context): clear every piece of state, not just the verdict.
      abortRef.current?.abort();
      setCanManage(undefined);
      setLoading(false);
      setError(null);
      return undefined;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    const base = (ctx.baseUrl ?? '').replace(/\/$/, '');
    const qs = ctx.userId ? `?userId=${encodeURIComponent(ctx.userId)}` : '';
    const url = `${base}/lease_/api/entitlements/${ctx.organizationId}/entitled${qs}`;

    fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ctx.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ EntitlementNames: [BYO_LLM_ENTITLEMENT] }),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Entitlements API ${res.status} ${res.statusText}`);
        }
        const data = (await res.json()) as {
          isEntitled?: Record<string, boolean>;
        };
        if (!ctrl.signal.aborted) {
          setCanManage(data.isEntitled?.[BYO_LLM_ENTITLEMENT] === true);
        }
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name === 'AbortError') return;
        if (!ctrl.signal.aborted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          // Fail closed: an errored permission check must never grant
          // admin affordances.
          setCanManage(false);
        }
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [ctx]);

  return { canManage, loading, error };
}
