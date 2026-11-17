import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ModelPicker } from './ModelPicker';
import type { DiscoveryModel } from './types';
import type { PlatformRequestContext } from './usePlatformAccess';

const CTX: PlatformRequestContext = {
  token: 'test-token',
  baseUrl: 'https://cloud.local/acme',
  tenantName: 'DefaultTenant',
  organizationId: 'org-guid',
  tenantId: 'tenant-guid',
  requestingProduct: 'agents',
  requestingFeature: 'design-eval-deploy',
};
const TENANT = 'https://cloud.local/acme/DefaultTenant';
const GATEWAY = 'https://cloud.local/org-guid/tenant-guid/llmgateway_';

const RESPONSES: Record<string, unknown> = {
  [`GET ${TENANT}/orchestrator_/api/FoldersNavigation/GetAllFoldersForCurrentUser?take=500&skip=0`]:
    {
      PageItems: [{ Key: 'me', DisplayName: 'My Workspace', IsPersonal: true }],
    },
  [`GET ${TENANT}/connections_/api/v1/Connections?allFolders=true&folderDefaults=true`]: [
    {
      id: 'conn-1',
      name: 'My OpenAI',
      connector: { key: 'uipath-openai-openai' },
      folder: { key: 'me' },
    },
  ],
  [`POST ${GATEWAY}/api/byom/available-models`]: ['gpt-4o'],
  [`POST ${GATEWAY}/api/byo/product/llm-configurations/validate`]: {
    'my-gpt': { isAvailable: true, isCompatible: true },
  },
  [`POST ${GATEWAY}/api/byo/product/llm-configurations`]: { id: 'cfg-1' },
  [`GET ${GATEWAY}/api/byo/product/llm-configurations/cfg-1`]: {
    id: 'cfg-1',
    folderId: 'me',
    llmConfigurations: [
      {
        id: 'e1',
        desiredModel: 'my-gpt',
        customerModel: 'gpt-4o',
        connectorType: 'OpenAi',
        connectionId: 'conn-1',
      },
    ],
  },
  [`PUT ${GATEWAY}/api/byo/product/llm-configurations/cfg-1`]: {},
  [`GET ${GATEWAY}/api/byo/product/llm-configurations/cfg-2`]: {
    id: 'cfg-2',
    folderId: 'me',
    llmConfigurations: [
      {
        id: 'e2',
        desiredModel: 'my-gpt',
        customerModel: 'gpt-4o',
        connectorType: 'OpenAi',
        connectionId: 'conn-1',
        defaultModel: 'gpt-4.1',
      },
    ],
  },
  [`PUT ${GATEWAY}/api/byo/product/llm-configurations/cfg-2`]: {},
};

const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
  const key = `${init.method ?? 'GET'} ${url}`;
  if (!(key in RESPONSES)) throw new Error(`Unexpected ${key}`);
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve(JSON.stringify(RESPONSES[key])),
    json: () => Promise.resolve(RESPONSES[key]),
  } as unknown as Response;
});

beforeEach(() => {
  fetchMock.mockClear();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

const HOSTED: DiscoveryModel = {
  modelId: 'gpt-4.1',
  modelName: 'gpt-4.1',
  vendor: 'OpenAi',
  modelSubscriptionType: 'UiPathOwned',
};
const ADDED: DiscoveryModel = {
  modelId: 'byo-my-gpt',
  modelName: 'my-gpt',
  vendor: 'OpenAi',
  modelSubscriptionType: 'BYOMAdded',
  byomDetails: { integrationServiceConnectionId: 'conn-1', byoConfigurationId: 'cfg-1' },
};

const REPLACING: DiscoveryModel = {
  ...ADDED,
  modelSubscriptionType: 'BYOMReplacedAlternative',
  byomDetails: { integrationServiceConnectionId: 'conn-1', byoConfigurationId: 'cfg-2' },
};

/** Fills the open dialog with gpt-4o through the saved "My OpenAI" connection, as `my-gpt`. */
const addMyGptThroughMyOpenAi = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole('combobox', { name: 'Provider' }));
  await user.click(await screen.findByRole('option', { name: 'OpenAI' }));
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Model' })).toBeEnabled());
  await user.click(screen.getByRole('combobox', { name: 'Model' }));
  await user.click(await screen.findByRole('option', { name: 'gpt-4o' }));
  const name = screen.getByRole('textbox', { name: 'Name in your model list' });
  await user.clear(name);
  await user.type(name, 'my-gpt');
  await user.click(screen.getByRole('button', { name: 'Test and add' }));
};

describe('<ModelPicker isCommunity>', () => {
  it('adds a model in the dialog, lets the host refetch, then selects it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onUseCustomModel = vi.fn();
    let rerenderWith: (models: DiscoveryModel[]) => void = () => {};
    const onCustomModelSaved = vi.fn(async () => rerenderWith([HOSTED, ADDED]));
    const notify = vi.fn();
    const picker = (models: DiscoveryModel[]) => (
      <ModelPicker
        models={models}
        value={null}
        onChange={onChange}
        canManageByo
        isCommunity
        requestContext={CTX}
        onCustomModelSaved={onCustomModelSaved}
        notify={notify}
      />
    );
    const { rerender } = render(picker([HOSTED]));
    rerenderWith = (models) => rerender(picker(models));

    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(await screen.findByText(/use custom model/i));
    expect(await screen.findByRole('dialog', { name: 'Use your own model' })).toBeInTheDocument();
    expect(onUseCustomModel).not.toHaveBeenCalled();

    await addMyGptThroughMyOpenAi(user);

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(ADDED));
    expect(notify).toHaveBeenCalledWith('my-gpt added to your models', 'success');
    expect(onCustomModelSaved).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'my-gpt', modelId: 'gpt-4o', connectionId: 'conn-1' })
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Use your own model' })).toBeNull()
    );
  });

  it("keeps the user's own pick made while the catalog refreshes after a save", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    let finishRefresh: () => void = () => {};
    const onCustomModelSaved = vi.fn(
      () => new Promise<void>((resolve) => (finishRefresh = resolve))
    );
    const picker = (models: DiscoveryModel[]) => (
      <ModelPicker
        models={models}
        value={null}
        onChange={onChange}
        canManageByo
        isCommunity
        requestContext={CTX}
        onCustomModelSaved={onCustomModelSaved}
      />
    );
    const { rerender } = render(picker([HOSTED]));

    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(await screen.findByText(/use custom model/i));
    await addMyGptThroughMyOpenAi(user);
    await waitFor(() => expect(onCustomModelSaved).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Use your own model' })).toBeNull()
    );

    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(await screen.findByRole('option', { name: /gpt-4\.1/ }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ modelName: 'gpt-4.1' }));

    rerender(picker([HOSTED, ADDED]));
    await act(async () => {
      finishRefresh();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ modelName: 'my-gpt' }));
  });

  it("shows the saved model's folder when another folder is shown", async () => {
    const user = userEvent.setup();
    const onFolderChange = vi.fn();
    render(
      <ModelPicker
        models={[HOSTED]}
        value={null}
        onChange={() => {}}
        canManageByo
        isCommunity
        requestContext={CTX}
        folder="shared-folder"
        onFolderChange={onFolderChange}
        onCustomModelSaved={() => {}}
      />
    );

    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(await screen.findByText(/use custom model/i));
    await addMyGptThroughMyOpenAi(user);

    await waitFor(() => expect(onFolderChange).toHaveBeenCalledWith('me'));
  });

  it("edits a BYO row's model in the same dialog", async () => {
    const user = userEvent.setup();
    const onCustomModelSaved = vi.fn();
    const notify = vi.fn();
    render(
      <ModelPicker
        models={[HOSTED, ADDED]}
        value={null}
        onChange={() => {}}
        canManageByo
        isCommunity
        requestContext={CTX}
        onCustomModelSaved={onCustomModelSaved}
        notify={notify}
      />
    );

    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(await screen.findByRole('button', { name: 'Edit configuration' }));
    expect(await screen.findByRole('dialog', { name: 'Edit your model' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Name in your model list' })).toHaveValue('my-gpt')
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Test and save' })).toBeEnabled()
    );
    await user.click(screen.getByRole('button', { name: 'Test and save' }));

    await waitFor(() => expect(onCustomModelSaved).toHaveBeenCalled());
    expect(notify).toHaveBeenCalledWith('Changes to my-gpt saved', 'success');
    const keys = fetchMock.mock.calls.map(([url, init]) => `${init?.method ?? 'GET'} ${url}`);
    expect(keys).toContain(`PUT ${GATEWAY}/api/byo/product/llm-configurations/cfg-1`);
    expect(keys).not.toContain(`POST ${GATEWAY}/api/byo/product/llm-configurations`);
  });

  it('edits a model that replaces a UiPath model in the same dialog, keeping what it replaces', async () => {
    const user = userEvent.setup();
    const onCustomModelSaved = vi.fn();
    render(
      <ModelPicker
        models={[HOSTED, REPLACING]}
        value={null}
        onChange={() => {}}
        canManageByo
        isCommunity
        requestContext={CTX}
        onCustomModelSaved={onCustomModelSaved}
      />
    );

    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(await screen.findByRole('button', { name: 'Edit configuration' }));
    expect(await screen.findByRole('dialog', { name: 'Edit your model' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Test and save' })).toBeEnabled()
    );
    await user.click(screen.getByRole('button', { name: 'Test and save' }));

    await waitFor(() => expect(onCustomModelSaved).toHaveBeenCalled());
    const put = fetchMock.mock.calls.find(
      ([url, init]) => init?.method === 'PUT' && url.endsWith('/llm-configurations/cfg-2')
    );
    const body = JSON.parse(String(put?.[1]?.body));
    expect(body.llmConfigurations[0]).toMatchObject({
      desiredModel: 'my-gpt',
      defaultModel: 'gpt-4.1',
    });
  });

  it('keeps the AI Trust Layer navigation when isCommunity is off', async () => {
    const user = userEvent.setup();
    const onUseCustomModel = vi.fn();
    render(
      <ModelPicker
        models={[HOSTED]}
        value={null}
        onChange={() => {}}
        canManageByo
        requestContext={CTX}
        onUseCustomModel={onUseCustomModel}
      />
    );

    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(await screen.findByText(/use custom model/i));

    expect(onUseCustomModel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Use your own model' })).toBeNull();
  });
});
