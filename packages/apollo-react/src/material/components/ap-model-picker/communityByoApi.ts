import type {
  ByoApiType,
  ByoConnection,
  ByoConnectionChange,
  ByoConnectionForm,
  ByoConnectionValues,
  ByoDialogContext,
  ByoFailure,
  ByoFolder,
  ByoFormField,
  ByoModelDialogApi,
  ByoModelToEdit,
  ByoProviderModel,
  ByoReplaceableModel,
  ByoResult,
  ByoSavedModel,
} from '@uipath/apollo-wind';

import { buildGatewayUrl, type PlatformRequestContext, resolveToken } from './usePlatformAccess';

/**
 * The Community "Use your own model" dialog's calls, made with the picker's
 * `requestContext`.
 *
 * Connect creates or edits the Integration Service connection without the
 * hosted IS page, by making the calls that page makes:
 *   1. A provisioning session: `POST connections_/api/v1/Connections` for a
 *      new connection, `POST Connections/{id}/auth` to edit a saved one.
 *   2. `GET elements_/…/applications/sessions/{id}` reads the session's form,
 *      with the saved connection's current settings when editing.
 *   3. `elements_/…/normalized-instances/authenticate` submits the
 *      credentials (`POST` for a new connection, `PUT` with the connection's
 *      `instanceID` for a saved one); IS checks them against the vendor and
 *      answers at once.
 *   4. `GET connections_/api/v1/Sessions/{id}` until the connection exists.
 *   5. `PATCH Connections/{id}/rename` names it.
 * Each provider's form is declared here, not read from IS: IS's form schema is
 * what its own page understands, with no contract behind it, and it differs by
 * connector. What the dialog relies on is the connector's config keys, which IS
 * cannot rename without breaking every connection already saved.
 * Steps 2 and 3 are Udon routes IS has not published; see
 * Confluence "BYOM for DLG: creating connections inline" (LLM-4518).
 *
 * Test and save runs the gateway's `llm-configurations/validate`, then saves
 * the configuration: `POST llm-configurations` for a new model,
 * `PUT llm-configurations/{id}` for an edited one. It saves what AI Trust
 * Layer's own form saves: a `SelfServe` entry with its API type, whose
 * `defaultModel` is its own name.
 *
 * Which UiPath models can be replaced and through which API types follow AI
 * Trust Layer's form too, from the same gateway reads: the feature's models and
 * probes (`byom/products`), the models each connector serves
 * (`byom/vendors/llms`) and each model's API types
 * (`byom/vendors/llms/api-flavors`).
 */

export interface CommunityByoProvider {
  id: string;
  name: string;
  /** Integration Service connector key. */
  connector: string;
  /** The gateway's `connectorType`. */
  connectorType: string;
  /** The connection form, keyed by the connector's config keys. */
  form: ByoConnectionForm;
  /** Values the gateway needs that the form never asks for, worked out from the others. */
  derive?: (values: Record<string, string>) => Record<string, string>;
  /**
   * Settings a saved connection must already have for this dialog to edit it, because
   * Connect sets them: another value means the connection serves something else.
   */
  requires?: Record<string, string>;
}

/** The first setting `requires` names that the saved connection holds differently. */
function otherPurpose(
  provider: CommunityByoProvider,
  current: Record<string, unknown>
): [string, unknown] | null {
  for (const [key, value] of Object.entries(provider.requires ?? {})) {
    if (current[key] !== value) return [key, current[key]];
  }
  return null;
}

const EDIT_IN_IS = 'Edit this connection in Integration Service';

const settingOf = (value: unknown) =>
  value === undefined || value === null || value === '' ? null : String(value);

/** The change that makes a saved connection serve `provider`, for the user to agree to. */
function connectionChange(
  provider: CommunityByoProvider,
  connection: ByoConnection,
  [, value]: [string, unknown]
): ByoConnectionChange {
  const setting = settingOf(value);
  const usedFor = setting ? ` for ${setting}` : '';
  return {
    title: setting
      ? `This connection is set up for ${setting}, not ${provider.name}`
      : `This connection is not set up for ${provider.name}`,
    message: `To use it here, UiPath switches it to ${provider.name}. Automations that use it${usedFor} may stop working.`,
    agreement: `Switch "${connection.name}" to ${provider.name}. I understand automations that use it${usedFor} may stop working.`,
  };
}

/**
 * Why a connection set up for another purpose is not switched, if it is not: only one whose
 * authentication the dialog offers is, since its settings are sent back as read, which is
 * verified for those types alone (an assumed role is not one), and one that does not say which
 * authentication it uses is not either.
 */
function switchRefusal(
  provider: CommunityByoProvider,
  configs: Record<string, unknown>,
  other: [string, unknown]
): ByoFailure | null {
  const authType = configs['authentication.type'];
  const offered = provider.form.authTypes.some((t) => t.value === authType);
  if (!provider.form.authTypes.length || offered) return null;
  return { ...servesOther(provider, other), final: true };
}

function servesOther(provider: CommunityByoProvider, [, value]: [string, unknown]): ByoFailure {
  const setting = settingOf(value);
  return {
    title: EDIT_IN_IS,
    message: `It is set up for ${setting ?? 'another service'}, not ${provider.name}. Create a separate connection for ${provider.name}.`,
  };
}

type FieldSpec = Partial<Omit<ByoFormField, 'key' | 'label'>>;

/** A field: a required free-text field unless `spec` says otherwise. */
const field = (key: string, label: string, spec: FieldSpec = {}): ByoFormField => ({
  key,
  label,
  secret: false,
  required: true,
  advanced: false,
  group: null,
  defaultValue: '',
  placeholder: '',
  hint: '',
  ...spec,
});

const secret = (key: string, label: string, spec: FieldSpec = {}) =>
  field(key, label, { secret: true, ...spec });

/** An optional field under "More settings". */
const advanced = (key: string, label: string, spec: FieldSpec = {}) =>
  field(key, label, { required: false, advanced: true, ...spec });

const singleAuth = (...fields: ByoFormField[]): ByoConnectionForm => ({
  authTypes: [],
  defaultAuthType: null,
  fields,
});

// The commercial regions the connector offers. The gateway calls
// bedrock-runtime.{region}.amazonaws.com, which the China, GovCloud and ISO regions are not.
const AWS_REGIONS: [string, string][] = [
  ['us-east-1', 'US East (N. Virginia)'],
  ['us-east-2', 'US East (Ohio)'],
  ['us-west-1', 'US West (N. California)'],
  ['us-west-2', 'US West (Oregon)'],
  ['ca-central-1', 'Canada (Central)'],
  ['sa-east-1', 'South America (Sao Paulo)'],
  ['eu-central-1', 'EU (Frankfurt)'],
  ['eu-north-1', 'EU (Stockholm)'],
  ['eu-south-1', 'EU (Milan)'],
  ['eu-west-1', 'EU (Ireland)'],
  ['eu-west-2', 'EU (London)'],
  ['eu-west-3', 'EU (Paris)'],
  ['me-south-1', 'Middle East (Bahrain)'],
  ['af-south-1', 'Africa (Cape Town)'],
  ['ap-east-1', 'Asia Pacific (Hong Kong)'],
  ['ap-south-1', 'Asia Pacific (Mumbai)'],
  ['ap-northeast-1', 'Asia Pacific (Tokyo)'],
  ['ap-northeast-2', 'Asia Pacific (Seoul)'],
  ['ap-northeast-3', 'Asia Pacific (Osaka)'],
  ['ap-southeast-1', 'Asia Pacific (Singapore)'],
  ['ap-southeast-2', 'Asia Pacific (Sydney)'],
];

export const COMMUNITY_BYO_PROVIDERS: readonly CommunityByoProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    connector: 'uipath-openai-openai',
    connectorType: 'OpenAi',
    form: singleAuth(
      secret('Authorization', 'API key', {
        placeholder: 'sk-…',
        hint: 'Find it in the OpenAI dashboard, under API keys.',
      })
    ),
  },
  {
    id: 'azure-openai',
    name: 'Azure OpenAI',
    connector: 'uipath-microsoft-azureopenai',
    connectorType: 'AzureOpenAi',
    form: {
      authTypes: [
        { value: 'customApiKey', label: 'API key' },
        { value: 'oauth2ClientCredentials', label: 'Client credentials (Entra app)' },
      ],
      defaultAuthType: 'customApiKey',
      fields: [
        // IS takes the connection without it, but the gateway calls the resource it names.
        field('url', 'Endpoint', { placeholder: 'https://<resource>.openai.azure.com' }),
        secret('api-key', 'API key', {
          group: 'customApiKey',
          hint: "Find it in the Azure portal, on the resource's Keys and Endpoint page.",
        }),
        field('oauth.api.key', 'Client ID', { group: 'oauth2ClientCredentials' }),
        secret('oauth.api.secret', 'Client secret', { group: 'oauth2ClientCredentials' }),
        field('tenantID', 'Tenant ID', { group: 'oauth2ClientCredentials' }),
        advanced('api-version', 'API version', { defaultValue: '2023-10-01-preview' }),
      ],
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
  // AI Trust Layer reaches Bedrock through the Amazon Web Services connector, never `uipath-aws-bedrock`.
  // Only access keys are offered: an assumed role or a UiPath-managed cross-account role is set up
  // in AI Trust Layer.
  {
    id: 'bedrock',
    name: 'Amazon Bedrock',
    connector: 'uipath-amazon-webservices',
    connectorType: 'AmazonWebServices',
    form: {
      authTypes: [{ value: 'accessKey', label: 'Access key' }],
      defaultAuthType: 'accessKey',
      fields: [
        // The gateway calls Bedrock in the connection's region.
        field('aws.region', 'Region', {
          placeholder: 'Select a region',
          options: AWS_REGIONS.map(([value, label]) => ({ value, label: `${label} · ${value}` })),
        }),
        field('aws.api.key', 'Access key ID', { group: 'accessKey' }),
        secret('aws.api.secret', 'Secret access key', { group: 'accessKey' }),
        advanced('aws.temporary.session.token', 'Session token', {
          secret: true,
          group: 'accessKey',
          hint: 'Only for temporary credentials.',
        }),
      ],
    },
    // The connector serves any AWS service; the connection is for Bedrock's runtime.
    derive: (): Record<string, string> => ({ 'default.service.name': 'bedrock-runtime' }),
    // A saved connection for another AWS service stays as it is, for what else uses it.
    requires: { 'default.service.name': 'bedrock-runtime' },
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    connector: 'uipath-anthropic-claude',
    connectorType: 'Anthropic',
    form: singleAuth(secret('x-api-key', 'API key', { placeholder: 'sk-ant-…' })),
  },
  {
    id: 'vertex',
    name: 'Google Vertex',
    connector: 'uipath-google-vertex',
    connectorType: 'GoogleVertex',
    form: singleAuth(
      field('project.id', 'Project ID'),
      field('region', 'Location', { defaultValue: 'us-central1' }),
      secret('service.account.key', 'Service account key', {
        hint: "The service account's JSON key.",
      })
    ),
  },
  {
    id: 'nvidia-nim',
    name: 'Nvidia NIM',
    connector: 'uipath-nvidia-nim',
    connectorType: 'NvidiaNim',
    form: singleAuth(
      field('url', 'Base URL', { defaultValue: 'https://integrate.api.nvidia.com' }),
      secret('apikey', 'API key'),
      field('api_version', 'API version', { defaultValue: 'v1' })
    ),
  },
  {
    id: 'openai-compatible',
    name: 'OpenAI-compatible',
    connector: 'uipath-openai-openaiv1compliant',
    connectorType: 'OpenAiV1Compatible',
    form: singleAuth(
      // The connector appends /v1 itself.
      field('url', 'Base URL', {
        placeholder: 'https://api.example.com',
        hint: 'Without /v1: the connector adds it.',
      }),
      secret('apikey', 'API key')
    ),
  },
];

export interface CommunityByoApiOptions {
  /** Names already in the user's model list. */
  takenModelNames: () => string[];
  /** BYO operation group the configuration is saved under; defaults to `{product}-{feature}`. */
  operationGroupName?: string;
  providers?: readonly CommunityByoProvider[];
  /** How long Test and save keeps retrying while a new connection is not yet visible to the gateway. */
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

/** A field of the session's form; Connect sends back the defaults it carries. */
interface IsConfigEntry {
  key: string;
  defaultValue?: string | null;
}

interface IsSession {
  id: string;
  connector: string;
  folderKey: string;
  /** The saved connection the session edits; `null` for a new connection. */
  connectionId: string | null;
  expiresAt: number;
}

interface IsSessionForm {
  elementMetadata?: { configuration?: IsConfigEntry[] };
  /** The connection's current settings, secrets masked; set when the session edits a saved connection. */
  configs?: Record<string, string>;
  /** The saved connection's element instance; set when the session edits a saved connection. */
  elementInstance?: { id?: number };
}

/** One model of a saved BYO configuration, as the gateway returns it. */
interface LlmConfigurationEntry {
  desiredModel?: string;
  customerModel?: string;
  connectorType?: string;
  connectionId?: string;
  customFieldMappings?: Record<string, string> | null;
  /** Set on a model that replaces a UiPath model; an edit keeps it. */
  defaultModel?: string | null;
  apiFlavor?: string | null;
  [field: string]: unknown;
}

/** A saved BYO configuration, as the gateway returns it. */
interface ProductLlmConfiguration {
  id: string;
  folderId: string;
  product?: string;
  operationGroupName?: string;
  llmConfigurations: LlmConfigurationEntry[];
  [field: string]: unknown;
}

interface FeatureProbe {
  apiFlavor?: string;
}

/** A UiPath model of a BYO feature, as `byom/products` returns it. */
interface FeatureModel {
  model: string;
  usageEndDate?: string;
  probes?: FeatureProbe[] | null;
}

/** A BYO feature (operation group), as `byom/products` returns it. */
interface FeatureConfiguration {
  modelsConfigurationOption?: string;
  models?: FeatureModel[];
  probes?: FeatureProbe[] | null;
}

/** What the context read about the feature, which `apiTypes` and the saves answer from. */
interface FeatureRules {
  feature: FeatureConfiguration;
  /** UiPath model → the connector types that serve it, grouped as AI Trust Layer groups them. */
  connectorTypesByModel: Record<string, string[]>;
  /** UiPath model → the API types a BYO connection may use in its place. */
  apiTypesByModel: Record<string, string[] | null>;
}

const flavorsOf = (probes?: FeatureProbe[] | null) => [
  ...new Set((probes ?? []).flatMap((p) => (p.apiFlavor ? [p.apiFlavor] : []))),
];

/** A retirement date worth showing: AI Trust Layer reads `N/A` as none. */
const retirementOf = (model: FeatureModel) =>
  model.usageEndDate && model.usageEndDate !== 'N/A' ? model.usageEndDate : undefined;

/** `map[key]` when the map itself holds it, so a model named `constructor` is not read off Object's prototype. */
const own = <T>(map: Record<string, T>, key: string): T | undefined =>
  Object.hasOwn(map, key) ? map[key] : undefined;

/** AI Trust Layer's model → connector types map, from the connector → models one. */
function connectorTypesByModelOf(data: unknown): Record<string, string[]> {
  const byModel: Record<string, string[]> = {};
  for (const [connectorType, models] of Object.entries((data ?? {}) as Record<string, unknown>)) {
    if (!Array.isArray(models)) continue;
    let group = [connectorType];
    if (BEDROCK_CONNECTORS.includes(connectorType)) group = BEDROCK_CONNECTORS;
    else if (OPENAI_CONNECTORS.includes(connectorType)) group = OPENAI_CONNECTORS;
    for (const model of models) byModel[String(model)] = group;
  }
  return byModel;
}

/** Connector types that carry `apiType`, custom connectors aside. */
const connectorsCarrying = (apiType: string) =>
  Object.entries(CONNECTOR_API_TYPES).flatMap(([type, apiTypes]) =>
    apiTypes.includes(apiType) ? [type] : []
  );

const OPENAI_API_TYPES = ['OpenAiChatCompletions', 'OpenAiResponses', 'OpenAiEmbeddings'];
/** The API types each connector carries, as AI Trust Layer lists them. */
const CONNECTOR_API_TYPES: Record<string, string[]> = {
  OpenAi: OPENAI_API_TYPES,
  AzureOpenAi: OPENAI_API_TYPES,
  AwsBedrock: [],
  AmazonWebServices: ['AwsBedrockInvoke', 'AwsBedrockConverse'],
  GoogleVertex: ['GeminiGenerateContent', 'GeminiEmbeddings'],
  OpenAiV1Compatible: OPENAI_API_TYPES,
  NvidiaNim: OPENAI_API_TYPES,
  Anthropic: ['AnthropicMessages'],
};
const API_TYPE_LABELS: Record<string, string> = {
  OpenAiChatCompletions: 'OpenAI Chat Completions',
  OpenAiResponses: 'OpenAI Responses',
  OpenAiEmbeddings: 'OpenAI Embeddings',
  GeminiGenerateContent: 'Gemini Generate Content',
  GeminiEmbeddings: 'Gemini Embeddings',
  AwsBedrockInvoke: 'AWS Bedrock Invoke',
  AwsBedrockConverse: 'AWS Bedrock Converse',
  AnthropicMessages: 'Anthropic Messages',
};
const CHAT_COMPLETIONS = 'OpenAiChatCompletions';
const OPENAI_CONNECTORS = ['AzureOpenAi', 'OpenAi', 'OpenAiV1Compatible'];
const BEDROCK_CONNECTORS = ['AwsBedrock', 'AmazonWebServices'];
const ADD_OWN_MODELS = 'AnyModelWithOwnAdditions';
const NEW_CONNECTION_NOT_FOUND = 'IntegrationServiceConfigurationNotFound';
const MASKED_SECRET = '********';
const SESSION_POLLS = 20;
const SESSION_POLL_MS = 1500;
const RETRY_MS = 5000;

const FOLDER_PAGE = 500;

const asList = (data: unknown): Record<string, unknown>[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const d = data as { value?: unknown; PageItems?: unknown };
    if (Array.isArray(d.value)) return d.value;
    if (Array.isArray(d.PageItems)) return d.PageItems;
  }
  return [];
};

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

/** The entry of a saved configuration for the model named `name` in the user's model list. */
const entryNamed = (configuration: ProductLlmConfiguration, name: string) =>
  configuration.llmConfigurations.find(
    (entry) => entry.desiredModel?.toLowerCase() === name.toLowerCase()
  );

/** `text` re-indented when it is JSON, as is otherwise. */
const prettyJson = (text: string) => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
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
  const createdAt = new Map<string, number>();
  // A failed connect leaves its session open; a retry reuses it.
  let openSession: IsSession | null = null;
  // Read by `loadContext`; `apiTypes` and the saves answer from it.
  let rules: FeatureRules | null = null;
  // The folders AI Trust Layer offers, which are the only ones a model is saved in.
  let offeredFolderIds: Set<string> | null = null;

  /**
   * Makes a gateway call about a connection, repeating it while a connection created in
   * this dialog is not yet visible to the gateway, which takes up to a minute.
   * Returns the last result and when its attempt started.
   */
  async function whileNewConnectionInvisible(
    connectionId: string,
    attempt: () => Promise<CallResult>
  ): Promise<{ result: CallResult; startedAt: number }> {
    const retryUntil = (createdAt.get(connectionId) ?? 0) + graceMs;
    for (;;) {
      const startedAt = Date.now();
      const result = await attempt();
      const notFoundYet = JSON.stringify(result.data ?? '').includes(NEW_CONNECTION_NOT_FOUND);
      if (!notFoundYet || Date.now() + RETRY_MS > retryUntil) return { result, startedAt };
      await sleep(RETRY_MS);
    }
  }

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

  /** Every folder the user can see, read page by page. */
  async function listFolders(): Promise<CallResult> {
    const items: Record<string, unknown>[] = [];
    for (;;) {
      const page = await call(
        'GET',
        tenantUrl(
          `orchestrator_/api/FoldersNavigation/GetAllFoldersForCurrentUser?take=${FOLDER_PAGE}&skip=${items.length}`
        )
      );
      if (!page.ok) return page;
      const batch = asList(page.data);
      items.push(...batch);
      const count = Number((page.data as { Count?: unknown } | null)?.Count ?? 0);
      if (batch.length < FOLDER_PAGE || items.length >= count) {
        return { ...page, data: { PageItems: items } };
      }
    }
  }

  /** A provisioning session for a new connection, or for editing the saved connection `connectionId`. */
  async function session(
    provider: CommunityByoProvider,
    folderKey: string,
    connectionId: string | null = null
  ) {
    const reusable =
      openSession &&
      openSession.connector === provider.connector &&
      openSession.folderKey === folderKey &&
      openSession.connectionId === connectionId &&
      Date.now() < openSession.expiresAt - 30_000;
    if (reusable && openSession) return ok(openSession);

    let r: CallResult;
    if (connectionId) {
      r = await call('POST', tenantUrl(`connections_/api/v1/Connections/${connectionId}/auth`), {
        folderKey,
      });
    } else {
      r = await call('POST', tenantUrl('connections_/api/v1/Connections/'), {
        body: { connector: provider.connector },
        folderKey,
      });
    }
    if (!r.ok) return fail<IsSession>(failure(r, 'Could not start the connection'));
    const d = r.data as { sessionId: string; expiresAt?: number };
    openSession = {
      id: d.sessionId,
      connector: provider.connector,
      folderKey,
      connectionId,
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

  const configurationUrl = (configurationId: string) =>
    buildGatewayUrl(ctx, `api/byo/product/llm-configurations/${configurationId}`);

  const loadContext = async (): Promise<ByoResult<ByoDialogContext>> => {
    const [folders, connections, products, vendorModels, modelApiTypes, configurations] =
      await Promise.all([
        listFolders(),
        call(
          'GET',
          tenantUrl('connections_/api/v1/Connections?allFolders=true&folderDefaults=true')
        ),
        call('GET', buildGatewayUrl(ctx, 'api/byom/products')),
        call('GET', buildGatewayUrl(ctx, 'api/byom/vendors/llms')),
        call('GET', buildGatewayUrl(ctx, 'api/byom/vendors/llms/api-flavors')),
        call('GET', buildGatewayUrl(ctx, 'api/byo/product/llm-configurations')),
      ]);
    if (!folders.ok) return fail(failure(folders, 'Could not list your folders'));
    if (!connections.ok) return fail(failure(connections, 'Could not list your connections'));
    const notRead = 'Could not read which models you can bring';
    for (const r of [products, vendorModels, modelApiTypes, configurations]) {
      if (!r.ok) return fail(failure(r, notRead));
    }

    const feature = (
      products.data as Record<string, Record<string, FeatureConfiguration>> | null
    )?.[product]?.[operationGroupName];
    if (!feature) {
      return fail({
        title: 'This feature does not take models of your own',
        detail: `No BYO configuration for ${product} / ${operationGroupName}.`,
        final: true,
      });
    }
    // Every model of such a feature is configured at once, which only AI Trust Layer offers.
    if (feature.modelsConfigurationOption === 'AllModels') {
      return fail({
        title: 'This feature’s models are configured together in AI Trust Layer',
        final: true,
      });
    }
    rules = {
      feature,
      connectorTypesByModel: connectorTypesByModelOf(vendorModels.data),
      apiTypesByModel: (modelApiTypes.data ?? {}) as Record<string, string[] | null>,
    };
    // A UiPath model is replaced at most once per feature, as AI Trust Layer allows.
    const configured = new Set(
      asList(configurations.data)
        .filter((c) => c.product === product && c.operationGroupName === operationGroupName)
        .flatMap((c) =>
          asList((c as { llmConfigurations?: unknown }).llmConfigurations ?? []).flatMap((e) =>
            typeof e.desiredModel === 'string' ? [e.desiredModel] : []
          )
        )
    );
    const replaceableModels: ByoReplaceableModel[] = (feature.models ?? [])
      .map((m) => ({
        name: m.model,
        retiresOn: retirementOf(m),
        replaced: configured.has(m.model),
      }))
      // As in AI Trust Layer, models being retired come last.
      .sort((a, b) => Number(Boolean(a.retiresOn)) - Number(Boolean(b.retiresOn)));

    // AI Trust Layer keeps connections out of personal workspaces and solution debug folders.
    const folderRows: ByoFolder[] = asList(folders.data)
      .filter(
        (f) =>
          f.IsSelectable !== false &&
          !f.IsPersonal &&
          f.FolderType !== 'Personal' &&
          f.FolderType !== 'DebugSolution'
      )
      .map((f) => ({
        id: String(f.Key),
        label: String(f.FullyQualifiedName ?? f.DisplayName)
          .split('/')
          .join(' › '),
      }));
    if (folderRows.length === 0) {
      return fail({
        title: 'You need a folder for your connection',
        message: 'Create a folder in Orchestrator, or ask an administrator to add you to one.',
      });
    }
    const folderIds = new Set(folderRows.map((f) => f.id));
    offeredFolderIds = folderIds;
    const byConnector = (key: unknown) => providers.find((p) => p.connector === key);
    const saved: ByoConnection[] = asList(connections.data).flatMap((c) => {
      const connector = (c.connector as { key?: string } | undefined)?.key;
      const provider = byConnector(connector);
      const folder = (c.folder as { key?: string } | undefined)?.key;
      return provider && folder && folderIds.has(folder)
        ? [{ id: String(c.id), providerId: provider.id, name: String(c.name), folderId: folder }]
        : [];
    });
    return ok({
      providers: providers.map(({ id, name }) => ({ id, name })),
      connections: saved,
      folders: folderRows,
      defaultFolderId: folderRows[0]?.id ?? null,
      takenModelNames: [...new Set([...options.takenModelNames(), ...configured])],
      replaceableModels,
      allowsNewNames: feature.modelsConfigurationOption === ADD_OWN_MODELS,
      reservedModelNames: Object.keys(rules.connectorTypesByModel),
    });
  };

  /**
   * AI Trust Layer's API type list: the probes the gateway tests the model with, narrowed to
   * what a replaced UiPath model supports, then to what the provider's connector carries.
   */
  const apiTypes: ByoModelDialogApi['apiTypes'] = (providerId, replaces) => {
    const provider = byId(providerId);
    if (!provider || !rules) return [];
    const { feature, connectorTypesByModel, apiTypesByModel } = rules;
    const addsOwn = feature.modelsConfigurationOption === ADD_OWN_MODELS;
    const featureModel = replaces ? feature.models?.find((m) => m.model === replaces) : undefined;
    // The model's own probes, else the feature's when it takes models of the user's own.
    const probes = featureModel?.probes ?? (addsOwn ? feature.probes : undefined);

    // What a replaced UiPath model supports, plus Chat Completions, which AI Trust Layer always
    // offers; a name of the user's own has no such list.
    let supported: string[] | undefined;
    const modelApiTypes = replaces ? own(apiTypesByModel, replaces) : null;
    if (modelApiTypes) {
      const featureFlavors = flavorsOf(feature.probes);
      const withConnector = new Set(modelApiTypes.filter((t) => connectorsCarrying(t).length));
      withConnector.add(CHAT_COMPLETIONS);
      supported = [...withConnector].filter(
        (t) => featureFlavors.length === 0 || featureFlavors.includes(t)
      );
    }

    let candidates: string[];
    if (probes?.length) {
      const probeFlavors = flavorsOf(probes);
      candidates = supported?.length
        ? probeFlavors.filter((t) => supported.includes(t))
        : probeFlavors;
    } else {
      candidates = supported?.length ? supported : Object.keys(API_TYPE_LABELS);
    }

    const servedBy = replaces ? own(connectorTypesByModel, replaces) : undefined;
    const carried = CONNECTOR_API_TYPES[provider.connectorType] ?? [];
    const shown = candidates.filter((t) => {
      if (!carried.includes(t)) return false;
      // Without own additions, a replaced model is served only by its own vendor's connectors.
      if (replaces && !addsOwn && !servedBy?.includes(provider.connectorType)) return false;
      // Chat Completions for a model no OpenAI connector serves needs a custom AI gateway
      // connector, which the dialog does not offer.
      if (
        t === CHAT_COMPLETIONS &&
        servedBy &&
        !servedBy.some((c) => OPENAI_CONNECTORS.includes(c))
      )
        return false;
      return true;
    });
    // AI Trust Layer lists Chat Completions last.
    shown.sort((a, b) => Number(a === CHAT_COMPLETIONS) - Number(b === CHAT_COMPLETIONS));
    return shown.map((value): ByoApiType => ({ value, label: API_TYPE_LABELS[value] ?? value }));
  };

  const loadModel: ByoModelDialogApi['loadModel'] = async ({ configurationId, name }) => {
    const r = await call('GET', configurationUrl(configurationId));
    if (!r.ok) return fail(failure(r, `Could not read ${name}`));
    const saved = r.data as ProductLlmConfiguration;
    const entry = entryNamed(saved, name);
    const provider = providers.find(
      (p) => p.connectorType.toLowerCase() === entry?.connectorType?.toLowerCase()
    );
    if (!entry || !provider || !entry.connectionId) {
      return fail({
        title: `${name} cannot be edited here`,
        detail: JSON.stringify(saved, null, 2),
        final: true,
      });
    }
    // Saved there with other models, it would stay there: the dialog moves a configuration to
    // the connection's folder only with its one model.
    if (stuckOutsideOfferedFolders(saved)) return fail(savedElsewhere(name));
    const savedName = entry.desiredModel ?? name;
    // As in AI Trust Layer, a model under a UiPath model's name replaces that model.
    const replaces = rules && own(rules.connectorTypesByModel, savedName) ? savedName : null;
    return ok<ByoModelToEdit>({
      configurationId,
      providerId: provider.id,
      connectionId: entry.connectionId,
      modelId: entry.customerModel ?? '',
      name: savedName,
      replaces,
      apiType: entry.apiFlavor ?? null,
    });
  };

  const loadForm: ByoModelDialogApi['loadForm'] = async (providerId) => {
    const provider = byId(providerId);
    if (!provider)
      return fail<ByoConnectionForm>({ title: `Unknown provider ${providerId}`, final: true });
    return ok(provider.form);
  };

  const loadConnectionValues: ByoModelDialogApi['loadConnectionValues'] = async (
    providerId,
    connection
  ) => {
    const provider = byId(providerId);
    if (!provider) return fail({ title: `Unknown provider ${providerId}`, final: true });
    const { form } = provider;

    // The same session Connect then submits the changes through.
    const s = await session(provider, connection.folderId, connection.id);
    if (!s.ok) return s;
    const sf = await sessionForm(s.value.id, connection.folderId);
    if (!sf.ok) return fail(failure(sf, 'Could not read the connection settings'));
    const current = (sf.data as IsSessionForm | null)?.configs ?? {};

    // Secrets stay out of the form: a secret left blank keeps its current value.
    const values: Record<string, string> = {};
    for (const field of form.fields) {
      if (field.secret) continue;
      const value = current[field.key];
      if (value === undefined || value === null || value === MASKED_SECRET) continue;
      values[field.key] = String(value);
    }
    const savedAuthType = current['authentication.type'];
    const knownAuthType = form.authTypes.some((t) => t.value === savedAuthType);
    // Shown as another type, the connection would be switched to it on Connect.
    if (form.authTypes.length && savedAuthType && !knownAuthType) {
      return fail({
        title: EDIT_IN_IS,
        message: `It uses an authentication type this dialog does not offer (${savedAuthType}).`,
      });
    }
    const other = otherPurpose(provider, current);
    if (other) return fail(servesOther(provider, other));
    return ok<ByoConnectionValues>({
      authType: knownAuthType ? (savedAuthType ?? null) : form.defaultAuthType,
      values,
    });
  };

  const connect: ByoModelDialogApi['connect'] = async ({
    providerId,
    form,
    authType,
    values,
    name,
    folderId,
    existing,
  }) => {
    const provider = byId(providerId);
    if (!provider) return fail({ title: `Unknown provider ${providerId}`, final: true });
    // An empty field is left out, so the connector's default applies. Editing, an emptied
    // setting is sent empty so it is cleared, while an empty secret is left out so IS keeps it.
    const entered: Record<string, string> = {};
    for (const field of form.fields) {
      if (field.group && field.group !== authType) continue;
      const value = (values[field.key] ?? '').trim();
      if (value) entered[field.key] = value;
      else if (existing && !field.secret) entered[field.key] = '';
    }

    const s = await session(provider, folderId, existing?.id ?? null);
    if (!s.ok) return s;
    const sid = s.value.id;
    const sf = await sessionForm(sid, folderId);
    if (!sf.ok) return fail(failure(sf, 'Could not read the connector form'));
    const sfd = sf.data as IsSessionForm | null;
    const other = existing ? otherPurpose(provider, sfd?.configs ?? {}) : null;
    if (other) return fail(servesOther(provider, other));
    // Every default goes back, then the session's configs, then what the user entered.
    // Editing, the configs are the connection's current settings with secrets masked,
    // and IS keeps a secret that comes back masked.
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

    // IS needs a name here; the user's name is set by the rename below.
    const nameInIs = existing?.name ?? new Date().toISOString();
    const submitted = await submitSession(provider, sid, sfd, configuration, {
      folderId,
      name: nameInIs,
      existing: Boolean(existing),
    });
    if (!submitted.ok) return submitted;
    const id = submitted.value;
    let savedName = nameInIs;
    if (name !== nameInIs) {
      const renamed = await call(
        'PATCH',
        tenantUrl(`connections_/api/v1/Connections/${id}/rename`),
        {
          folderKey: folderId,
          body: { newName: name },
        }
      );
      if (renamed.ok) savedName = name;
    }
    if (!existing) createdAt.set(id, Date.now());
    return ok({ id, providerId, name: savedName, folderId });
  };

  /**
   * Sends a provisioning session's configuration to IS and waits for the connection:
   * a new one, or, with `existing`, the saved one the session edits. Returns its id.
   */
  async function submitSession(
    provider: CommunityByoProvider,
    sid: string,
    sfd: IsSessionForm | null,
    configuration: Record<string, string>,
    { folderId, name, existing }: { folderId: string; name: string; existing: boolean }
  ): Promise<ByoResult<string>> {
    const body: Record<string, unknown> = {
      element: { key: provider.connector },
      sessionID: sid,
      configuration,
      name,
    };
    // A session that edits a saved connection names its element instance, which IS
    // updates with PUT. Without it, IS would create a new instance and leave the
    // connection unchanged.
    let method = 'POST';
    if (existing) {
      const instanceId = sfd?.elementInstance?.id;
      if (!instanceId) {
        return fail({ title: 'Integration Service did not return the connection to edit' });
      }
      body.instanceID = instanceId;
      method = 'PUT';
    }
    const auth = await call(
      method,
      tenantUrl('elements_/v1/elements/normalized-instances/authenticate'),
      { folderKey: folderId, body }
    );
    if (!auth.ok) return fail(failure(auth, `${provider.name} refused the connection`));

    let id = (auth.data as { elementInstance?: { connectionId?: string } })?.elementInstance
      ?.connectionId;
    // The connection exists once its session reports success, which may take a few polls.
    let provisioned = false;
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
        provisioned = true;
        break;
      }
      if (d?.status && d.status !== 'pending') {
        openSession = null;
        return fail(failure({ ...st, data: d.errorResponse ?? d }, `Connection ${d.status}`));
      }
      await sleep(SESSION_POLL_MS);
    }
    openSession = null;
    if (!provisioned) {
      return fail({ title: 'Integration Service did not finish setting up the connection' });
    }
    if (!id) return fail({ title: 'Integration Service did not return the connection' });
    return ok(id);
  }

  /** The saved connection's current settings, read through the session that would edit it. */
  async function currentSettings(
    provider: CommunityByoProvider,
    connection: ByoConnection
  ): Promise<ByoResult<{ sid: string; sfd: IsSessionForm | null }>> {
    const s = await session(provider, connection.folderId, connection.id);
    if (!s.ok) return s;
    const sf = await sessionForm(s.value.id, connection.folderId);
    if (!sf.ok) return fail(failure(sf, 'Could not read the connection settings'));
    return ok({ sid: s.value.id, sfd: sf.data as IsSessionForm | null });
  }

  const checkConnection: ByoModelDialogApi['checkConnection'] = async (providerId, connection) => {
    const provider = byId(providerId);
    if (!provider) return fail({ title: `Unknown provider ${providerId}`, final: true });
    if (!provider.requires) return ok(null);
    const read = await currentSettings(provider, connection);
    if (!read.ok) return read;
    const configs = read.value.sfd?.configs ?? {};
    const other = otherPurpose(provider, configs);
    if (!other) return ok(null);
    const refused = switchRefusal(provider, configs, other);
    return refused ? fail(refused) : ok(connectionChange(provider, connection, other));
  };

  const applyConnectionChange: ByoModelDialogApi['applyConnectionChange'] = async (
    providerId,
    connection
  ) => {
    const provider = byId(providerId);
    if (!provider?.requires) return fail({ title: `Unknown provider ${providerId}`, final: true });
    const read = await currentSettings(provider, connection);
    if (!read.ok) return read;
    const { sid, sfd } = read.value;
    // Read again here, so a connection changed since it was checked is checked as it now is.
    const other = otherPurpose(provider, sfd?.configs ?? {});
    const refused = other && switchRefusal(provider, sfd?.configs ?? {}, other);
    if (refused) return fail(refused);
    // Its settings as they are, secrets masked so IS keeps them, with only `requires` changed.
    const configuration = { ...sfd?.configs, ...provider.requires };
    const submitted = await submitSession(provider, sid, sfd, configuration, {
      folderId: connection.folderId,
      name: connection.name,
      existing: true,
    });
    return submitted.ok ? ok(connection) : submitted;
  };

  const listModels: ByoModelDialogApi['listModels'] = async (providerId, connection) => {
    const provider = byId(providerId);
    if (!provider) return fail({ title: `Unknown provider ${providerId}`, final: true });
    const { result: r } = await whileNewConnectionInvisible(connection.id, () =>
      call('POST', buildGatewayUrl(ctx, 'api/byom/available-models'), {
        body: {
          product,
          connectorType: provider.connectorType,
          configurationType: 'SelfServe',
          connectionId: connection.id,
          organizationId: ctx.organizationId,
          tenantId: ctx.tenantId,
          desiredModel: '',
          customerModel: '',
        },
      })
    );
    if (!r.ok) return fail(failure(r, `Could not list your ${provider.name} models`));
    const ids = [...new Set(Array.isArray(r.data) ? (r.data as string[]) : [])];
    // The gateway returns ids only, so no model is marked unusable: Test and add checks it.
    const rows: ByoProviderModel[] = ids
      .map((id) => ({ id }))
      .sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }));
    return ok({ compatible: rows, incompatible: [] });
  };

  /**
   * Writes the edited model's new entry into its saved configuration.
   * Returns the folder the configuration is saved in.
   */
  /** Saved, with other models, in a folder the dialog does not offer, such as a personal workspace. */
  const stuckOutsideOfferedFolders = (configuration: ProductLlmConfiguration) =>
    offeredFolderIds !== null &&
    configuration.llmConfigurations.length > 1 &&
    Boolean(configuration.folderId) &&
    !offeredFolderIds.has(String(configuration.folderId));

  const savedElsewhere = (name: string): ByoFailure => ({
    title: `${name} cannot be edited here`,
    message:
      'It is saved with other models in a folder AI Trust Layer does not offer, such as a personal workspace. Edit it in AI Trust Layer.',
    final: true,
  });

  async function updateConfiguration(
    editing: ByoModelToEdit,
    entry: LlmConfigurationEntry,
    folderId: string
  ): Promise<ByoResult<string>> {
    const notSaved = 'The model passed its test but could not be saved';
    const current = await call('GET', configurationUrl(editing.configurationId));
    if (!current.ok) return fail(failure(current, notSaved));
    const configuration = current.data as ProductLlmConfiguration;
    const edited = entryNamed(configuration, editing.name);
    if (!edited) {
      return fail({
        title: `${editing.name} is no longer in its configuration`,
        detail: JSON.stringify(configuration, null, 2),
      });
    }

    // Fields this dialog does not edit are kept, apart from the old model's field mappings.
    // A model that keeps its name keeps the model it stands in for, as AI Trust Layer keeps it.
    const keepsName = edited.desiredModel === entry.desiredModel;
    const updated: LlmConfigurationEntry = {
      ...edited,
      ...entry,
      defaultModel: keepsName ? (edited.defaultModel ?? entry.defaultModel) : entry.defaultModel,
      customFieldMappings: entry.customFieldMappings ?? null,
    };
    const llmConfigurations = configuration.llmConfigurations.map((other) =>
      other === edited ? updated : other
    );

    if (stuckOutsideOfferedFolders(configuration)) return fail(savedElsewhere(editing.name));
    // The configuration moves to the connection's folder only when this is its one model.
    const onlyModel = configuration.llmConfigurations.length === 1;
    const savedFolderId = onlyModel ? folderId : configuration.folderId;
    const saved = await call('PUT', configurationUrl(editing.configurationId), {
      body: { ...configuration, folderId: savedFolderId, llmConfigurations },
    });
    return saved.ok ? ok(savedFolderId) : fail(failure(saved, notSaved));
  }

  const testAndSave: ByoModelDialogApi['testAndSave'] = async ({
    providerId,
    connection,
    modelId,
    name,
    apiType,
    editing,
  }) => {
    const provider = byId(providerId);
    if (!provider) return fail({ title: `Unknown provider ${providerId}`, final: true });
    if (!ctx.organizationId || !ctx.tenantId) {
      return fail({ title: 'The picker needs organizationId and tenantId to add a model.' });
    }
    // The model's entry, as both a new and an edited configuration hold it, and as AI Trust
    // Layer's own form saves it.
    const llmConfiguration = (customFieldMappings?: Record<string, string>) => {
      const entry: LlmConfigurationEntry = {
        desiredModel: name,
        defaultModel: name,
        customerModel: modelId,
        connectorType: provider.connectorType,
        connectionId: connection.id,
        apiFlavor: apiType,
        configurationType: 'SelfServe',
        organizationId: ctx.organizationId,
        tenantId: ctx.tenantId,
      };
      if (customFieldMappings) entry.customFieldMappings = customFieldMappings;
      return entry;
    };
    const newConfiguration = (customFieldMappings?: Record<string, string>) => ({
      enabled: true,
      name: `${operationGroupName}-${Date.now()}`,
      operationGroupName,
      product,
      folderId: connection.folderId,
      organizationId: ctx.organizationId,
      tenantId: ctx.tenantId,
      llmConfigurations: [llmConfiguration(customFieldMappings)],
    });

    // The gateway picks the probes to test with by mode, as AI Trust Layer sets it: a model
    // under one of the feature's UiPath model names replaces it, any other name adds a model.
    // Before the context is read there is no feature to tell, and the gateway works the mode
    // out the same way when the header is missing.
    const headers: Record<string, string> = { 'X-UiPath-LLMGateway-AllowFull4xxResponse': 'true' };
    const feature = rules?.feature;
    if (feature) {
      const featureModelNamed = feature.models?.some((m) => m.model === name) ?? false;
      headers['X-UiPath-LlmGateway-ByoConfigMode'] =
        feature.modelsConfigurationOption === ADD_OWN_MODELS && !featureModelNamed
          ? 'add'
          : 'replace';
    }
    const { result: validation, startedAt } = await whileNewConnectionInvisible(connection.id, () =>
      call('POST', buildGatewayUrl(ctx, 'api/byo/product/llm-configurations/validate'), {
        body: newConfiguration(),
        headers,
      })
    );
    const latencyMs = Date.now() - startedAt;
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
      const reason =
        res.unavailabilityReason ||
        res.incompatibilityReason ||
        (res.isAvailable ? 'Not compatible' : 'Not reachable');
      // The model's own answer, when the gateway passed one on; otherwise its whole summary.
      const detail = res.vendorRawResponse
        ? prettyJson(res.vendorRawResponse)
        : JSON.stringify(res, null, 2);
      return fail({ title: `The test call failed: ${reason}`, detail });
    }

    // The folder the model's configuration is saved in, which is where the model is listed.
    let savedFolderId = connection.folderId;
    if (editing) {
      const updated = await updateConfiguration(
        editing,
        llmConfiguration(res.customFieldMappings),
        connection.folderId
      );
      if (!updated.ok) return updated;
      savedFolderId = updated.value;
    } else {
      const saved = await call('POST', buildGatewayUrl(ctx, 'api/byo/product/llm-configurations'), {
        body: newConfiguration(res.customFieldMappings),
      });
      if (!saved.ok) {
        return fail(failure(saved, 'The model passed its test but could not be saved'));
      }
    }
    return ok<ByoSavedModel>({
      name,
      modelId,
      connectionId: connection.id,
      folderId: savedFolderId,
      latencyMs,
    });
  };

  return {
    loadContext,
    loadModel,
    loadForm,
    loadConnectionValues,
    connect,
    listModels,
    checkConnection,
    applyConnectionChange,
    apiTypes,
    testAndSave,
  };
}
