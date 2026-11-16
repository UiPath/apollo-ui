import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createCommunityByoApi } from './communityByoApi';
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

const AZURE_DEFINITION = {
  configuration: [
    {
      key: 'authentication.type',
      type: 'COMBO',
      defaultValue: 'customApiKey',
      options: [{ value: 'customApiKey' }, { value: 'oauth2ClientCredentials' }],
    },
    {
      key: 'api-key',
      name: 'API key',
      type: 'PASSWORD',
      required: true,
      configScreenType: 'pre',
      displayOrder: 1,
      groupBy: 'customApiKey',
      hintText: 'Key 1 <i>or</i> Key 2<br>from the portal',
    },
    {
      key: 'url',
      name: 'Url',
      type: 'TEXTFIELD_1000',
      required: false,
      configScreenType: 'pre-optional',
      displayOrder: 0,
      groupBy: '',
    },
    {
      key: 'apiVersion',
      name: 'API version',
      type: 'TEXTFIELD_1000',
      configScreenType: 'pre-optional',
      displayOrder: 2,
      defaultValue: '2023-10-01-preview',
      groupBy: '',
    },
    {
      key: 'subdomain',
      name: 'Azure OpenAI resource',
      configScreenType: 'none',
      hideFromConsole: true,
    },
    { key: 'internal', name: 'Internal', configScreenType: '' },
  ],
};

describe('createCommunityByoApi', () => {
  it('builds the form from the connector definition', async () => {
    routes.push(
      on('GET', `${TENANT}/elements_/v3/element/elements/uipath-microsoft-azureopenai`, () => ({
        body: AZURE_DEFINITION,
      }))
    );

    const result = await api().loadForm('azure-openai', null);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.authTypes).toEqual([
      { value: 'customApiKey', label: 'API key' },
      { value: 'oauth2ClientCredentials', label: 'Client credentials (Entra app)' },
    ]);
    expect(result.value.defaultAuthType).toBe('customApiKey');
    expect(
      result.value.fields.map((f) => [f.key, f.label, f.required, f.advanced, f.group])
    ).toEqual([
      ['url', 'Endpoint', false, false, null],
      ['api-key', 'API key', true, false, 'customApiKey'],
      ['apiVersion', 'API version', false, true, null],
    ]);
    expect(result.value.fields[1]?.secret).toBe(true);
    expect(result.value.fields[1]?.hint).toBe('Key 1 or Key 2 from the portal');
    expect(result.value.fields[2]?.defaultValue).toBe('2023-10-01-preview');
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

  it('tags the models that are not chat models', async () => {
    routes.push(
      on('POST', `${GATEWAY}/api/byom/available-models`, () => ({
        body: ['gpt-4o', 'text-embedding-3-large', 'whisper-1', 'gpt-5.1'],
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
    expect(result.value.compatible.map((m) => m.id)).toEqual(['gpt-5.1', 'gpt-4o']);
    expect(result.value.incompatible.map((m) => [m.id, m.short])).toEqual([
      ['whisper-1', 'Audio model'],
      ['text-embedding-3-large', 'Embedding model'],
    ]);
    expect(calls[0]?.body).toMatchObject({
      product: 'agents',
      connectorType: 'OpenAi',
      connectionId: 'c',
      organizationId: 'org-guid',
      tenantId: 'tenant-guid',
    });
  });

  it('retries the test while a new connection is not yet visible, then saves the configuration', async () => {
    let validations = 0;
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
      on('PATCH', `${TENANT}/connections_/api/v1/Connections/conn-1/rename`, () => ({ body: {} })),
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
    const client = api();
    const created = await client.connect({
      providerId: 'openai',
      form: { authTypes: [], defaultAuthType: null, fields: [] },
      authType: null,
      values: {},
      name: 'OpenAI – personal',
      folderId: 'folder-key',
    });
    if (!created.ok) throw new Error('connect failed');

    const result = await client.testAndSave({
      providerId: 'openai',
      connection: created.value,
      modelId: 'gpt-4o',
      name: 'my-gpt',
    });

    expect(result.ok).toBe(true);
    expect(validations).toBe(3);
    const validate = calls.find((c) => c.url.endsWith('/validate'));
    expect(validate?.headers['X-UiPath-LlmGateway-ByoConfigMode']).toBe('add');
    const save = calls.find((c) => c.url === `${GATEWAY}/api/byo/product/llm-configurations`);
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
          customerModel: 'gpt-4o',
          connectorType: 'OpenAi',
          connectionId: 'conn-1',
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
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure.title).toBe('The test call failed: MISSING_TOOL_CALL');
    expect(result.failure.message).toBe('no tools');
    expect(calls.filter((c) => c.url.endsWith('/llm-configurations'))).toHaveLength(0);
  });

  it('lists personal workspace first and keeps only the BYO connectors', async () => {
    routes.push(
      on(
        'GET',
        `${TENANT}/orchestrator_/api/FoldersNavigation/GetAllFoldersForCurrentUser?take=500&skip=0`,
        () => ({
          body: {
            PageItems: [
              { Key: 'shared', DisplayName: 'Finance', FullyQualifiedName: 'Shared/Finance' },
              { Key: 'me', DisplayName: 'My Workspace', IsPersonal: true },
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
              folder: { key: 'me' },
            },
            {
              id: 'c2',
              name: 'Slack',
              connector: { key: 'uipath-salesforce-slack' },
              folder: { key: 'me' },
            },
          ],
        })
      )
    );

    const result = await api().loadContext();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.folders).toEqual([
      { id: 'me', label: 'My Workspace' },
      { id: 'shared', label: 'Shared › Finance' },
    ]);
    expect(result.value.defaultFolderId).toBe('me');
    expect(result.value.connections).toEqual([
      { id: 'c1', providerId: 'openai', name: 'My OpenAI', folderId: 'me' },
    ]);
    expect(result.value.takenModelNames).toEqual(['gpt-4o']);
  });

  it('edits a saved connection through its own session, keeping a secret left blank', async () => {
    let sessions = 0;
    routes.push(
      on('GET', `${TENANT}/elements_/v3/element/elements/uipath-openai-openaiv1compliant`, () => ({
        body: {
          configuration: [
            { key: 'url', name: 'Url', required: true, configScreenType: 'pre' },
            {
              key: 'apikey',
              name: 'Key',
              type: 'PASSWORD',
              required: true,
              configScreenType: 'pre',
            },
          ],
        },
      })),
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
      },
    });
    if (!editing.ok) return;

    const result = await client.testAndSave({
      providerId: 'openai',
      connection: { id: 'conn-2', providerId: 'openai', name: 'n', folderId: 'me' },
      modelId: 'gpt-5.1',
      name: 'renamed',
      editing: editing.value,
    });

    expect(result.ok).toBe(true);
    const put = calls.find((c) => c.method === 'PUT');
    expect(put?.body).toEqual({
      id: 'cfg-1',
      name: 'agents-design-eval-deploy-1',
      folderId: 'me',
      enabled: true,
      llmConfigurations: [
        {
          id: 'e1',
          desiredModel: 'renamed',
          customerModel: 'gpt-5.1',
          connectorType: 'OpenAi',
          connectionId: 'conn-2',
          organizationId: 'org-guid',
          tenantId: 'tenant-guid',
        },
        other,
      ],
    });
    expect(
      calls.filter((c) => c.method === 'POST' && c.url.endsWith('/llm-configurations'))
    ).toHaveLength(0);
  });
});
