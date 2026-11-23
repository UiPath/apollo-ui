import { beforeEach, describe, expect, it, vi } from 'vitest';

import { COMMUNITY_BYO_PROVIDERS, createCommunityByoApi } from './communityByoApi';
import type { PlatformRequestContext } from './usePlatformAccess';

const CTX: PlatformRequestContext = {
  token: () => 'test-token',
  baseUrl: 'https://cloud.local/acme/',
  tenantName: 'DefaultTenant',
  organizationId: 'org-guid',
  tenantId: 'tenant-guid',
  requestingProduct: 'agents',
  requestingFeature: 'design-eval-deploy',
};
const TENANT = 'https://cloud.local/acme/DefaultTenant';
const GATEWAY = 'https://cloud.local/org-guid/tenant-guid/llmgateway_';

interface Call {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

type Route = (call: Call) => { status?: number; body?: unknown } | undefined;

let routes: Route[] = [];
let calls: Call[] = [];

beforeEach(() => {
  routes = [];
  calls = [];
  globalThis.fetch = vi.fn(async (url: string, init: RequestInit = {}) => {
    const call: Call = {
      method: init.method ?? 'GET',
      url,
      headers: (init.headers ?? {}) as Record<string, string>,
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(call);
    for (const route of routes) {
      const hit = route(call);
      if (hit) {
        const status = hit.status ?? 200;
        return {
          ok: status < 400,
          status,
          statusText: String(status),
          text: () => Promise.resolve(hit.body === undefined ? '' : JSON.stringify(hit.body)),
        } as unknown as Response;
      }
    }
    throw new Error(`Unexpected ${call.method} ${url}`);
  }) as unknown as typeof fetch;
});

const on =
  (
    method: string,
    url: string,
    respond: (call: Call) => { status?: number; body?: unknown }
  ): Route =>
  (call) =>
    call.method === method && call.url === url ? respond(call) : undefined;

const noSleep = () => Promise.resolve();
const api = (overrides: Partial<Parameters<typeof createCommunityByoApi>[1]> = {}) =>
  createCommunityByoApi(CTX, { takenModelNames: () => ['gpt-4o'], sleep: noSleep, ...overrides });

const FEATURE_PROBES = [
  'OpenAiResponses',
  'OpenAiChatCompletions',
  'AwsBedrockInvoke',
  'AwsBedrockConverse',
  'AnthropicMessages',
  'GeminiGenerateContent',
].map((apiFlavor) => ({ apiFlavor, probeId: `${apiFlavor}-probe` }));

/** The gateway's BYO rules for agents' design-eval-deploy, shaped like alpha's. */
const featureWith = (overrides: Record<string, unknown> = {}) => ({
  agents: {
    'agents-design-eval-deploy': {
      modelsConfigurationOption: 'AnyModelWithOwnAdditions',
      models: [
        { model: 'gpt-4o-2024-05-13', usageEndDate: '2026-09-23' },
        { model: 'gpt-4.1-2025-04-14', usageEndDate: 'N/A' },
        { model: 'gpt-5-2025-08-07', usageEndDate: 'N/A' },
        { model: 'anthropic.claude-sonnet-4-6', usageEndDate: 'N/A' },
      ],
      probes: FEATURE_PROBES,
      ...overrides,
    },
  },
});

/** Routes the gateway reads `loadContext` makes besides folders and connections. */
const routeGatewayRules = (products: unknown = featureWith()) =>
  routes.push(
    on('GET', `${GATEWAY}/api/byom/products`, () => ({ body: products })),
    on('GET', `${GATEWAY}/api/byom/vendors/llms`, () => ({
      body: {
        AzureOpenAi: ['gpt-4o-2024-05-13', 'gpt-4.1-2025-04-14', 'gpt-5-2025-08-07'],
        AwsBedrock: ['anthropic.claude-sonnet-4-6'],
        GoogleVertex: ['gemini-2.5-flash'],
      },
    })),
    on('GET', `${GATEWAY}/api/byom/vendors/llms/api-flavors`, () => ({
      body: {
        'gpt-4o-2024-05-13': ['OpenAiChatCompletions'],
        'gpt-4.1-2025-04-14': ['OpenAiResponses', 'OpenAiChatCompletions'],
        'gpt-5-2025-08-07': ['OpenAiResponses', 'OpenAiChatCompletions'],
        'anthropic.claude-sonnet-4-6': [
          'AwsBedrockInvoke',
          'AwsBedrockConverse',
          'AnthropicMessages',
        ],
        'gemini-2.5-flash': ['GeminiGenerateContent'],
      },
    })),
    on('GET', `${GATEWAY}/api/byo/product/llm-configurations`, () => ({
      body: [
        {
          product: 'agents',
          operationGroupName: 'agents-design-eval-deploy',
          llmConfigurations: [{ desiredModel: 'gpt-5-2025-08-07' }, { desiredModel: 'my-claude' }],
        },
        // Another feature's replacement does not take this feature's model.
        {
          product: 'agents',
          operationGroupName: 'agents-autopilot',
          llmConfigurations: [{ desiredModel: 'gpt-4.1-2025-04-14' }],
        },
      ],
    }))
  );

/** Routes an empty folder and connection list, for tests about the gateway rules. */
const routeNoFoldersOrConnections = () =>
  routes.push(
    on(
      'GET',
      `${TENANT}/orchestrator_/api/FoldersNavigation/GetAllFoldersForCurrentUser?take=500&skip=0`,
      () => ({
        body: {
          PageItems: [
            {
              Key: 'shared',
              DisplayName: 'Shared',
              FullyQualifiedName: 'Shared',
              FolderType: 'Standard',
            },
          ],
        },
      })
    ),
    on(
      'GET',
      `${TENANT}/connections_/api/v1/Connections?allFolders=true&folderDefaults=true`,
      () => ({
        body: [],
      })
    )
  );

/** Routes the calls that create the connection `conn-1` through a provisioning session. */
const routeNewConnection = () =>
  routes.push(
    on('POST', `${TENANT}/connections_/api/v1/Connections/`, () => ({
      body: { sessionId: 'sid', expiresAt: Date.now() + 600_000 },
    })),
    on(
      'GET',
      `${TENANT}/elements_/v1/elements/normalized-instances/applications/sessions/sid`,
      () => ({ body: {} })
    ),
    on('POST', `${TENANT}/elements_/v1/elements/normalized-instances/authenticate`, () => ({
      body: { elementInstance: { connectionId: 'conn-1' } },
    })),
    on('GET', `${TENANT}/connections_/api/v1/Sessions/sid`, () => ({
      body: { status: 'success', connectionId: 'conn-1' },
    })),
    on('PATCH', `${TENANT}/connections_/api/v1/Connections/conn-1/rename`, () => ({ body: {} }))
  );

const connectNewConnection = async (client: ReturnType<typeof api>) => {
  const created = await client.connect({
    providerId: 'openai',
    form: { authTypes: [], defaultAuthType: null, fields: [] },
    authType: null,
    values: {},
    name: 'OpenAI – personal',
    folderId: 'folder-key',
  });
  if (!created.ok) throw new Error('connect failed');
  return created.value;
};

describe('createCommunityByoApi', () => {
  it("declares each provider's form, without reading it from Integration Service", async () => {
    // No route is registered, so any call would fail the test.
    const result = await api().loadForm('azure-openai', null);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.authTypes).toEqual([
      { value: 'customApiKey', label: 'API key' },
      { value: 'oauth2ClientCredentials', label: 'Client credentials (Entra app)' },
    ]);
    expect(result.value.defaultAuthType).toBe('customApiKey');
    expect(
      result.value.fields.map((f) => [f.key, f.required, f.advanced, f.group, f.secret])
    ).toEqual([
      ['url', true, false, null, false],
      ['api-key', true, false, 'customApiKey', true],
      ['oauth.api.key', true, false, 'oauth2ClientCredentials', false],
      ['oauth.api.secret', true, false, 'oauth2ClientCredentials', true],
      ['tenantID', true, false, 'oauth2ClientCredentials', false],
      ['api-version', false, true, null, false],
    ]);
    expect(result.value.fields[5]?.defaultValue).toBe('2023-10-01-preview');
  });

  it("asks for Bedrock's region from a list and an access key", async () => {
    const result = await api().loadForm('bedrock', null);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { authTypes, fields } = result.value;
    expect(authTypes.map((t) => t.value)).toEqual(['accessKey']);
    const region = fields.find((f) => f.key === 'aws.region');
    expect(region).toMatchObject({ required: true, advanced: false, group: null });
    const regions = region?.options?.map((o) => o.value) ?? [];
    expect(regions).toContain('us-east-1');
    expect(regions).toContain('eu-central-1');
    // The gateway's bedrock-runtime.{region}.amazonaws.com does not exist there.
    expect(regions.filter((r) => /^(cn|us-gov|us-iso)/.test(r))).toEqual([]);
    const shown = (authType: string) =>
      fields.filter((f) => f.group === authType && f.required).map((f) => f.key);
    expect(shown('accessKey')).toEqual(['aws.api.key', 'aws.api.secret']);
  });

  it('connects Amazon Web Services to the Bedrock runtime with an access key', async () => {
    routeNewConnection();
    const client = api();
    const form = await client.loadForm('bedrock', null);
    if (!form.ok) throw new Error('no form');

    const result = await client.connect({
      providerId: 'bedrock',
      form: form.value,
      authType: 'accessKey',
      values: { 'aws.region': 'eu-central-1', 'aws.api.key': 'AKIA', 'aws.api.secret': 's' },
      name: 'My AWS',
      folderId: 'folder-key',
    });

    expect(result.ok).toBe(true);
    const auth = calls.find((c) => c.url.endsWith('/authenticate'));
    expect((auth?.body as { configuration: unknown }).configuration).toEqual({
      'authentication.type': 'accessKey',
      'aws.region': 'eu-central-1',
      'aws.api.key': 'AKIA',
      'aws.api.secret': 's',
      'default.service.name': 'bedrock-runtime',
    });
  });

  it.each(
    COMMUNITY_BYO_PROVIDERS.map((p) => [p.name, p] as const)
  )('declares a consistent form for %s', (_, provider) => {
    const { authTypes, defaultAuthType, fields } = provider.form;
    const types = authTypes.map((t) => t.value);
    expect(defaultAuthType === null).toBe(types.length === 0);
    if (defaultAuthType !== null) expect(types).toContain(defaultAuthType);
    for (const f of fields) {
      if (f.group !== null) expect(types).toContain(f.group);
      // "More settings" holds optional fields only.
      if (f.advanced) expect(f.required).toBe(false);
    }
    const keys = fields.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('creates the connection from the defaults, the session configs and what the user entered', async () => {
    routes.push(
      on('POST', `${TENANT}/connections_/api/v1/Connections/`, () => ({
        body: { sessionId: 'sid', expiresAt: Date.now() + 600_000 },
      })),
      on(
        'GET',
        `${TENANT}/elements_/v1/elements/normalized-instances/applications/sessions/sid`,
        () => ({
          body: {
            elementMetadata: {
              configuration: [
                { key: 'apiVersion', defaultValue: '2023-10-01-preview' },
                { key: 'blank', defaultValue: '' },
              ],
            },
            configs: {
              elementKey: 'uipath-microsoft-azureopenai',
              'authentication.type': 'customApiKey',
            },
          },
        })
      ),
      on('POST', `${TENANT}/elements_/v1/elements/normalized-instances/authenticate`, () => ({
        body: { elementInstance: { connectionId: 'conn-1' } },
      })),
      on('GET', `${TENANT}/connections_/api/v1/Sessions/sid`, () => ({
        body: { status: 'success', connectionId: 'conn-1' },
      })),
      on('PATCH', `${TENANT}/connections_/api/v1/Connections/conn-1/rename`, () => ({ body: {} }))
    );
    const form = {
      authTypes: [
        { value: 'customApiKey', label: 'API key' },
        { value: 'oauth2ClientCredentials', label: 'Client credentials' },
      ],
      defaultAuthType: 'customApiKey',
      fields: [
        {
          key: 'url',
          label: 'Endpoint',
          secret: false,
          required: false,
          advanced: false,
          group: null,
          defaultValue: '',
          placeholder: '',
          hint: '',
        },
        {
          key: 'api-key',
          label: 'API key',
          secret: true,
          required: true,
          advanced: false,
          group: 'customApiKey',
          defaultValue: '',
          placeholder: '',
          hint: '',
        },
        {
          key: 'tenantID',
          label: 'Tenant ID',
          secret: false,
          required: true,
          advanced: false,
          group: 'oauth2ClientCredentials',
          defaultValue: '',
          placeholder: '',
          hint: '',
        },
      ],
    };

    const result = await api().connect({
      providerId: 'azure-openai',
      form,
      authType: 'customApiKey',
      values: {
        url: ' https://my-res.openai.azure.com/ ',
        'api-key': 'k',
        tenantID: 'ignored',
        unknown: 'x',
      },
      name: 'Azure – personal',
      folderId: 'folder-key',
    });

    expect(result).toEqual({
      ok: true,
      value: {
        id: 'conn-1',
        providerId: 'azure-openai',
        name: 'Azure – personal',
        folderId: 'folder-key',
      },
    });
    const auth = calls.find((c) => c.url.endsWith('/authenticate'));
    expect(auth?.headers['X-UiPath-FolderKey']).toBe('folder-key');
    expect(auth?.headers.Authorization).toBe('Bearer test-token');
    expect((auth?.body as { configuration: unknown }).configuration).toEqual({
      apiVersion: '2023-10-01-preview',
      elementKey: 'uipath-microsoft-azureopenai',
      'authentication.type': 'customApiKey',
      url: 'https://my-res.openai.azure.com/',
      'api-key': 'k',
      subdomain: 'my-res',
    });
    expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({ newName: 'Azure – personal' });
  });

  it("shows the vendor's own refusal and reuses the session on the retry", async () => {
    let sessions = 0;
    routes.push(
      on('POST', `${TENANT}/connections_/api/v1/Connections/`, () => {
        sessions += 1;
        return { body: { sessionId: 'sid', expiresAt: Date.now() + 600_000 } };
      }),
      on(
        'GET',
        `${TENANT}/elements_/v1/elements/normalized-instances/applications/sessions/sid`,
        () => ({ body: {} })
      ),
      on('POST', `${TENANT}/elements_/v1/elements/normalized-instances/authenticate`, () => ({
        status: 401,
        body: {
          message: 'Unauthorized',
          providerMessage: 'GET /openai/models|401|Incorrect API key provided',
        },
      }))
    );
    const request = {
      providerId: 'openai',
      form: { authTypes: [], defaultAuthType: null, fields: [] },
      authType: null,
      values: {},
      name: 'OpenAI – personal',
      folderId: 'f',
    };
    const client = api();

    const first = await client.connect(request);
    await client.connect(request);

    expect(first.ok).toBe(false);
    if (first.ok) return;
    expect(first.failure.title).toBe('OpenAI refused the connection (HTTP 401)');
    expect(first.failure.message).toBe('Incorrect API key provided');
    expect(sessions).toBe(1);
  });

  it.each([
    ['stays pending', () => ({ body: { status: 'pending' } })],
    ['cannot be read', () => ({ status: 503, body: 'Service Unavailable' })],
  ])('fails the connection when its session %s', async (_, session) => {
    routes.push(on('GET', `${TENANT}/connections_/api/v1/Sessions/sid`, session));
    routeNewConnection();
    const client = api();

    const created = await client.connect({
      providerId: 'openai',
      form: { authTypes: [], defaultAuthType: null, fields: [] },
      authType: null,
      values: {},
      name: 'OpenAI – personal',
      folderId: 'folder-key',
    });

    expect(created).toEqual({
      ok: false,
      failure: { title: 'Integration Service did not finish setting up the connection' },
    });
    expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
  });

  it('offers every listed model, newest first, without judging any by its name', async () => {
    routes.push(
      on('POST', `${GATEWAY}/api/byom/available-models`, () => ({
        body: ['gpt-4o', 'text-embedding-3-large', 'whisper-1', 'gpt-5.1', 'gpt-4o'],
      }))
    );

    const result = await api().listModels('openai', {
      id: 'c',
      providerId: 'openai',
      name: 'n',
      folderId: 'f',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.compatible.map((m) => m.id)).toEqual([
      'whisper-1',
      'text-embedding-3-large',
      'gpt-5.1',
      'gpt-4o',
    ]);
    expect(result.value.incompatible).toEqual([]);
    expect(calls[0]?.body).toMatchObject({
      product: 'agents',
      connectorType: 'OpenAi',
      connectionId: 'c',
      organizationId: 'org-guid',
      tenantId: 'tenant-guid',
    });
  });

  it('retries the model list while a new connection is not yet visible', async () => {
    let listings = 0;
    routeNewConnection();
    routes.push(
      on('POST', `${GATEWAY}/api/byom/available-models`, () => {
        listings += 1;
        return listings < 3
          ? { status: 400, body: { Message: 'IntegrationServiceConfigurationNotFound' } }
          : { body: ['gpt-4o'] };
      })
    );
    const client = api();
    const connection = await connectNewConnection(client);

    const result = await client.listModels('openai', connection);

    expect(listings).toBe(3);
    expect(result.ok && result.value.compatible.map((m) => m.id)).toEqual(['gpt-4o']);
  });

  it('retries the test while a new connection is not yet visible, then saves the configuration', async () => {
    let validations = 0;
    routeNewConnection();
    routes.push(
      on('POST', `${GATEWAY}/api/byo/product/llm-configurations/validate`, () => {
        validations += 1;
        return validations < 3
          ? { status: 400, body: { Message: 'IntegrationServiceConfigurationNotFound' } }
          : {
              body: {
                'my-gpt': {
                  isAvailable: true,
                  isCompatible: true,
                  customFieldMappings: { a: 'b' },
                },
              },
            };
      }),
      on('POST', `${GATEWAY}/api/byo/product/llm-configurations`, () => ({ body: { id: 'cfg' } }))
    );
    routeGatewayRules();
    routeNoFoldersOrConnections();
    const client = api();
    expect((await client.loadContext()).ok).toBe(true);
    const connection = await connectNewConnection(client);

    const result = await client.testAndSave({
      providerId: 'openai',
      connection,
      modelId: 'gpt-4o',
      name: 'my-gpt',
      replaces: null,
      apiType: 'OpenAiResponses',
    });

    expect(result.ok).toBe(true);
    expect(validations).toBe(3);
    const validate = calls.find((c) => c.url.endsWith('/validate'));
    expect(validate?.headers['X-UiPath-LlmGateway-ByoConfigMode']).toBe('add');
    const save = calls.find(
      (c) => c.method === 'POST' && c.url === `${GATEWAY}/api/byo/product/llm-configurations`
    );
    expect(save?.body).toMatchObject({
      enabled: true,
      operationGroupName: 'agents-design-eval-deploy',
      product: 'agents',
      folderId: 'folder-key',
      organizationId: 'org-guid',
      tenantId: 'tenant-guid',
      llmConfigurations: [
        {
          desiredModel: 'my-gpt',
          defaultModel: 'my-gpt',
          customerModel: 'gpt-4o',
          connectorType: 'OpenAi',
          connectionId: 'conn-1',
          apiFlavor: 'OpenAiResponses',
          configurationType: 'SelfServe',
          customFieldMappings: { a: 'b' },
        },
      ],
    });
  });

  it('does not retry for a saved connection and saves nothing when the test fails', async () => {
    routes.push(
      on('POST', `${GATEWAY}/api/byo/product/llm-configurations/validate`, () => ({
        body: {
          x: {
            isAvailable: true,
            isCompatible: false,
            incompatibilityReason: 'MISSING_TOOL_CALL',
            vendorRawResponse: JSON.stringify({ message: 'no tools' }),
          },
        },
      }))
    );

    const result = await api().testAndSave({
      providerId: 'openai',
      connection: { id: 'old', providerId: 'openai', name: 'n', folderId: 'f' },
      modelId: 'gpt-4o',
      name: 'x',
      replaces: null,
      apiType: 'OpenAiResponses',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure.title).toBe('The test call failed: MISSING_TOOL_CALL');
    expect(result.failure.detail).toBe(JSON.stringify({ message: 'no tools' }, null, 2));
    expect(calls.filter((c) => c.url.endsWith('/llm-configurations'))).toHaveLength(0);
  });

  it('lists the folders AI Trust Layer saves connections in and keeps only the BYO connectors', async () => {
    routes.push(
      on(
        'GET',
        `${TENANT}/orchestrator_/api/FoldersNavigation/GetAllFoldersForCurrentUser?take=500&skip=0`,
        () => ({
          body: {
            PageItems: [
              { Key: 'me', DisplayName: 'My Workspace', IsPersonal: true, FolderType: 'Personal' },
              {
                Key: 'shared',
                DisplayName: 'Shared',
                FullyQualifiedName: 'Shared',
                FolderType: 'Standard',
              },
              { Key: 'debug', DisplayName: 'Debug', FolderType: 'DebugSolution' },
              {
                Key: 'finance',
                DisplayName: 'Finance',
                FullyQualifiedName: 'Shared/Finance',
                FolderType: 'Standard',
              },
              { Key: 'nope', DisplayName: 'Locked', IsSelectable: false },
            ],
          },
        })
      ),
      on(
        'GET',
        `${TENANT}/connections_/api/v1/Connections?allFolders=true&folderDefaults=true`,
        () => ({
          body: [
            {
              id: 'c1',
              name: 'My OpenAI',
              connector: { key: 'uipath-openai-openai' },
              folder: { key: 'shared' },
            },
            {
              id: 'c2',
              name: 'Slack',
              connector: { key: 'uipath-salesforce-slack' },
              folder: { key: 'shared' },
            },
            // AI Trust Layer reaches Bedrock through Amazon Web Services, never this connector.
            {
              id: 'c3',
              name: 'Old Bedrock',
              connector: { key: 'uipath-aws-bedrock' },
              folder: { key: 'shared' },
            },
            {
              id: 'c4',
              name: 'My AWS',
              connector: { key: 'uipath-amazon-webservices' },
              folder: { key: 'finance' },
            },
            // A model saved on this one would be saved in the personal workspace.
            {
              id: 'c5',
              name: 'Personal OpenAI',
              connector: { key: 'uipath-openai-openai' },
              folder: { key: 'me' },
            },
          ],
        })
      )
    );
    routeGatewayRules();

    const result = await api().loadContext();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.folders).toEqual([
      { id: 'shared', label: 'Shared' },
      { id: 'finance', label: 'Shared › Finance' },
    ]);
    expect(result.value.defaultFolderId).toBe('shared');
    expect(result.value.connections).toEqual([
      { id: 'c1', providerId: 'openai', name: 'My OpenAI', folderId: 'shared' },
      { id: 'c4', providerId: 'bedrock', name: 'My AWS', folderId: 'finance' },
    ]);
    expect(result.value.takenModelNames).toEqual(['gpt-4o', 'gpt-5-2025-08-07', 'my-claude']);
  });

  it('reads every page of folders before keeping the saved connections in them', async () => {
    const page = (skip: number, size: number) =>
      Array.from({ length: size }, (_, i) => ({
        Key: `f${skip + i}`,
        DisplayName: `F${skip + i}`,
        FolderType: 'Standard',
      }));
    routes.push(
      on(
        'GET',
        `${TENANT}/orchestrator_/api/FoldersNavigation/GetAllFoldersForCurrentUser?take=500&skip=0`,
        () => ({ body: { Count: 501, PageItems: page(0, 500) } })
      ),
      on(
        'GET',
        `${TENANT}/orchestrator_/api/FoldersNavigation/GetAllFoldersForCurrentUser?take=500&skip=500`,
        () => ({ body: { Count: 501, PageItems: page(500, 1) } })
      ),
      on(
        'GET',
        `${TENANT}/connections_/api/v1/Connections?allFolders=true&folderDefaults=true`,
        () => ({
          body: [
            {
              id: 'c1',
              name: 'Late OpenAI',
              connector: { key: 'uipath-openai-openai' },
              folder: { key: 'f500' },
            },
          ],
        })
      )
    );
    routeGatewayRules();

    const result = await api().loadContext();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.folders).toHaveLength(501);
    expect(result.value.connections.map((c) => c.id)).toEqual(['c1']);
  });

  it('refuses when the only folder is the personal workspace', async () => {
    routes.push(
      on(
        'GET',
        `${TENANT}/orchestrator_/api/FoldersNavigation/GetAllFoldersForCurrentUser?take=500&skip=0`,
        () => ({
          body: {
            PageItems: [
              { Key: 'me', DisplayName: 'My Workspace', IsPersonal: true, FolderType: 'Personal' },
            ],
          },
        })
      ),
      on(
        'GET',
        `${TENANT}/connections_/api/v1/Connections?allFolders=true&folderDefaults=true`,
        () => ({
          body: [],
        })
      )
    );
    routeGatewayRules();

    const result = await api().loadContext();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure.title).toBe('You need a folder for your connection');
    expect(result.failure.message).toBe(
      'Create a folder in Orchestrator, or ask an administrator to add you to one.'
    );
    expect(result.failure.detail).toBeUndefined();
  });

  it('refuses to edit a connection whose authentication type the dialog does not offer', async () => {
    routes.push(
      on('POST', `${TENANT}/connections_/api/v1/Connections/conn-aws/auth`, () => ({
        body: { sessionId: 'sid-aws', expiresAt: Date.now() + 600_000 },
      })),
      on(
        'GET',
        `${TENANT}/elements_/v1/elements/normalized-instances/applications/sessions/sid-aws`,
        () => ({
          body: {
            configs: {
              'authentication.type': 'awsUipathManagedCrossAccountAssumeRole',
              'aws.region': 'us-east-1',
            },
            elementInstance: { id: 1 },
          },
        })
      )
    );
    const saved = { id: 'conn-aws', providerId: 'bedrock', name: 'AWS', folderId: 'f' };

    const result = await api().loadConnectionValues('bedrock', saved);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure.title).toBe('Edit this connection in Integration Service');
    expect(result.failure.message).toContain('awsUipathManagedCrossAccountAssumeRole');
  });

  it('uses a saved connection as it is when its provider requires nothing of it', async () => {
    const saved = { id: 'conn-1', providerId: 'openai', name: 'Mine', folderId: 'f' };

    expect(await api().checkConnection?.('openai', saved)).toEqual({ ok: true, value: null });
    expect(calls).toEqual([]);
  });

  describe('a saved Amazon Web Services connection', () => {
    const saved = { id: 'conn-aws', providerId: 'bedrock', name: 'AWS', folderId: 'f' };
    const routeSession = (configs: Record<string, string>) =>
      routes.push(
        on('POST', `${TENANT}/connections_/api/v1/Connections/conn-aws/auth`, () => ({
          body: { sessionId: 'sid-aws', expiresAt: Date.now() + 600_000 },
        })),
        on(
          'GET',
          `${TENANT}/elements_/v1/elements/normalized-instances/applications/sessions/sid-aws`,
          () => ({ body: { configs, elementInstance: { id: 1 } } })
        )
      );
    const s3 = { 'authentication.type': 'accessKey', 'default.service.name': 's3' };

    it('is not edited here when it is set up for another AWS service', async () => {
      routeSession(s3);

      const result = await api().loadConnectionValues('bedrock', saved);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.failure.title).toBe('Edit this connection in Integration Service');
      expect(result.failure.message).toContain('default.service.name: s3');
      expect(result.failure.message).toContain('Create a separate connection');
    });

    it('is left unchanged when Connect is asked to edit it anyway', async () => {
      routeSession(s3);
      const client = api();
      const form = await client.loadForm('bedrock', null);
      if (!form.ok) throw new Error('no form');

      const result = await client.connect({
        providerId: 'bedrock',
        form: form.value,
        authType: 'accessKey',
        values: { 'aws.region': 'eu-central-1', 'aws.api.key': 'AKIA', 'aws.api.secret': '' },
        name: 'AWS',
        folderId: 'f',
        existing: saved,
      });

      expect(result.ok).toBe(false);
      expect(calls.some((c) => c.url.endsWith('/authenticate'))).toBe(false);
    });

    it('asks to be switched to Bedrock when it is set up for another AWS service', async () => {
      routeSession(s3);

      const result = await api().checkConnection?.('bedrock', saved);

      expect(result).toEqual({
        ok: true,
        value: {
          title: 'This connection is set up for s3, not Amazon Bedrock',
          message:
            'To use it here, UiPath switches it to Amazon Bedrock (default.service.name: bedrock-runtime). Automations that use it for s3 may stop working.',
          agreement:
            'Switch "AWS" to Amazon Bedrock. I understand automations that use it for s3 may stop working.',
        },
      });
    });

    it('asks to be switched to Bedrock when it names no service', async () => {
      routeSession({ 'authentication.type': 'accessKey' });

      const result = await api().checkConnection?.('bedrock', saved);

      expect(result?.ok && result.value?.title).toBe(
        'This connection is not set up for Amazon Bedrock'
      );
      expect(result?.ok && result.value?.agreement).toBe(
        'Switch "AWS" to Amazon Bedrock. I understand automations that use it may stop working.'
      );
    });

    it('is used as it is when it is set up for the Bedrock runtime', async () => {
      routeSession({
        'authentication.type': 'accessKey',
        'default.service.name': 'bedrock-runtime',
      });

      expect(await api().checkConnection?.('bedrock', saved)).toEqual({ ok: true, value: null });
    });

    it('switches to Bedrock with only its service changed', async () => {
      routeSession({
        'authentication.type': 'accessKey',
        'aws.region': 'eu-central-1',
        'aws.api.key': 'AKIA',
        'aws.api.secret': '********',
        'default.service.name': 's3',
      });
      routes.push(
        on('PUT', `${TENANT}/elements_/v1/elements/normalized-instances/authenticate`, () => ({
          body: { elementInstance: { connectionId: 'conn-aws' } },
        })),
        on('GET', `${TENANT}/connections_/api/v1/Sessions/sid-aws`, () => ({
          body: { status: 'success', connectionId: 'conn-aws' },
        }))
      );

      const result = await api().applyConnectionChange?.('bedrock', saved);

      expect(result).toEqual({ ok: true, value: saved });
      const auth = calls.find((c) => c.url.endsWith('/authenticate'));
      expect(auth?.method).toBe('PUT');
      expect(auth?.body).toMatchObject({
        sessionID: 'sid-aws',
        instanceID: 1,
        name: 'AWS',
        configuration: {
          'authentication.type': 'accessKey',
          'aws.region': 'eu-central-1',
          'aws.api.key': 'AKIA',
          'aws.api.secret': '********',
          'default.service.name': 'bedrock-runtime',
        },
      });
      expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
    });

    it('is edited here when it is set up for the Bedrock runtime', async () => {
      routeSession({
        'authentication.type': 'accessKey',
        'aws.region': 'eu-central-1',
        'default.service.name': 'bedrock-runtime',
      });

      const result = await api().loadConnectionValues('bedrock', saved);

      expect(result).toEqual({
        ok: true,
        value: { authType: 'accessKey', values: { 'aws.region': 'eu-central-1' } },
      });
    });
  });

  it('edits a saved connection through its own session, keeping a secret left blank', async () => {
    let sessions = 0;
    routes.push(
      on('POST', `${TENANT}/connections_/api/v1/Connections/conn-1/auth`, () => {
        sessions += 1;
        return { body: { sessionId: 'sid-edit', expiresAt: Date.now() + 600_000 } };
      }),
      on(
        'GET',
        `${TENANT}/elements_/v1/elements/normalized-instances/applications/sessions/sid-edit`,
        () => ({
          body: {
            configs: { url: 'https://old.example.com', apikey: '********' },
            elementInstance: { id: 406810 },
          },
        })
      ),
      on('PUT', `${TENANT}/elements_/v1/elements/normalized-instances/authenticate`, () => ({
        body: { elementInstance: { connectionId: 'conn-1' } },
      })),
      on('GET', `${TENANT}/connections_/api/v1/Sessions/sid-edit`, () => ({
        body: { status: 'success', connectionId: 'conn-1' },
      })),
      on('PATCH', `${TENANT}/connections_/api/v1/Connections/conn-1/rename`, () => ({ body: {} }))
    );
    const saved = { id: 'conn-1', providerId: 'openai-compatible', name: 'Mine', folderId: 'f' };
    const client = api();

    const current = await client.loadConnectionValues('openai-compatible', saved);
    expect(current).toEqual({
      ok: true,
      value: { authType: null, values: { url: 'https://old.example.com' } },
    });

    const form = await client.loadForm('openai-compatible', 'f');
    if (!form.ok) throw new Error('loadForm failed');
    const result = await client.connect({
      providerId: 'openai-compatible',
      form: form.value,
      authType: null,
      values: { url: 'https://new.example.com', apikey: '' },
      name: 'Renamed',
      folderId: 'f',
      existing: saved,
    });

    expect(result).toEqual({ ok: true, value: { ...saved, name: 'Renamed' } });
    expect(sessions).toBe(1);
    const auth = calls.find((c) => c.url.endsWith('/authenticate'));
    expect(auth?.method).toBe('PUT');
    expect(auth?.body).toMatchObject({
      sessionID: 'sid-edit',
      instanceID: 406810,
      configuration: { url: 'https://new.example.com', apikey: '********' },
    });
    expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({ newName: 'Renamed' });
  });

  it('edits a saved model: tests the change, then replaces only its entry', async () => {
    const configurationUrl = `${GATEWAY}/api/byo/product/llm-configurations/cfg-1`;
    const other = {
      id: 'e2',
      desiredModel: 'other',
      customerModel: 'gpt-4.1',
      connectorType: 'OpenAi',
      connectionId: 'conn-1',
    };
    routes.push(
      on('GET', configurationUrl, () => ({
        body: {
          id: 'cfg-1',
          name: 'agents-design-eval-deploy-1',
          folderId: 'old-folder',
          enabled: true,
          llmConfigurations: [
            {
              id: 'e1',
              desiredModel: 'my-gpt',
              customerModel: 'gpt-4o',
              connectorType: 'OpenAi',
              connectionId: 'conn-1',
              customFieldMappings: { stale: 'x' },
            },
            other,
          ],
        },
      })),
      on('POST', `${GATEWAY}/api/byo/product/llm-configurations/validate`, () => ({
        body: { renamed: { isAvailable: true, isCompatible: true } },
      })),
      on('PUT', configurationUrl, () => ({ body: {} }))
    );
    const client = api();

    const editing = await client.loadModel({ configurationId: 'cfg-1', name: 'my-gpt' });
    expect(editing).toEqual({
      ok: true,
      value: {
        configurationId: 'cfg-1',
        providerId: 'openai',
        connectionId: 'conn-1',
        modelId: 'gpt-4o',
        name: 'my-gpt',
        replaces: null,
        apiType: null,
      },
    });
    if (!editing.ok) return;

    const result = await client.testAndSave({
      providerId: 'openai',
      connection: { id: 'conn-2', providerId: 'openai', name: 'n', folderId: 'shared' },
      modelId: 'gpt-5.1',
      name: 'renamed',
      replaces: null,
      apiType: 'OpenAiChatCompletions',
      editing: editing.value,
    });

    expect(result.ok).toBe(true);
    // The model is listed where its configuration stays, not in the connection's folder.
    expect(result.ok && result.value.folderId).toBe('old-folder');
    const put = calls.find((c) => c.method === 'PUT');
    // The other model keeps the configuration in its folder, and the old mappings go.
    expect(put?.body).toEqual({
      id: 'cfg-1',
      name: 'agents-design-eval-deploy-1',
      folderId: 'old-folder',
      enabled: true,
      llmConfigurations: [
        {
          id: 'e1',
          desiredModel: 'renamed',
          defaultModel: 'renamed',
          customerModel: 'gpt-5.1',
          connectorType: 'OpenAi',
          connectionId: 'conn-2',
          apiFlavor: 'OpenAiChatCompletions',
          configurationType: 'SelfServe',
          organizationId: 'org-guid',
          tenantId: 'tenant-guid',
          customFieldMappings: null,
        },
        other,
      ],
    });
    expect(
      calls.filter((c) => c.method === 'POST' && c.url.endsWith('/llm-configurations'))
    ).toHaveLength(0);
  });
  describe('replacing UiPath models and API types, as AI Trust Layer offers them', () => {
    const loaded = async (products?: unknown) => {
      routeGatewayRules(products);
      routeNoFoldersOrConnections();
      const client = api();
      const context = await client.loadContext();
      return { client, context };
    };

    it('lists the feature models, marking those this feature replaced and retiring ones last', async () => {
      const { context } = await loaded();

      expect(context.ok).toBe(true);
      if (!context.ok) return;
      expect(context.value.replaceableModels).toEqual([
        { name: 'gpt-4.1-2025-04-14', replaced: false },
        { name: 'gpt-5-2025-08-07', replaced: true },
        { name: 'anthropic.claude-sonnet-4-6', replaced: false },
        { name: 'gpt-4o-2024-05-13', retiresOn: '2026-09-23', replaced: false },
      ]);
      expect(context.value.allowsNewNames).toBe(true);
      expect(context.value.reservedModelNames).toEqual([
        'gpt-4o-2024-05-13',
        'gpt-4.1-2025-04-14',
        'gpt-5-2025-08-07',
        'anthropic.claude-sonnet-4-6',
        'gemini-2.5-flash',
      ]);
    });

    it('offers the probes the provider carries for a name of your own, Chat Completions last', async () => {
      const { client } = await loaded();
      const values = (providerId: string) => client.apiTypes(providerId, null).map((t) => t.value);

      expect(client.apiTypes('openai', null)).toEqual([
        { value: 'OpenAiResponses', label: 'OpenAI Responses' },
        { value: 'OpenAiChatCompletions', label: 'OpenAI Chat Completions' },
      ]);
      expect(values('bedrock')).toEqual(['AwsBedrockInvoke', 'AwsBedrockConverse']);
      expect(values('anthropic')).toEqual(['AnthropicMessages']);
      expect(values('vertex')).toEqual(['GeminiGenerateContent']);
    });

    it("narrows a replacement to what the UiPath model supports and its provider's connector carries", async () => {
      const { client } = await loaded();
      const values = (providerId: string, replaces: string) =>
        client.apiTypes(providerId, replaces).map((t) => t.value);

      expect(values('openai', 'gpt-4.1-2025-04-14')).toEqual([
        'OpenAiResponses',
        'OpenAiChatCompletions',
      ]);
      expect(values('azure-openai', 'gpt-4o-2024-05-13')).toEqual(['OpenAiChatCompletions']);
      expect(values('bedrock', 'anthropic.claude-sonnet-4-6')).toEqual([
        'AwsBedrockInvoke',
        'AwsBedrockConverse',
      ]);
      expect(values('anthropic', 'anthropic.claude-sonnet-4-6')).toEqual(['AnthropicMessages']);
      // Chat Completions for Claude would need a custom AI gateway connector.
      expect(values('openai', 'anthropic.claude-sonnet-4-6')).toEqual([]);
    });

    it("prefers the UiPath model's own probes over the feature's", async () => {
      const { client } = await loaded(
        featureWith({
          models: [
            {
              model: 'gpt-4.1-2025-04-14',
              probes: [{ apiFlavor: 'OpenAiChatCompletions', probeId: 'chat' }],
            },
          ],
        })
      );

      expect(client.apiTypes('openai', 'gpt-4.1-2025-04-14').map((t) => t.value)).toEqual([
        'OpenAiChatCompletions',
      ]);
    });

    it('serves a replacement only through its own vendor when the feature takes no names of your own', async () => {
      const { client, context } = await loaded(
        featureWith({ modelsConfigurationOption: 'AnyModel' })
      );

      expect(context.ok && context.value.allowsNewNames).toBe(false);
      expect(client.apiTypes('azure-openai', 'gpt-4.1-2025-04-14').length).toBeGreaterThan(0);
      expect(client.apiTypes('anthropic', 'anthropic.claude-sonnet-4-6')).toEqual([]);
      expect(client.apiTypes('bedrock', 'anthropic.claude-sonnet-4-6').length).toBeGreaterThan(0);
    });

    it('refuses a feature whose models are configured together, or one that takes no own models', async () => {
      const all = await loaded(featureWith({ modelsConfigurationOption: 'AllModels' }));
      expect(all.context.ok).toBe(false);
      routes = [];
      const none = await loaded({ agents: {} });
      expect(none.context.ok).toBe(false);
      expect(!none.context.ok && none.context.failure.title).toBe(
        'This feature does not take models of your own'
      );
    });

    it('saves a replacement under the UiPath model name, tested in replace mode', async () => {
      const { client } = await loaded();
      routes.push(
        on('POST', `${GATEWAY}/api/byo/product/llm-configurations/validate`, () => ({
          body: { 'gpt-4.1-2025-04-14': { isAvailable: true, isCompatible: true } },
        })),
        on('POST', `${GATEWAY}/api/byo/product/llm-configurations`, () => ({ body: {} }))
      );

      const result = await client.testAndSave({
        providerId: 'azure-openai',
        connection: { id: 'conn-9', providerId: 'azure-openai', name: 'n', folderId: 'shared' },
        modelId: 'my-deployment',
        name: 'gpt-4.1-2025-04-14',
        replaces: 'gpt-4.1-2025-04-14',
        apiType: 'OpenAiResponses',
      });

      expect(result.ok).toBe(true);
      const validate = calls.find((c) => c.url.endsWith('/validate'));
      expect(validate?.headers['X-UiPath-LlmGateway-ByoConfigMode']).toBe('replace');
      const save = calls.find(
        (c) => c.method === 'POST' && c.url === `${GATEWAY}/api/byo/product/llm-configurations`
      );
      expect(save?.body).toMatchObject({
        llmConfigurations: [
          {
            desiredModel: 'gpt-4.1-2025-04-14',
            defaultModel: 'gpt-4.1-2025-04-14',
            customerModel: 'my-deployment',
            connectorType: 'AzureOpenAi',
            apiFlavor: 'OpenAiResponses',
            configurationType: 'SelfServe',
          },
        ],
      });
    });

    it('reads a saved replacement back as one, with its API type', async () => {
      const { client } = await loaded();
      routes.push(
        on('GET', `${GATEWAY}/api/byo/product/llm-configurations/cfg-r`, () => ({
          body: {
            id: 'cfg-r',
            folderId: 'shared',
            llmConfigurations: [
              {
                desiredModel: 'gpt-5-2025-08-07',
                defaultModel: 'gpt-5-2025-08-07',
                customerModel: 'gpt-5',
                connectorType: 'OpenAi',
                connectionId: 'conn-1',
                apiFlavor: 'OpenAiResponses',
                configurationType: 'SelfServe',
              },
            ],
          },
        }))
      );

      const editing = await client.loadModel({
        configurationId: 'cfg-r',
        name: 'gpt-5-2025-08-07',
      });

      expect(editing.ok && editing.value).toMatchObject({
        name: 'gpt-5-2025-08-07',
        replaces: 'gpt-5-2025-08-07',
        apiType: 'OpenAiResponses',
      });
    });

    it('reads a saved model named like an object property as a name of its own', async () => {
      const { client } = await loaded();
      routes.push(
        on('GET', `${GATEWAY}/api/byo/product/llm-configurations/cfg-c`, () => ({
          body: {
            id: 'cfg-c',
            folderId: 'shared',
            llmConfigurations: [
              {
                desiredModel: 'constructor',
                customerModel: 'gpt-5',
                connectorType: 'OpenAi',
                connectionId: 'conn-1',
              },
            ],
          },
        }))
      );

      const editing = await client.loadModel({ configurationId: 'cfg-c', name: 'constructor' });

      expect(editing.ok && editing.value).toMatchObject({ name: 'constructor', replaces: null });
    });
  });
});
