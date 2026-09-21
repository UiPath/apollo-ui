import { useCallback, useEffect, useRef, useState } from 'react';

import type { DiscoveryModel, DiscoveryRequestContext } from './types';

export interface UseDiscoveryModelsResult {
  models: DiscoveryModel[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Calls `GET /api/discovery` on the LLM Gateway. The endpoint is
 * `[Authorize(Policies.S2S)]` in the gateway today; some hosts proxy it
 * behind their own user-token route — pass `baseUrl` to point there.
 *
 * The hook is intentionally minimal (fetch + state). Hosts that already
 * use SWR/React Query should skip this and feed the picker via the
 * `models` prop directly.
 */
export function useDiscoveryModels(ctx: DiscoveryRequestContext | null): UseDiscoveryModelsResult {
  const [models, setModels] = useState<DiscoveryModel[]>([]);
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
    const params = new URLSearchParams();
    if (ctx.onlyAvailableModels === false) {
      params.set('onlyAvailableModels', 'false');
    }
    const qs = params.toString();
    const url = `${base}/api/discovery${qs ? `?${qs}` : ''}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${ctx.token}`,
      Accept: 'application/json',
      'X-UiPath-Internal-AccountId': ctx.accountId,
      'X-UiPath-Internal-TenantId': ctx.tenantId,
      'X-UiPath-LlmGateway-RequestingProduct': ctx.requestingProduct,
      'X-UiPath-LlmGateway-RequestingFeature': ctx.requestingFeature,
    };
    if (ctx.operationCode) {
      headers['X-UiPath-LlmGateway-OperationCode'] = ctx.operationCode;
    }
    if (ctx.folderKey) {
      headers['X-UiPath-FolderKey'] = ctx.folderKey;
    }
    if (ctx.fromDedicatedCloud) {
      headers['X-UiPath-LlmGateway-FromDedicatedCloud'] = 'true';
    }

    try {
      const res = await fetch(url, { headers, signal: ctrl.signal });
      if (!res.ok) {
        throw new Error(`Discovery API ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as { models?: DiscoveryModel[] } | DiscoveryModel[];
      const list = Array.isArray(data) ? data : (data.models ?? []);
      if (!ctrl.signal.aborted) {
        setModels(normalizeDiscoveryModels(list));
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
      // consumers don't keep rendering stale data / a stuck spinner.
      abortRef.current?.abort();
      setModels([]);
      setLoading(false);
      setError(null);
      return undefined;
    }
    fetchModels();
    return () => abortRef.current?.abort();
  }, [ctx, fetchModels]);

  return { models, loading, error, refetch: fetchModels };
}

/**
 * The gateway emits PascalCase property names by default but the
 * Newtonsoft serializer in some product instances is configured for
 * camelCase. Normalize recursively so consumers can rely on camelCase
 * regardless — nested DTOs (`ModelDetails.CostDetails`,
 * `DeprecationDetails`, `RoutingDetails`, …) carry the fields the
 * picker's chips and grouping read.
 */
function camelizeDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelizeDeep);
  if (!value || typeof value !== 'object') return value;
  // Null prototype: hostile keys in the payload (`__proto__`,
  // `constructor`) become plain data instead of touching the object's
  // prototype chain. `customFieldMappings` carries user-authored keys.
  const camel: Record<string, unknown> = Object.create(null);
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    camel[k.charAt(0).toLowerCase() + k.slice(1)] = camelizeDeep(v);
  }
  return camel;
}

export function normalizeDiscoveryModels(list: unknown[]): DiscoveryModel[] {
  return list.map((raw) => camelizeDeep(raw) as DiscoveryModel);
}
