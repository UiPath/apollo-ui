import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ByoModelDialog } from './byo-model-dialog';
import type {
  ByoConnection,
  ByoConnectionForm,
  ByoDialogContext,
  ByoModelDialogApi,
  ByoModelToEdit,
  ByoProviderModels,
  ByoResult,
  ByoSavedModel,
  ByoSaveRequest,
} from './types';

const SAVED: ByoConnection = { id: 'c1', providerId: 'openai', name: 'My OpenAI', folderId: 'me' };

const CONTEXT: ByoDialogContext = {
  providers: [
    { id: 'openai', name: 'OpenAI' },
    { id: 'azure', name: 'Azure OpenAI' },
  ],
  connections: [SAVED],
  folders: [
    { id: 'me', label: 'My Workspace' },
    { id: 'shared', label: 'Shared' },
  ],
  defaultFolderId: 'me',
  takenModelNames: ['Taken'],
  replaceableModels: [],
  allowsNewNames: true,
  reservedModelNames: [],
};

const SAVED_MODEL: ByoModelToEdit = {
  configurationId: 'cfg1',
  providerId: 'openai',
  connectionId: 'c1',
  modelId: 'gpt-4o',
  name: 'Taken',
  replaces: null,
  apiType: 'OpenAiResponses',
};

const AZURE_FORM: ByoConnectionForm = {
  authTypes: [],
  defaultAuthType: null,
  fields: [
    {
      key: 'url',
      label: 'Endpoint',
      secret: false,
      required: true,
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
      group: null,
      defaultValue: '',
      placeholder: '',
      hint: 'From the portal',
    },
    {
      key: 'apiVersion',
      label: 'API version',
      secret: false,
      required: false,
      advanced: true,
      group: null,
      defaultValue: '2023-10-01',
      placeholder: '',
      hint: '',
    },
  ],
};

function fakeApi(overrides: Partial<ByoModelDialogApi> = {}): ByoModelDialogApi {
  return {
    loadContext: vi.fn(async () => ({ ok: true as const, value: CONTEXT })),
    loadModel: vi.fn(async () => ({ ok: true as const, value: SAVED_MODEL })),
    loadForm: vi.fn(async () => ({ ok: true as const, value: AZURE_FORM })),
    loadConnectionValues: vi.fn(async () => ({
      ok: true as const,
      value: { authType: null, values: { url: 'https://old.example.com' } },
    })),
    connect: vi.fn(async (r) => ({
      ok: true as const,
      value: { id: 'new', providerId: r.providerId, name: r.name, folderId: r.folderId },
    })),
    listModels: vi.fn(async () => ({
      ok: true as const,
      value: {
        compatible: [{ id: 'gpt-5.1' }, { id: 'gpt-4o' }],
        incompatible: [
          { id: 'whisper-1', short: 'Audio model', reason: 'Audio model: not a chat model.' },
        ],
      },
    })),
    apiTypes: vi.fn(() => [{ value: 'OpenAiResponses', label: 'OpenAI Responses' }]),
    testAndSave: vi.fn(async (r) => ({
      ok: true as const,
      value: {
        name: r.name,
        modelId: r.modelId,
        connectionId: r.connection.id,
        folderId: r.connection.folderId,
        latencyMs: 1200,
      },
    })),
    ...overrides,
  };
}

async function pick(user: ReturnType<typeof userEvent.setup>, combobox: string, option: string) {
  await user.click(await screen.findByRole('combobox', { name: combobox }));
  await user.click(await screen.findByRole('option', { name: option }));
}

async function addCustomAlias(user: ReturnType<typeof userEvent.setup>, alias: string) {
  await user.click(await screen.findByRole('combobox', { name: 'Model alias' }));
  await user.click(await screen.findByRole('option', { name: 'Add custom alias' }));
  await user.type(screen.getByRole('textbox', { name: 'Enter a custom alias' }), alias);
  await user.click(screen.getByRole('button', { name: 'Add' }));
}

/** Names the model `alias`, then picks the provider: the first two steps. */
async function start(user: ReturnType<typeof userEvent.setup>, provider: string, alias = 'gpt-4o') {
  await addCustomAlias(user, alias);
  await pick(user, 'Provider', provider);
}

describe('ByoModelDialog', () => {
  it('adds a model through a saved connection', async () => {
    const user = userEvent.setup();
    const api = fakeApi();
    const onSaved = vi.fn();
    const onOpenChange = vi.fn();
    render(<ByoModelDialog open onOpenChange={onOpenChange} api={api} onSaved={onSaved} />);

    await start(user, 'OpenAI', 'my-gpt');
    expect(screen.getByRole('combobox', { name: 'Connection' })).toHaveTextContent(
      'Saved connection: My OpenAI · My Workspace'
    );
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Your model' })).toBeEnabled());
    await pick(user, 'Your model', 'gpt-4o');
    await user.click(screen.getByRole('button', { name: 'Test and add' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.testAndSave).toHaveBeenCalledWith({
      providerId: 'openai',
      connection: SAVED,
      modelId: 'gpt-4o',
      name: 'my-gpt',
      replaces: null,
      apiType: 'OpenAiResponses',
      editing: undefined,
    });
    expect(onSaved.mock.calls[0]?.[0]).toMatchObject({ name: 'my-gpt', connectionId: 'c1' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('creates a connection inline from the form the API returns', async () => {
    const user = userEvent.setup();
    const api = fakeApi({
      listModels: vi.fn(async () => ({
        ok: true as const,
        value: { compatible: [], incompatible: [] },
      })),
    });
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onSaved={vi.fn()} />);

    await start(user, 'Azure OpenAI');
    const connect = await screen.findByRole('button', { name: 'Connect' });
    expect(connect).toBeDisabled();
    expect(screen.getByLabelText(/Endpoint/)).toBeRequired();
    await user.type(screen.getByLabelText(/Endpoint/), 'https://res.openai.azure.com');
    await user.type(screen.getByLabelText(/API key/), 'secret');
    expect(screen.getByLabelText(/API key/)).toHaveAttribute('type', 'password');
    expect(screen.getByRole('textbox', { name: 'Connection name' })).toHaveValue('Azure OpenAI');
    await user.click(connect);

    await screen.findByText('Connected. New connection created in My Workspace.');
    expect(api.connect).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: 'azure',
        values: {
          url: 'https://res.openai.azure.com',
          'api-key': 'secret',
          apiVersion: '2023-10-01',
        },
        name: 'Azure OpenAI',
        folderId: 'me',
      })
    );
    // Azure lists no models, so the model id is typed.
    await user.type(await screen.findByRole('textbox', { name: 'Model id' }), 'my-deployment');
    expect(screen.getByRole('button', { name: 'Test and add' })).toBeEnabled();
  });

  it("shows the provider's refusal and keeps the form editable", async () => {
    const user = userEvent.setup();
    const api = fakeApi({
      connect: vi.fn(async () => ({
        ok: false as const,
        failure: {
          title: 'Azure OpenAI refused the connection (HTTP 401)',
          message: 'Access denied',
          detail: '{"code":401}',
        },
      })),
    });
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onSaved={vi.fn()} />);

    await start(user, 'Azure OpenAI');
    await user.type(await screen.findByLabelText(/Endpoint/), 'https://res.openai.azure.com');
    await user.type(screen.getByLabelText(/API key/), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    expect(
      await screen.findByText('Azure OpenAI refused the connection (HTTP 401)')
    ).toBeInTheDocument();
    // With a raw response at hand, only the raw response is shown, on request.
    expect(screen.queryByText('Access denied')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Show LLM response' }));
    expect(screen.getByText('{"code":401}')).toBeInTheDocument();
    expect(screen.getByLabelText(/API key/)).toBeEnabled();
  });

  it('refuses a name already in the model list', async () => {
    const user = userEvent.setup();
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={fakeApi()} onSaved={vi.fn()} />);

    await addCustomAlias(user, 'taken');

    expect(
      screen.getByText('"taken" is already in your model list. Pick another name.')
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Provider' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Test and add' })).toBeDisabled();
  });

  it('opens the custom alias editor from the keyboard', async () => {
    const user = userEvent.setup();
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={fakeApi()} onSaved={vi.fn()} />);

    await addCustomAlias(user, 'mine');
    await user.click(screen.getByRole('combobox', { name: 'Model alias' }));
    screen.getByRole('button', { name: 'Edit custom alias' }).focus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('textbox', { name: 'Enter a custom alias' })).toHaveValue('mine');
  });

  it('changes a custom alias in place', async () => {
    const user = userEvent.setup();
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={fakeApi()} onSaved={vi.fn()} />);

    await addCustomAlias(user, 'mine');
    await user.click(screen.getByRole('combobox', { name: 'Model alias' }));
    await user.click(await screen.findByRole('button', { name: 'Edit custom alias' }));
    const input = screen.getByRole('textbox', { name: 'Enter a custom alias' });
    expect(input).toHaveValue('mine');
    await user.clear(input);
    await user.type(input, 'mine-2{Enter}');

    expect(screen.getByRole('combobox', { name: 'Model alias' })).toHaveTextContent('mine-2');
  });

  it('shows a failed test without closing', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const api = fakeApi({
      testAndSave: vi.fn(async () => ({
        ok: false as const,
        failure: { title: 'The test call failed: MISSING_TOOL_CALL' },
      })),
    });
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onSaved={onSaved} />);

    await start(user, 'OpenAI');
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Your model' })).toBeEnabled());
    await pick(user, 'Your model', 'gpt-4o');
    await user.click(screen.getByRole('button', { name: 'Test and add' }));

    expect(await screen.findByText('The test call failed: MISSING_TOOL_CALL')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('hides a dismissed failure until the next one', async () => {
    const user = userEvent.setup();
    const api = fakeApi({
      testAndSave: vi.fn(async () => ({
        ok: false as const,
        failure: { title: 'The test call failed: MISSING_TOOL_CALL' },
      })),
    });
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onSaved={vi.fn()} />);

    await start(user, 'OpenAI');
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Your model' })).toBeEnabled());
    await pick(user, 'Your model', 'gpt-4o');
    const save = screen.getByRole('button', { name: 'Test and add' });
    await user.click(save);
    await screen.findByText('The test call failed: MISSING_TOOL_CALL');
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByText('The test call failed: MISSING_TOOL_CALL')).not.toBeInTheDocument();
    await user.click(save);
    expect(await screen.findByText('The test call failed: MISSING_TOOL_CALL')).toBeInTheDocument();
  });

  it('shows a newer failure after an older one was dismissed', async () => {
    const user = userEvent.setup();
    const api = fakeApi({
      loadConnectionValues: vi.fn(async () => ({
        ok: false as const,
        failure: { title: 'Could not read the connection settings' },
      })),
      testAndSave: vi.fn(async () => ({
        ok: false as const,
        failure: { title: 'The test call failed: MISSING_TOOL_CALL' },
      })),
    });
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onSaved={vi.fn()} />);

    await start(user, 'OpenAI');
    await user.click(await screen.findByRole('button', { name: 'Edit connection' }));
    await screen.findByText('Could not read the connection settings');
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Your model' })).toBeEnabled());
    await pick(user, 'Your model', 'gpt-4o');
    await user.click(screen.getByRole('button', { name: 'Test and add' }));

    expect(await screen.findByText('The test call failed: MISSING_TOOL_CALL')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));

    // Neither failure comes back once both were dismissed.
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
    expect(screen.queryByText('Could not read the connection settings')).not.toBeInTheDocument();
  });

  it('edits a saved model, keeping its own name', async () => {
    const user = userEvent.setup();
    const api = fakeApi();
    const onSaved = vi.fn();
    render(
      <ByoModelDialog
        open
        onOpenChange={vi.fn()}
        api={api}
        onSaved={onSaved}
        editing={{ configurationId: 'cfg1', name: 'Taken' }}
      />
    );

    expect(await screen.findByRole('heading', { name: 'Edit your model' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Your model' })).toBeEnabled());
    expect(api.loadModel).toHaveBeenCalledWith({ configurationId: 'cfg1', name: 'Taken' });
    expect(screen.getByRole('combobox', { name: 'Connection' })).toHaveTextContent(
      'Saved connection: My OpenAI · My Workspace'
    );
    expect(screen.getByRole('combobox', { name: 'Model alias' })).toHaveTextContent('Taken');

    await pick(user, 'Your model', 'gpt-5.1');
    expect(screen.getByRole('combobox', { name: 'Model alias' })).toHaveTextContent('Taken');
    await user.click(screen.getByRole('button', { name: 'Test and save' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.testAndSave).toHaveBeenCalledWith({
      providerId: 'openai',
      connection: SAVED,
      modelId: 'gpt-5.1',
      name: 'Taken',
      replaces: null,
      apiType: 'OpenAiResponses',
      editing: SAVED_MODEL,
    });
  });

  it("edits a model on the provider's first connection when its own is not listed, picking its model again", async () => {
    const api = fakeApi({
      loadModel: vi.fn(async () => ({
        ok: true as const,
        value: { ...SAVED_MODEL, connectionId: 'in-a-personal-workspace' },
      })),
    });
    render(
      <ByoModelDialog
        open
        onOpenChange={vi.fn()}
        api={api}
        onSaved={vi.fn()}
        editing={{ configurationId: 'cfg1', name: 'Taken' }}
      />
    );

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Connection' })).toHaveTextContent(
        'Saved connection: My OpenAI · My Workspace'
      )
    );
    expect(api.listModels).toHaveBeenCalledWith('openai', SAVED);
    // Its model is picked again on that connection, never carried over from another account.
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Your model' })).not.toHaveTextContent('gpt-4o')
    );
    expect(screen.getByRole('button', { name: 'Test and save' })).toBeDisabled();
  });

  it('edits a saved connection in place', async () => {
    const user = userEvent.setup();
    const api = fakeApi({
      connect: vi.fn(async (r) => ({
        ok: true as const,
        value: { ...SAVED, name: r.name },
      })),
    });
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onSaved={vi.fn()} />);

    await start(user, 'OpenAI');
    await user.click(await screen.findByRole('button', { name: 'Edit connection' }));

    const endpoint = await screen.findByLabelText(/Endpoint/);
    await waitFor(() => expect(endpoint).toHaveValue('https://old.example.com'));
    expect(api.loadConnectionValues).toHaveBeenCalledWith('openai', SAVED);
    // The secret may stay blank, and the connection cannot move folders.
    expect(screen.getByText('Leave blank to keep the current value.')).toBeInTheDocument();
    expect(screen.getByLabelText(/API key/)).not.toBeRequired();
    expect(screen.getByRole('combobox', { name: 'Folder' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Connection name' })).toHaveValue('My OpenAI');

    await user.clear(endpoint);
    await user.type(endpoint, 'https://new.example.com');
    await user.click(screen.getByRole('button', { name: 'Save connection' }));

    await screen.findByText('Connection updated.');
    expect(api.connect).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: 'openai',
        values: { url: 'https://new.example.com', apiVersion: '2023-10-01' },
        name: 'My OpenAI',
        folderId: 'me',
        existing: SAVED,
      })
    );
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Your model' })).toBeEnabled());
  });

  it('stops editing a connection whose settings could not be read, so a save cannot clear them', async () => {
    const user = userEvent.setup();
    const api = fakeApi({
      loadConnectionValues: vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          failure: { title: 'Could not read the connection settings' },
        })
        .mockResolvedValueOnce({
          ok: true,
          value: { authType: null, values: { url: 'https://old.example.com' } },
        }),
    });
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onSaved={vi.fn()} />);

    await start(user, 'OpenAI');
    await user.click(await screen.findByRole('button', { name: 'Edit connection' }));

    expect(await screen.findByText('Could not read the connection settings')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save connection' })).toBeNull();
    expect(api.connect).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Edit connection' }));
    await waitFor(() =>
      expect(screen.getByLabelText(/Endpoint/)).toHaveValue('https://old.example.com')
    );
    expect(api.loadConnectionValues).toHaveBeenCalledTimes(2);
  });

  it('groups the models only when some are marked unusable', async () => {
    const user = userEvent.setup();
    const plain = { compatible: [{ id: 'gpt-5.1' }, { id: 'gpt-4o' }], incompatible: [] };
    const api = fakeApi({ listModels: vi.fn(async () => ({ ok: true as const, value: plain })) });
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onSaved={vi.fn()} />);

    await start(user, 'OpenAI');
    const trigger = screen.getByRole('combobox', { name: 'Your model' });
    await waitFor(() => expect(trigger).toBeEnabled());
    expect(trigger).toHaveTextContent('Select one of 2 models');
    await user.click(trigger);
    expect(await screen.findByRole('option', { name: 'gpt-4o' })).toBeInTheDocument();
    expect(screen.queryByText('Can be used · 2')).not.toBeInTheDocument();
    expect(screen.queryByText(/Not supported/)).not.toBeInTheDocument();
  });

  it('shows the unusable models in their own group, with the usable ones under a heading', async () => {
    const user = userEvent.setup();
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={fakeApi()} onSaved={vi.fn()} />);

    await start(user, 'OpenAI');
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Your model' })).toBeEnabled());
    await user.click(screen.getByRole('combobox', { name: 'Your model' }));
    expect(await screen.findByText('Can be used · 2')).toBeInTheDocument();
    expect(screen.getByText('Not supported · 1')).toBeInTheDocument();
  });

  it('loads the model list again when a connection edit fails while the list was loading', async () => {
    const user = userEvent.setup();
    let finishFirstList: () => void = () => {};
    const models = { compatible: [{ id: 'gpt-5.1' }], incompatible: [] };
    const api = fakeApi({
      listModels: vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<ByoResult<ByoProviderModels>>((resolve) => {
              finishFirstList = () => resolve({ ok: true, value: models });
            })
        )
        .mockResolvedValue({ ok: true, value: models }),
      loadConnectionValues: vi.fn(async () => ({
        ok: false as const,
        failure: { title: 'Could not read the connection settings' },
      })),
    });
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onSaved={vi.fn()} />);

    await start(user, 'OpenAI');
    await user.click(await screen.findByRole('button', { name: 'Edit connection' }));
    await screen.findByText('Could not read the connection settings');
    finishFirstList();

    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Your model' })).toBeEnabled());
    expect(api.listModels).toHaveBeenCalledTimes(2);
  });

  it('asks for the secrets of an authentication type the edited connection does not use', async () => {
    const user = userEvent.setup();
    const secret = (key: string, label: string, group: string) => ({
      key,
      label,
      secret: true,
      required: true,
      advanced: false,
      group,
      defaultValue: '',
      placeholder: '',
      hint: '',
    });
    const form: ByoConnectionForm = {
      authTypes: [
        { value: 'key', label: 'API key' },
        { value: 'app', label: 'Client credentials' },
      ],
      defaultAuthType: 'key',
      fields: [
        secret('api-key', 'API key', 'key'),
        secret('client-secret', 'Client secret', 'app'),
      ],
    };
    const api = fakeApi({
      loadForm: vi.fn(async () => ({ ok: true as const, value: form })),
      loadConnectionValues: vi.fn(async () => ({
        ok: true as const,
        value: { authType: 'key', values: {} },
      })),
    });
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onSaved={vi.fn()} />);

    await start(user, 'OpenAI');
    await user.click(await screen.findByRole('button', { name: 'Edit connection' }));
    const save = await screen.findByRole('button', { name: 'Save connection' });
    // The connection holds its API key, so it may stay blank.
    await waitFor(() => expect(save).toBeEnabled());
    expect(screen.getByLabelText(/API key/)).not.toBeRequired();

    await pick(user, 'Authentication', 'Client credentials');
    expect(screen.getByLabelText(/Client secret/)).toBeRequired();
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText(/Client secret/), 'shh');
    expect(save).toBeEnabled();
  });

  it("shows why the provider's models could not be listed", async () => {
    const user = userEvent.setup();
    const api = fakeApi({
      listModels: vi.fn(async () => ({
        ok: false as const,
        failure: { title: 'Could not list your OpenAI models (HTTP 401)', message: 'Invalid key' },
      })),
    });
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onSaved={vi.fn()} />);

    await start(user, 'OpenAI');

    expect(
      await screen.findByText('Could not list your OpenAI models (HTTP 401)')
    ).toBeInTheDocument();
    expect(screen.getByText('Invalid key')).toBeInTheDocument();
  });

  it('keeps loading the form when the connection changes meanwhile', async () => {
    const user = userEvent.setup();
    let finishForm: () => void = () => {};
    const api = fakeApi({
      loadForm: vi.fn(
        () =>
          new Promise<ByoResult<ByoConnectionForm>>((resolve) => {
            finishForm = () => resolve({ ok: true as const, value: AZURE_FORM });
          })
      ),
    });
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onSaved={vi.fn()} />);

    await start(user, 'OpenAI');
    await pick(user, 'Connection', 'New connection…');
    finishForm();

    expect(await screen.findByLabelText(/Endpoint/)).toBeInTheDocument();
  });

  it('closes once the model is saved, without waiting for the host', async () => {
    const user = userEvent.setup();
    // The host's refresh never settles, as a slow catalog reload would.
    const onSaved = vi.fn(() => new Promise<void>(() => {}));
    const onOpenChange = vi.fn();
    render(<ByoModelDialog open onOpenChange={onOpenChange} api={fakeApi()} onSaved={onSaved} />);

    await start(user, 'OpenAI');
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Your model' })).toBeEnabled());
    await pick(user, 'Your model', 'gpt-4o');
    await user.click(screen.getByRole('button', { name: 'Test and add' }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(onSaved).toHaveBeenCalled();
  });

  it('still reports a model saved after the dialog was closed', async () => {
    const user = userEvent.setup();
    let finishTest: () => void = () => {};
    const onSaved = vi.fn();
    const api = fakeApi({
      testAndSave: vi.fn(
        (r: ByoSaveRequest) =>
          new Promise<ByoResult<ByoSavedModel>>((resolve) => {
            finishTest = () =>
              resolve({
                ok: true as const,
                value: {
                  name: r.name,
                  modelId: r.modelId,
                  connectionId: r.connection.id,
                  folderId: r.connection.folderId,
                  latencyMs: 1,
                },
              });
          })
      ),
    });
    const { rerender } = render(
      <ByoModelDialog open onOpenChange={vi.fn()} api={api} onSaved={onSaved} />
    );

    await start(user, 'OpenAI');
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Your model' })).toBeEnabled());
    await pick(user, 'Your model', 'gpt-4o');
    await user.click(screen.getByRole('button', { name: 'Test and add' }));
    rerender(<ByoModelDialog open={false} onOpenChange={vi.fn()} api={api} onSaved={onSaved} />);
    finishTest();

    await waitFor(() =>
      expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ name: 'gpt-4o' }))
    );
  });
  describe('model alias and API type', () => {
    const REPLACEABLE: ByoDialogContext = {
      ...CONTEXT,
      replaceableModels: [
        { name: 'gpt-4.1', replaced: false },
        { name: 'gpt-4o-2024-05-13', retiresOn: '2026-09-23', replaced: false },
        { name: 'gpt-5', replaced: true },
      ],
      reservedModelNames: ['gpt-4.1', 'gpt-4o-2024-05-13', 'gpt-5', 'gpt-4o'],
    };
    const TWO_TYPES = [
      { value: 'OpenAiResponses', label: 'OpenAI Responses' },
      { value: 'OpenAiChatCompletions', label: 'OpenAI Chat Completions' },
    ];
    const withReplaceable = (overrides: Partial<ByoModelDialogApi> = {}) =>
      fakeApi({
        loadContext: vi.fn(async () => ({ ok: true as const, value: REPLACEABLE })),
        ...overrides,
      });

    async function connectAndPickModel(
      user: ReturnType<typeof userEvent.setup>,
      provider: string,
      model: string
    ) {
      await pick(user, 'Provider', provider);
      await waitFor(() =>
        expect(screen.getByRole('combobox', { name: 'Your model' })).toBeEnabled()
      );
      await pick(user, 'Your model', model);
    }

    it('offers a custom alias first, then the UiPath models it can replace', async () => {
      const user = userEvent.setup();
      render(
        <ByoModelDialog open onOpenChange={vi.fn()} api={withReplaceable()} onSaved={vi.fn()} />
      );

      await user.click(await screen.findByRole('combobox', { name: 'Model alias' }));

      // A UiPath model already replaced is not offered again.
      expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
        'Add custom alias',
        'gpt-4.1',
        'gpt-4o-2024-05-13Deprecated',
      ]);
    });

    it('keeps a custom alias and its edit action above the UiPath models', async () => {
      const user = userEvent.setup();
      render(
        <ByoModelDialog open onOpenChange={vi.fn()} api={withReplaceable()} onSaved={vi.fn()} />
      );

      await addCustomAlias(user, 'mine');
      await user.click(screen.getByRole('combobox', { name: 'Model alias' }));

      expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
        'mine',
        'gpt-4.1',
        'gpt-4o-2024-05-13Deprecated',
      ]);
      expect(screen.getByRole('button', { name: 'Edit custom alias' })).toBeInTheDocument();
    });

    it('replaces a UiPath model, taking its name and the first API type', async () => {
      const user = userEvent.setup();
      const api = withReplaceable({ apiTypes: vi.fn(() => TWO_TYPES) });
      render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onSaved={vi.fn()} />);

      await pick(user, 'Model alias', 'gpt-4.1');
      await connectAndPickModel(user, 'OpenAI', 'gpt-5.1');

      expect(screen.queryByRole('combobox', { name: 'API type' })).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Test and add' }));
      await waitFor(() =>
        expect(api.testAndSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'gpt-4.1',
            replaces: 'gpt-4.1',
            apiType: 'OpenAiResponses',
          })
        )
      );
      expect(api.apiTypes).toHaveBeenCalledWith('openai', 'gpt-4.1');
    });

    it('takes the first API type for a custom alias too', async () => {
      const user = userEvent.setup();
      const api = fakeApi({ apiTypes: vi.fn(() => TWO_TYPES) });
      render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onSaved={vi.fn()} />);

      await addCustomAlias(user, 'mine');
      await connectAndPickModel(user, 'OpenAI', 'gpt-5.1');
      await user.click(screen.getByRole('button', { name: 'Test and add' }));

      await waitFor(() =>
        expect(api.testAndSave).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'mine', replaces: null, apiType: 'OpenAiResponses' })
        )
      );
    });

    it('takes the first API type of the new choice when the model alias changes', async () => {
      const user = userEvent.setup();
      const CHAT_ONLY = [{ value: 'OpenAiChatCompletions', label: 'OpenAI Chat Completions' }];
      const api = withReplaceable({
        apiTypes: vi.fn((_: string, replaces: string | null) =>
          replaces === 'gpt-4.1' ? CHAT_ONLY : [...TWO_TYPES]
        ),
      });
      render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onSaved={vi.fn()} />);

      await pick(user, 'Model alias', 'gpt-4.1');
      await pick(user, 'Provider', 'OpenAI');
      await pick(user, 'Model alias', 'gpt-4o-2024-05-13Deprecated');
      await connectAndPickModel(user, 'OpenAI', 'gpt-5.1');
      await user.click(screen.getByRole('button', { name: 'Test and add' }));

      await waitFor(() =>
        expect(api.testAndSave).toHaveBeenCalledWith(
          expect.objectContaining({ replaces: 'gpt-4o-2024-05-13', apiType: 'OpenAiResponses' })
        )
      );
    });

    it('offers only the providers that can serve the chosen model, and drops one that cannot', async () => {
      const user = userEvent.setup();
      const api = withReplaceable({
        apiTypes: vi.fn((providerId: string, replaces: string | null) =>
          providerId === 'azure' && replaces === 'gpt-4.1' ? [] : TWO_TYPES
        ),
      });
      render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onSaved={vi.fn()} />);

      await addCustomAlias(user, 'mine');
      await pick(user, 'Provider', 'Azure OpenAI');
      await pick(user, 'Model alias', 'gpt-4.1');

      const provider = screen.getByRole('combobox', { name: 'Provider' });
      expect(provider).toHaveTextContent('Select a provider');
      await user.click(provider);
      expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['OpenAI']);
    });

    it('says when a replaced UiPath model is being retired', async () => {
      const user = userEvent.setup();
      render(
        <ByoModelDialog open onOpenChange={vi.fn()} api={withReplaceable()} onSaved={vi.fn()} />
      );

      await pick(user, 'Model alias', 'gpt-4o-2024-05-13Deprecated');

      expect(screen.getByText('To be retired on 2026-09-23')).toBeInTheDocument();
    });

    it('refuses a custom alias that is a UiPath model name', async () => {
      const user = userEvent.setup();
      render(
        <ByoModelDialog open onOpenChange={vi.fn()} api={withReplaceable()} onSaved={vi.fn()} />
      );

      await addCustomAlias(user, 'gpt-4o');

      expect(
        screen.getByText('"gpt-4o" is the name of a UiPath model. Pick another name.')
      ).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Provider' })).toBeDisabled();
    });

    it('offers only replacements when the feature takes no custom aliases', async () => {
      const user = userEvent.setup();
      const api = fakeApi({
        loadContext: vi.fn(async () => ({
          ok: true as const,
          value: { ...REPLACEABLE, allowsNewNames: false },
        })),
      });
      render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onSaved={vi.fn()} />);

      await user.click(await screen.findByRole('combobox', { name: 'Model alias' }));

      expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
        'gpt-4.1',
        'gpt-4o-2024-05-13Deprecated',
      ]);
    });

    it('edits a replacement, keeping the UiPath model it replaces and its API type', async () => {
      const user = userEvent.setup();
      const editing: ByoModelToEdit = {
        ...SAVED_MODEL,
        name: 'gpt-5',
        replaces: 'gpt-5',
        apiType: 'OpenAiChatCompletions',
      };
      const api = withReplaceable({
        loadModel: vi.fn(async () => ({ ok: true as const, value: editing })),
        apiTypes: vi.fn(() => TWO_TYPES),
      });
      render(
        <ByoModelDialog
          open
          onOpenChange={vi.fn()}
          api={api}
          onSaved={vi.fn()}
          editing={{ configurationId: 'cfg1', name: 'gpt-5' }}
        />
      );

      // Its own UiPath model is offered although it is replaced, by this very model.
      await waitFor(() =>
        expect(screen.getByRole('combobox', { name: 'Model alias' })).toHaveTextContent('gpt-5')
      );
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Test and save' })).toBeEnabled()
      );
      await user.click(screen.getByRole('button', { name: 'Test and save' }));
      await waitFor(() =>
        expect(api.testAndSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'gpt-5',
            replaces: 'gpt-5',
            apiType: 'OpenAiChatCompletions',
            editing,
          })
        )
      );
    });

    it('restores an edited model’s API type when its alias is restored', async () => {
      const user = userEvent.setup();
      const editing: ByoModelToEdit = {
        ...SAVED_MODEL,
        name: 'gpt-5',
        replaces: 'gpt-5',
        apiType: 'OpenAiChatCompletions',
      };
      const api = withReplaceable({
        loadModel: vi.fn(async () => ({ ok: true as const, value: editing })),
        apiTypes: vi.fn((_: string, replaces: string | null) =>
          replaces === 'gpt-4.1' ? [TWO_TYPES[0]] : TWO_TYPES
        ),
      });
      render(
        <ByoModelDialog
          open
          onOpenChange={vi.fn()}
          api={api}
          onSaved={vi.fn()}
          editing={{ configurationId: 'cfg1', name: 'gpt-5' }}
        />
      );

      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Test and save' })).toBeEnabled()
      );
      // gpt-4.1 offers only Responses, so the type moves; going back must bring the saved one back.
      await pick(user, 'Model alias', 'gpt-4.1');
      await pick(user, 'Model alias', 'gpt-5');
      await user.click(screen.getByRole('button', { name: 'Test and save' }));
      await waitFor(() =>
        expect(api.testAndSave).toHaveBeenCalledWith(
          expect.objectContaining({ replaces: 'gpt-5', apiType: 'OpenAiChatCompletions' })
        )
      );
    });

    it('keeps an edited model’s API type after a change of provider that also offers it', async () => {
      const user = userEvent.setup();
      const editing: ByoModelToEdit = {
        ...SAVED_MODEL,
        name: 'gpt-5',
        replaces: 'gpt-5',
        apiType: 'OpenAiChatCompletions',
      };
      const azure: ByoConnection = {
        id: 'c2',
        providerId: 'azure',
        name: 'My Azure',
        folderId: 'me',
      };
      const api = withReplaceable({
        loadContext: vi.fn(async () => ({
          ok: true as const,
          value: { ...REPLACEABLE, connections: [SAVED, azure] },
        })),
        loadModel: vi.fn(async () => ({ ok: true as const, value: editing })),
        apiTypes: vi.fn(() => TWO_TYPES),
      });
      render(
        <ByoModelDialog
          open
          onOpenChange={vi.fn()}
          api={api}
          onSaved={vi.fn()}
          editing={{ configurationId: 'cfg1', name: 'gpt-5' }}
        />
      );

      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Test and save' })).toBeEnabled()
      );
      await pick(user, 'Provider', 'Azure OpenAI');
      await waitFor(() =>
        expect(screen.getByRole('combobox', { name: 'Your model' })).toBeEnabled()
      );
      await pick(user, 'Your model', 'gpt-4o');
      await user.click(screen.getByRole('button', { name: 'Test and save' }));
      await waitFor(() =>
        expect(api.testAndSave).toHaveBeenCalledWith(
          expect.objectContaining({ apiType: 'OpenAiChatCompletions' })
        )
      );
    });
  });
});
