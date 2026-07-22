import { useCallback, useEffect, useRef, useState } from 'react';

import type { FolderSwitcherFolder } from './primitives/FolderSwitcher';
import type { DiscoveryModel } from './types';
import { normalizeDiscoveryModels } from './useDiscoveryModels';

/**
 * Auth + routing context for the picker's built-in platform calls
 * (folder list, BYO-management admin check) and for the default
 * navigation into the AI Trust Layer LLM-configurations pages. Mirrors
 * how the Automation Cloud portal reaches the same endpoints.
 */
/**
 * Bearer token, or a getter the picker calls fresh on every request. Prefer the
 * getter form in hosts whose access token rotates (portal-shell, silent-refresh
 * SPAs): a plain string is captured once when the (memoized) `requestContext` is
 * built, so it can go stale and make the picker's platform calls 401 — which
 * fails the BYO-admin check closed and hides the affordances.
 */
export type PlatformToken = string | (() => string | Promise<string>);

const resolveToken = async (token: PlatformToken): Promise<string> =>
  typeof token === 'function' ? token() : token;

export interface PlatformRequestContext {
  /** Bearer token (no `Bearer ` prefix), or a getter resolved per request. */
  token: PlatformToken;
  /**
   * Origin + organization path segment, e.g.
   * `https://cloud.uipath.com/acme`. The picker joins its platform
   * routes (`{tenantName}/orchestrator_/…`, `portal_/…`) directly onto
   * this value, so on Automation Cloud it **must include the org
   * path** — an empty value resolves absolute from the current origin
   * and drops the org prefix. Omit only for hosts whose platform
   * routes live at the origin root (e.g. dedicated instances on
   * vanity domains).
   */
  baseUrl?: string;
  /** Tenant name (path segment for Orchestrator routes). */
  tenantName: string;
  /**
   * Tenant GUID — route segment of the AI Trust Layer
   * LLM-configurations pages. Without it the default add/edit
   * affordances land on the configurations list instead of
   * deep-linking.
   */
  tenantId?: string;
  /**
   * Product/feature the picker is embedded in (the same pair the
   * Discovery request carries). Forwarded to the add-configuration
   * page as `?product=&feature=` so it can pre-populate the form.
   */
  requestingProduct?: string;
  requestingFeature?: string;
  /**
   * Current user id (the token's `sub` claim) — sent to Discovery as
   * `X-UiPath-LlmGateway-UserId`. Mandatory for products whose gateway
   * catalog is user-scoped (e.g. agents: omitting it is a 400/3010).
   * Required for the picker's built-in Discovery fetch.
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
  /** `'Personal'` marks a personal-workspace folder; `'Standard'` otherwise. */
  FolderType?: string;
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
 *
 * Personal-workspace folders (`FolderType === 'Personal'`) are always
 * excluded: a personal workspace is not a meaningful scope for shared
 * model configurations. The filter is a no-op on responses that don't
 * carry `FolderType`. Hosts that really need one can pass it via the
 * picker's `folders` prop.
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
      const bearer = await resolveToken(ctx.token);
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${bearer}`,
          Accept: 'application/json',
          // Some UiPath platform endpoints (e.g. portal_ APIs) reject requests
          // without a JSON Content-Type with 415, even on GET. Send it to match
          // how the platform's own clients call these routes.
          'Content-Type': 'application/json',
        },
        signal: ctrl.signal,
      });
      if (!res.ok) {
        throw new Error(`FoldersNavigation API ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as FoldersNavigationResponse;
      if (!ctrl.signal.aborted) {
        setFolders(
          (data.PageItems ?? [])
            .filter((f) => f.FolderType !== 'Personal')
            .map((f) => ({
              id: f.Key,
              label: f.DisplayName,
              numericId: f.Id,
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
 * Discovery catalog
 * ─────────────────────────────────────────────────────────────────── */

export interface UsePlatformDiscoveryModelsResult {
  /** `undefined` until the first successful fetch. */
  models: DiscoveryModel[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetches the model catalog from the LLM Gateway Discovery API:
 *
 *   GET {baseUrl}/{tenantName}/llmgateway_/api/discovery
 *   X-UiPath-LlmGateway-RequestingProduct / -RequestingFeature / -UserId
 *   X-UiPath-FolderKey (only when a folder is selected)
 *
 * This is the platform-route flavor of `useDiscoveryModels` (which
 * calls the gateway directly with internal headers): it reuses the
 * `requestContext` the picker already holds, so a product can drop the
 * picker in with no catalog fetching, folder refetching, or
 * loading/error plumbing of its own. Pass `null` to disable (the host
 * supplies `models` itself).
 */
export function usePlatformDiscoveryModels(
  ctx: PlatformRequestContext | null,
  folderKey: string | null
): UsePlatformDiscoveryModelsResult {
  const [models, setModels] = useState<DiscoveryModel[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchModels = useCallback(async () => {
    if (!ctx) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    const base = (ctx.baseUrl ?? '').replace(/\/$/, '');
    const url = `${base}/${ctx.tenantName}/llmgateway_/api/discovery`;

    try {
      const bearer = await resolveToken(ctx.token);
      const headers: Record<string, string> = {
        Authorization: `Bearer ${bearer}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      if (ctx.requestingProduct)
        headers['X-UiPath-LlmGateway-RequestingProduct'] = ctx.requestingProduct;
      if (ctx.requestingFeature)
        headers['X-UiPath-LlmGateway-RequestingFeature'] = ctx.requestingFeature;
      if (ctx.userId) headers['X-UiPath-LlmGateway-UserId'] = ctx.userId;
      if (folderKey) headers['X-UiPath-FolderKey'] = folderKey;

      const res = await fetch(url, { headers, signal: ctrl.signal });
      if (!res.ok) {
        throw new Error(`Discovery API ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as unknown;
      if (!ctrl.signal.aborted) {
        setModels(normalizeDiscoveryModels(Array.isArray(data) ? data : []));
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      if (!ctrl.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [ctx, folderKey]);

  useEffect(() => {
    if (!ctx) {
      abortRef.current?.abort();
      setModels(undefined);
      setLoading(false);
      setError(null);
      return undefined;
    }
    fetchModels();
    return () => abortRef.current?.abort();
  }, [ctx, fetchModels]);

  return { models, loading, error, refetch: fetchModels };
}

/* ──────────────────────────────────────────────────────────────────────
 * BYO connection names
 * ─────────────────────────────────────────────────────────────────── */

interface IntegrationServiceConnectionDto {
  id?: string;
  name?: string;
}

/** Discovery serves this when a config carries no parseable connection id. */
const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

/**
 * Resolves Integration Service connection display names for BYO models,
 * so hosts don't have to join them in from their own catalogs:
 *
 *   GET {baseUrl}/{tenantName}/connections_/api/v1/Connections/{connectionId}
 *   → { "id": …, "name": "My Azure OpenAI connection", … }
 *
 * One request per distinct `byomDetails.integrationServiceConnectionId`
 * among models that don't already carry a `byoConnectionLabel` (a
 * host-supplied label always wins). Results are cached for the
 * component's lifetime; failures (e.g. the user cannot read the
 * connection) resolve to no label — the row simply renders without a
 * caption. Pass `null` to disable.
 */
export function useByoConnectionNames(
  models: readonly {
    byoConnectionLabel?: string;
    byomDetails?: { integrationServiceConnectionId?: string } | null;
  }[],
  ctx: PlatformRequestContext | null
): ReadonlyMap<string, string> {
  const [names, setNames] = useState<ReadonlyMap<string, string>>(new Map());
  const requestedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!ctx) return undefined;

    const pending = [
      ...new Set(
        models
          .filter((m) => !m.byoConnectionLabel)
          .map((m) => m.byomDetails?.integrationServiceConnectionId)
          .filter((id): id is string => !!id && id !== EMPTY_GUID)
      ),
    ].filter((id) => !requestedRef.current.has(id));
    if (pending.length === 0) return undefined;

    pending.forEach((id) => requestedRef.current.add(id));
    const ctrl = new AbortController();
    const base = (ctx.baseUrl ?? '').replace(/\/$/, '');

    (async () => {
      const bearer = await resolveToken(ctx.token);
      const resolved = await Promise.all(
        pending.map(async (id): Promise<[string, string] | null> => {
          try {
            const res = await fetch(
              `${base}/${ctx.tenantName}/connections_/api/v1/Connections/${encodeURIComponent(id)}`,
              {
                headers: {
                  Authorization: `Bearer ${bearer}`,
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
                signal: ctrl.signal,
              }
            );
            if (!res.ok) return null;
            const data = (await res.json()) as IntegrationServiceConnectionDto;
            return data.name ? [id, data.name] : null;
          } catch {
            // Aborted runs may retry these ids later; real failures stay
            // cached as label-less rather than refetching on every render.
            if (ctrl.signal.aborted) requestedRef.current.delete(id);
            return null;
          }
        })
      );
      const found = resolved.filter((entry): entry is [string, string] => entry !== null);
      if (!ctrl.signal.aborted && found.length > 0) {
        setNames((prev) => new Map([...prev, ...found]));
      }
    })().catch(() => {
      // Token resolution failed: allow a later run to retry.
      pending.forEach((id) => requestedRef.current.delete(id));
    });

    return () => ctrl.abort();
  }, [ctx, models]);

  return names;
}

/* ──────────────────────────────────────────────────────────────────────
 * BYO management (organization admin)
 * ─────────────────────────────────────────────────────────────────── */

// Roles the Automation Cloud portal treats as organization admin (its
// `isOrgAdminSelector`): the same gate that protects the AI Trust
// Layer admin pages the picker's BYO affordances navigate to.
const ORG_ADMIN_ROLES = ['ACCOUNT_ADMIN', 'ACCOUNT_OWNER'];

interface UserOrganizationInfoResponse {
  accountRoleType?: string;
}

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
 * Checks whether the current user is an **organization administrator**
 * — the same signal the Automation Cloud portal uses to gate the AI
 * Trust Layer admin pages the picker's BYO affordances navigate to:
 *
 *   GET {baseUrl}/portal_/api/organization/UserOrganizationInfo
 *   → { "accountRoleType": "ACCOUNT_ADMIN" | "ACCOUNT_OWNER" | "TENANT_ADMIN" | "DEFAULT_USER", ... }
 *
 * Org admin ⇔ `accountRoleType` is `ACCOUNT_ADMIN` or `ACCOUNT_OWNER`.
 * This is a client-side affordance gate only — the LLM-configurations
 * pages and APIs enforce authorization server-side.
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

    // Reset the verdict for the new context: a previous context's
    // `true` must not keep admin affordances visible while this check
    // is in flight (fail closed during refetch, not only on error).
    setCanManage(undefined);
    setLoading(true);
    setError(null);

    const base = (ctx.baseUrl ?? '').replace(/\/$/, '');
    const url = `${base}/portal_/api/organization/UserOrganizationInfo`;

    resolveToken(ctx.token)
      .then((bearer) =>
        fetch(url, {
          headers: {
            Authorization: `Bearer ${bearer}`,
            Accept: 'application/json',
            // portal_ APIs 415 without a JSON Content-Type, even on GET.
            'Content-Type': 'application/json',
          },
          signal: ctrl.signal,
        })
      )
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`UserOrganizationInfo API ${res.status} ${res.statusText}`);
        }
        const data = (await res.json()) as UserOrganizationInfoResponse;
        if (!ctrl.signal.aborted) {
          setCanManage(ORG_ADMIN_ROLES.includes(data.accountRoleType ?? ''));
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

/* ──────────────────────────────────────────────────────────────────────
 * AI Trust Layer LLM-configurations links
 * ─────────────────────────────────────────────────────────────────── */

export interface LlmConfigurationsLinkOptions {
  /** `add` opens the create form, `edit` a configuration's edit form. */
  intent: 'add' | 'edit';
  /** Numeric Orchestrator folder id — route segment of the add/edit pages. */
  folderNumericId?: number;
  /** `ByoProductLlmConfiguration` id — required to deep-link `edit`. */
  configurationId?: string;
}

/**
 * Builds the portal URL for the AI Trust Layer LLM-configurations
 * surface. Route shapes from the portal app:
 *
 *   …/portal_/admin/ai-trust-layer/llm-configurations/:tenantId/:folderId/add?product=&feature=
 *   …/portal_/admin/ai-trust-layer/llm-configurations/:tenantId/:folderId/edit/:id
 *
 * Deep-linking needs the tenant GUID plus the numeric folder id (and,
 * for `edit`, the configuration id); when any piece is missing the URL
 * falls back to the configurations list, which reads the same values
 * from optional `?tenantId=&folderId=` query params.
 */
export function buildLlmConfigurationsUrl(
  ctx: PlatformRequestContext,
  options: LlmConfigurationsLinkOptions
): string {
  const base = (ctx.baseUrl ?? '').replace(/\/$/, '');
  const root = `${base}/portal_/admin/ai-trust-layer/llm-configurations`;
  const { intent, folderNumericId, configurationId } = options;

  if (ctx.tenantId && folderNumericId != null) {
    if (intent === 'edit' && configurationId) {
      return `${root}/${ctx.tenantId}/${folderNumericId}/edit/${encodeURIComponent(configurationId)}`;
    }
    if (intent === 'add') {
      const params = new URLSearchParams();
      if (ctx.requestingProduct) params.set('product', ctx.requestingProduct);
      if (ctx.requestingFeature) params.set('feature', ctx.requestingFeature);
      const qs = params.toString();
      return `${root}/${ctx.tenantId}/${folderNumericId}/add${qs ? `?${qs}` : ''}`;
    }
  }

  const params = new URLSearchParams();
  if (ctx.tenantId) params.set('tenantId', ctx.tenantId);
  if (folderNumericId != null) params.set('folderId', String(folderNumericId));
  const qs = params.toString();
  return `${root}${qs ? `?${qs}` : ''}`;
}

/**
 * Navigation seam for the picker's default add/edit affordances.
 * Indirected through this object so tests can spy without fighting
 * jsdom's unforgeable `window.location`.
 *
 * Always a new browser tab: the picker is embedded in a product
 * surface, and a same-tab navigation to the AI Trust Layer admin pages
 * would unload the user's in-progress work. The `noopener,noreferrer`
 * features are set for the usual security reasons (the opened page
 * can't reach back via `window.opener`).
 */
export const platformNavigation = {
  openInNewTab(url: string): void {
    globalThis.open?.(url, '_blank', 'noopener,noreferrer');
  },
};
