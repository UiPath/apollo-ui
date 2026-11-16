import type {
  ByoAddedModel,
  ByoConnection,
  ByoConnectionForm,
  ByoDialogContext,
  ByoFailure,
  ByoFolder,
  ByoFormField,
  ByoModelDialogApi,
  ByoProviderModel,
  ByoResult,
} from '@uipath/apollo-wind';

import { buildGatewayUrl, type PlatformRequestContext, resolveToken } from './usePlatformAccess';

/**
 * The Community "Use your own model" dialog's calls, made with the picker's
 * `requestContext`.
 *
 * Connect creates the Integration Service connection without the hosted IS
 * page, by making the calls that page makes:
 *   1. `POST connections_/api/v1/Connections` opens a provisioning session.
 *   2. `GET elements_/…/applications/sessions/{id}` reads the session's form.
 *   3. `POST elements_/…/normalized-instances/authenticate` submits the
 *      credentials; IS checks them against the vendor and answers at once.
 *   4. `GET connections_/api/v1/Sessions/{id}` until the connection exists.
 *   5. `PATCH Connections/{id}/rename` names it.
 * The form is read from the connector definition
 * (`elements_/v3/element/elements/{key}`), with the session form as fallback.
 * Steps 2, 3 and the definition are Udon routes IS has not published; see
 * Confluence "BYOM for DLG: creating connections inline" (LLM-4518).
 *
 * Test and add runs the gateway's `llm-configurations/validate`, then saves
 * the configuration with `POST llm-configurations`.
 */

export interface CommunityByoProvider {
  id: string;
  name: string;
  /** Integration Service connector key. */
  connector: string;
  /** The gateway's `connectorType`. */
  connectorType: string;
  /** The design's wording over IS's field labels, keyed by IS field key. */
  overlay?: Record<
    string,
    { label?: string; placeholder?: string; hint?: string; primary?: boolean }
  >;
  authLabels?: Record<string, string>;
  /** Values the gateway needs that the form never asks for, worked out from the others. */
  derive?: (values: Record<string, string>) => Record<string, string>;
}

export const COMMUNITY_BYO_PROVIDERS: readonly CommunityByoProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    connector: 'uipath-openai-openai',
    connectorType: 'OpenAi',
    overlay: { Authorization: { placeholder: 'sk-…' } },
  },
  {
    id: 'azure-openai',
    name: 'Azure OpenAI',
    connector: 'uipath-microsoft-azureopenai',
    connectorType: 'AzureOpenAi',
    overlay: {
      url: { label: 'Endpoint', placeholder: 'https://<resource>.openai.azure.com', primary: true },
    },
    authLabels: {
      customApiKey: 'API key',
      oauth2ClientCredentials: 'Client credentials (Entra app)',
    },
    // IS connects without `subdomain`, but the gateway's Azure client builds
    // https://{subdomain}.openai.azure.com/ from it alone.
    derive: (values): Record<string, string> => {
      try {
        const subdomain = values.url ? new URL(values.url).hostname.split('.')[0] : undefined;
        return subdomain ? { subdomain } : {};
      } catch {
        return {};
      }
    },
  },
  {
    id: 'bedrock',
    name: 'Amazon Bedrock',
    connector: 'uipath-aws-bedrock',
    connectorType: 'AwsBedrock',
    overlay: { 'aws.region': { label: 'Region' } },
  },
  {
    id: 'vertex',
    name: 'Google Vertex',
    connector: 'uipath-google-vertex',
    connectorType: 'GoogleVertex',
    overlay: { region: { label: 'Location' } },
  },
  {
    id: 'nvidia-nim',
    name: 'Nvidia NIM',
    connector: 'uipath-nvidia-nim',
    connectorType: 'NvidiaNim',
    overlay: { url: { label: 'Base URL' }, apikey: { label: 'API key' } },
  },
  {
    id: 'openai-compatible',
    name: 'OpenAI-compatible',
    connector: 'uipath-openai-openaiv1compliant',
    connectorType: 'OpenAiV1Compatible',
    // The connector appends /v1 itself.
    overlay: {
      url: { label: 'Base URL', placeholder: 'https://api.example.com', primary: true },
      apikey: { label: 'API key' },
    },
  },
];

export interface CommunityByoApiOptions {
  /** Names already in the user's model list. */
  takenModelNames: () => string[];
  /** BYO operation group the configuration is saved under; defaults to `{product}-{feature}`. */
  operationGroupName?: string;
  providers?: readonly CommunityByoProvider[];
  /** How long Test and add keeps retrying while a new connection is not yet visible to the gateway. */
  newConnectionGraceMs?: number;
  /** Test seam. */
  sleep?: (ms: number) => Promise<void>;
}

interface CallResult {
  ok: boolean;
  status: number;
  statusText: string;
  data: unknown;
}

interface IsConfigEntry {
  key: string;
  name?: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | null;
  hintText?: string;
  displayOrder?: number;
  configScreenType?: string;
  hideFromConsole?: boolean;
  groupBy?: string;
  options?: { value: string; displayValue?: string; description?: string }[];
}

interface IsSession {
  id: string;
  connector: string;
  folderKey: string;
  expiresAt: number;
}

const SHOWN_SCREENS = new Set(['pre', 'pre-optional']);
const NOT_CHAT: [RegExp, string][] = [
  [/embed|rerank/, 'Embedding model'],
  [/moderation/, 'Moderation model'],
  [/tts|whisper|transcribe|audio/, 'Audio model'],
  [/realtime/, 'Realtime model'],
  [/image|sora|imagen|stability\./, 'Image or video model'],
  [/davinci|babbage/, 'Completions only'],
];
const NEW_CONNECTION_NOT_FOUND = 'IntegrationServiceConfigurationNotFound';
const SESSION_POLLS = 20;
const SESSION_POLL_MS = 1500;
const RETRY_MS = 5000;

const asList = (data: unknown): Record<string, unknown>[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const d = data as { value?: unknown; PageItems?: unknown };
    if (Array.isArray(d.value)) return d.value;
    if (Array.isArray(d.PageItems)) return d.PageItems;
  }
  return [];
};

const plainText = (html?: string) =>
  html
    ? html
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim()
    : '';

const failure = (result: CallResult, title: string): ByoFailure => {
  const d =
    result.data && typeof result.data === 'object'
      ? (result.data as Record<string, unknown>)
      : { message: String(result.data ?? '') };
  const providerMessage = typeof d.providerMessage === 'string' ? d.providerMessage : '';
  // IS prefixes the vendor's text with the probe call, "GET /openai/models|400|…".
  const message =
    providerMessage.replace(/^[A-Z]+ \S+\|\d+\|/, '') ||
    (typeof d.message === 'string' ? d.message : '') ||
    (typeof d.Message === 'string' ? d.Message : '');
  return {
    title: result.status ? `${title} (HTTP ${result.status})` : title,
    message: message || undefined,
    detail: JSON.stringify(result.data, null, 2),
  };
};

const ok = <T>(value: T): ByoResult<T> => ({ ok: true, value });
const fail = <T>(f: ByoFailure): ByoResult<T> => ({ ok: false, failure: f });

/** Builds the dialog's API over the picker's request context. */
export function createCommunityByoApi(
  ctx: PlatformRequestContext,
  options: CommunityByoApiOptions
): ByoModelDialogApi {
  const providers = options.providers ?? COMMUNITY_BYO_PROVIDERS;
  const sleep = options.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const graceMs = options.newConnectionGraceMs ?? 90_000;
  const product = ctx.requestingProduct ?? '';
  const operationGroupName =
    options.operationGroupName ?? `${product}-${ctx.requestingFeature ?? ''}`;
  const base = (ctx.baseUrl ?? '').replace(/\/$/, '');
  const tenantUrl = (path: string) => `${base}/${ctx.tenantName}/${path}`;

  const byId = (id: string) => providers.find((p) => p.id === id);
  const formCache = new Map<string, ByoConnectionForm>();
  const createdAt = new Map<string, number>();
  // A failed connect leaves its session open; a retry reuses it.
  let openSession: IsSession | null = null;

  async function call(
    method: string,
    url: string,
    {
      body,
      folderKey,
      headers,
    }: { body?: unknown; folderKey?: string; headers?: Record<string, string> } = {}
  ): Promise<CallResult> {
    const bearer = await resolveToken(ctx.token);
    const h: Record<string, string> = {
      Authorization: `Bearer ${bearer}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    };
    if (folderKey) h['X-UiPath-FolderKey'] = folderKey;
    const res = await fetch(url, {
      method,
      headers: h,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { ok: res.ok, status: res.status, statusText: res.statusText, data };
  }

  async function session(provider: CommunityByoProvider, folderKey: string) {
    const reusable =
      openSession &&
      openSession.connector === provider.connector &&
      openSession.folderKey === folderKey &&
      Date.now() < openSession.expiresAt - 30_000;
    if (reusable && openSession) return ok(openSession);
    const r = await call('POST', tenantUrl('connections_/api/v1/Connections/'), {
      body: { connector: provider.connector },
      folderKey,
    });
    if (!r.ok) return fail<IsSession>(failure(r, 'Could not start the connection'));
    const d = r.data as { sessionId: string; expiresAt?: number };
    openSession = {
      id: d.sessionId,
      connector: provider.connector,
      folderKey,
      expiresAt: d.expiresAt ?? Date.now() + 10 * 60_000,
    };
    return ok(openSession);
  }

  const sessionForm = (sid: string, folderKey: string) =>
    call(
      'GET',
      tenantUrl(`elements_/v1/elements/normalized-instances/applications/sessions/${sid}`),
      {
        folderKey,
      }
    );

  function toForm(provider: CommunityByoProvider, entries: IsConfigEntry[]): ByoConnectionForm {
    const overlay = provider.overlay ?? {};
    const auth = entries.find(
      (c) => c.key === 'authentication.type' && (c.options?.length ?? 0) > 1
    );
    const authTypes = (auth?.options ?? []).map((o) => ({
      value: o.value,
      label: provider.authLabels?.[o.value] || o.displayValue || o.description || o.value,
    }));
    const fields: ByoFormField[] = entries
      .filter((c) => SHOWN_SCREENS.has(c.configScreenType ?? '') && !c.hideFromConsole)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((c) => {
        const o = overlay[c.key] ?? {};
        const optional = c.configScreenType === 'pre-optional';
        return {
          key: c.key,
          label: o.label ?? c.name ?? c.key,
          secret: c.type === 'PASSWORD',
          required: !optional && Boolean(c.required),
          advanced: optional && !o.primary,
          group: c.groupBy || null,
          defaultValue: c.defaultValue ?? '',
          placeholder: o.placeholder ?? '',
          hint: o.hint ?? plainText(c.hintText),
        };
      });
    const first = authTypes[0];
    return {
      authTypes,
      defaultAuthType: first ? auth?.defaultValue || first.value : null,
      fields,
    };
  }

  const loadContext = async (): Promise<ByoResult<ByoDialogContext>> => {
    const [folders, connections] = await Promise.all([
      call(
        'GET',
        tenantUrl('orchestrator_/api/FoldersNavigation/GetAllFoldersForCurrentUser?take=500&skip=0')
      ),
      call('GET', tenantUrl('connections_/api/v1/Connections?allFolders=true&folderDefaults=true')),
    ]);
    if (!folders.ok) return fail(failure(folders, 'Could not list your folders'));
    if (!connections.ok) return fail(failure(connections, 'Could not list your connections'));
    const rows = asList(folders.data)
      .filter((f) => f.IsSelectable !== false)
      .map((f) => ({
        folder: {
          id: String(f.Key),
          label: f.IsPersonal
            ? String(f.DisplayName)
            : String(f.FullyQualifiedName ?? f.DisplayName)
                .split('/')
                .join(' › '),
        } satisfies ByoFolder,
        personal: Boolean(f.IsPersonal),
      }));
    rows.sort((a, b) => Number(b.personal) - Number(a.personal));
    const byConnector = (key: unknown) => providers.find((p) => p.connector === key);
    const saved: ByoConnection[] = asList(connections.data).flatMap((c) => {
      const connector = (c.connector as { key?: string } | undefined)?.key;
      const provider = byConnector(connector);
      const folder = (c.folder as { key?: string } | undefined)?.key;
      return provider && folder
        ? [{ id: String(c.id), providerId: provider.id, name: String(c.name), folderId: folder }]
        : [];
    });
    return ok({
      providers: providers.map(({ id, name }) => ({ id, name })),
      connections: saved,
      folders: rows.map((r) => r.folder),
      defaultFolderId: rows[0]?.folder.id ?? null,
      takenModelNames: options.takenModelNames(),
    });
  };

  const loadForm = async (providerId: string, folderId: string | null) => {
    const provider = byId(providerId);
    if (!provider) return fail<ByoConnectionForm>({ title: `Unknown provider ${providerId}` });
    const cached = formCache.get(provider.connector);
    if (cached) return ok(cached);
    let entries: IsConfigEntry[] | undefined;
    const definition = await call(
      'GET',
      tenantUrl(`elements_/v3/element/elements/${provider.connector}`)
    );
    if (definition.ok) {
      entries = (definition.data as { configuration?: IsConfigEntry[] })?.configuration;
    } else {
      if (!folderId)
        return fail<ByoConnectionForm>(failure(definition, 'Could not read the connector form'));
      const s = await session(provider, folderId);
      if (!s.ok) return s;
      const f = await sessionForm(s.value.id, folderId);
      if (!f.ok) return fail<ByoConnectionForm>(failure(f, 'Could not read the connector form'));
      entries = (f.data as { elementMetadata?: { configuration?: IsConfigEntry[] } })
        ?.elementMetadata?.configuration;
    }
    const form = toForm(provider, entries ?? []);
    formCache.set(provider.connector, form);
    return ok(form);
  };

  const connect: ByoModelDialogApi['connect'] = async ({
    providerId,
    form,
    authType,
    values,
    name,
    folderId,
  }) => {
    const provider = byId(providerId);
    if (!provider) return fail({ title: `Unknown provider ${providerId}` });
    const entered = Object.fromEntries(
      form.fields
        .filter((f) => !f.group || f.group === authType)
        .map((f) => [f.key, (values[f.key] ?? '').trim()] as const)
        .filter(([, v]) => v)
    );

    const s = await session(provider, folderId);
    if (!s.ok) return s;
    const sid = s.value.id;
    const sf = await sessionForm(sid, folderId);
    if (!sf.ok) return fail(failure(sf, 'Could not read the connector form'));
    const sfd = sf.data as {
      elementMetadata?: { configuration?: IsConfigEntry[] };
      configs?: Record<string, string>;
    };
    // Every default goes back, then the session's configs, then what the user entered.
    const configuration: Record<string, string> = {};
    for (const c of sfd?.elementMetadata?.configuration ?? []) {
      if (c.defaultValue !== undefined && c.defaultValue !== null && c.defaultValue !== '') {
        configuration[c.key] = c.defaultValue;
      }
    }
    Object.assign(
      configuration,
      sfd?.configs,
      entered,
      form.authTypes.length && authType ? { 'authentication.type': authType } : {},
      provider.derive?.(entered)
    );

    // IS needs a name here; the real one is set by the rename below.
    const auth = await call(
      'POST',
      tenantUrl('elements_/v1/elements/normalized-instances/authenticate'),
      {
        folderKey: folderId,
        body: {
          element: { key: provider.connector },
          sessionID: sid,
          configuration,
          name: new Date().toISOString(),
        },
      }
    );
    if (!auth.ok) return fail(failure(auth, `${provider.name} refused the connection`));

    let id = (auth.data as { elementInstance?: { connectionId?: string } })?.elementInstance
      ?.connectionId;
    for (let i = 0; i < SESSION_POLLS; i += 1) {
      const st = await call('GET', tenantUrl(`connections_/api/v1/Sessions/${sid}`), {
        folderKey: folderId,
      });
      const d = st.data as {
        status?: string;
        connectionId?: string;
        errorResponse?: unknown;
      } | null;
      if (d?.status === 'success') {
        id = d.connectionId || id;
        break;
      }
      if (d?.status && d.status !== 'pending') {
        return fail(failure({ ...st, data: d.errorResponse ?? d }, `Connection ${d.status}`));
      }
      await sleep(SESSION_POLL_MS);
    }
    openSession = null;
    if (!id) return fail({ title: 'Integration Service did not return the new connection' });
    await call('PATCH', tenantUrl(`connections_/api/v1/Connections/${id}/rename`), {
      folderKey: folderId,
      body: { newName: name },
    });
    createdAt.set(id, Date.now());
    return ok({ id, providerId, name, folderId });
  };

  const listModels: ByoModelDialogApi['listModels'] = async (providerId, connection) => {
    const provider = byId(providerId);
    if (!provider) return fail({ title: `Unknown provider ${providerId}` });
    const r = await call('POST', buildGatewayUrl(ctx, 'api/byom/available-models'), {
      body: {
        product,
        connectorType: provider.connectorType,
        connectionId: connection.id,
        organizationId: ctx.organizationId,
        tenantId: ctx.tenantId,
        desiredModel: '',
        customerModel: '',
      },
    });
    if (!r.ok) return fail(failure(r, `Could not list your ${provider.name} models`));
    const ids = [...new Set(Array.isArray(r.data) ? (r.data as string[]) : [])];
    const rows: ByoProviderModel[] = ids.map((id) => {
      const notChat = NOT_CHAT.find(([re]) => re.test(id));
      return notChat
        ? { id, short: notChat[1], reason: `${notChat[1]}: not a chat model.` }
        : { id };
    });
    const newestFirst = (a: ByoProviderModel, b: ByoProviderModel) =>
      b.id.localeCompare(a.id, undefined, { numeric: true });
    return ok({
      compatible: rows.filter((m) => !m.reason).sort(newestFirst),
      incompatible: rows.filter((m) => m.reason).sort(newestFirst),
    });
  };

  const testAndAdd: ByoModelDialogApi['testAndAdd'] = async ({
    providerId,
    connection,
    modelId,
    name,
  }) => {
    const provider = byId(providerId);
    if (!provider) return fail({ title: `Unknown provider ${providerId}` });
    if (!ctx.organizationId || !ctx.tenantId) {
      return fail({ title: 'The picker needs organizationId and tenantId to add a model.' });
    }
    const llmConfiguration = {
      desiredModel: name,
      customerModel: modelId,
      connectorType: provider.connectorType,
      connectionId: connection.id,
      organizationId: ctx.organizationId,
      tenantId: ctx.tenantId,
    };
    const group = (customFieldMappings?: Record<string, string>) => ({
      enabled: true,
      name: `${operationGroupName}-${Date.now()}`,
      operationGroupName,
      product,
      folderId: connection.folderId,
      organizationId: ctx.organizationId,
      tenantId: ctx.tenantId,
      llmConfigurations: [
        { ...llmConfiguration, ...(customFieldMappings ? { customFieldMappings } : {}) },
      ],
    });

    // A connection IS just created is invisible to the gateway for up to a minute.
    let attemptStarted = Date.now();
    const retryUntil = (createdAt.get(connection.id) ?? 0) + graceMs;
    let validation: CallResult;
    for (;;) {
      attemptStarted = Date.now();
      validation = await call(
        'POST',
        buildGatewayUrl(ctx, 'api/byo/product/llm-configurations/validate'),
        {
          body: group(),
          headers: {
            'X-UiPath-LlmGateway-ByoConfigMode': 'add',
            'X-UiPath-LLMGateway-AllowFull4xxResponse': 'true',
          },
        }
      );
      const notFoundYet = JSON.stringify(validation.data ?? '').includes(NEW_CONNECTION_NOT_FOUND);
      if (!notFoundYet || Date.now() + RETRY_MS > retryUntil) break;
      await sleep(RETRY_MS);
    }
    const latencyMs = Date.now() - attemptStarted;
    if (!validation.ok) return fail(failure(validation, 'The gateway refused the test'));
    const res = (Object.values((validation.data as Record<string, unknown>) ?? {})[0] ?? {}) as {
      isAvailable?: boolean;
      isCompatible?: boolean;
      incompatibilityReason?: string;
      unavailabilityReason?: string;
      vendorRawResponse?: string;
      customFieldMappings?: Record<string, string>;
    };
    if (!res.isAvailable || !res.isCompatible) {
      let vendor = res.vendorRawResponse;
      try {
        vendor = (JSON.parse(vendor ?? '') as { message?: string }).message ?? vendor;
      } catch {
        // Not JSON: shown as is.
      }
      const reason =
        res.unavailabilityReason ||
        res.incompatibilityReason ||
        (res.isAvailable ? 'Not compatible' : 'Not reachable');
      return fail({
        title: `The test call failed: ${reason}`,
        message: vendor || undefined,
        detail: JSON.stringify(res, null, 2),
      });
    }

    const saved = await call('POST', buildGatewayUrl(ctx, 'api/byo/product/llm-configurations'), {
      body: group(res.customFieldMappings),
    });
    if (!saved.ok) return fail(failure(saved, 'The model passed its test but could not be saved'));
    return ok<ByoAddedModel>({
      name,
      modelId,
      connectionId: connection.id,
      folderId: connection.folderId,
      latencyMs,
    });
  };

  return { loadContext, loadForm, connect, listModels, testAndAdd };
}
