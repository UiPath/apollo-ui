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
};

const SAVED_MODEL: ByoModelToEdit = {
  configurationId: 'cfg1',
  providerId: 'openai',
  connectionId: 'c1',
  modelId: 'gpt-4o',
  name: 'Taken',
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

describe('ByoModelDialog', () => {
  it('adds a model through a saved connection', async () => {
    const user = userEvent.setup();
    const api = fakeApi();
    const onSaved = vi.fn();
    const onOpenChange = vi.fn();
    render(<ByoModelDialog open onOpenChange={onOpenChange} api={api} onSaved={onSaved} />);

    await pick(user, 'Provider', 'OpenAI');
    expect(screen.getByRole('combobox', { name: 'Connection' })).toHaveTextContent(
      'Saved connection: My OpenAI · My Workspace'
    );
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Model' })).toBeEnabled());
    await pick(user, 'Model', 'gpt-4o');
    expect(screen.getByRole('textbox', { name: 'Name in your model list' })).toHaveValue('gpt-4o');
    await user.click(screen.getByRole('button', { name: 'Test and add' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.testAndSave).toHaveBeenCalledWith({
      providerId: 'openai',
      connection: SAVED,
      modelId: 'gpt-4o',
      name: 'gpt-4o',
    });
    expect(onSaved.mock.calls[0]?.[0]).toMatchObject({ name: 'gpt-4o', connectionId: 'c1' });
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

    await pick(user, 'Provider', 'Azure OpenAI');
    const connect = await screen.findByRole('button', { name: 'Connect' });
    expect(connect).toBeDisabled();
    expect(screen.getByLabelText(/Endpoint/)).toBeRequired();
    await user.type(screen.getByLabelText(/Endpoint/), 'https://res.openai.azure.com');
    await user.type(screen.getByLabelText(/API key/), 'secret');
    expect(screen.getByLabelText(/API key/)).toHaveAttribute('type', 'password');
    expect(screen.getByRole('textbox', { name: 'Connection name' })).toHaveValue(
      'Azure OpenAI – personal'
    );
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
        name: 'Azure OpenAI – personal',
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

    await pick(user, 'Provider', 'Azure OpenAI');
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

    await pick(user, 'Provider', 'OpenAI');
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Model' })).toBeEnabled());
    await pick(user, 'Model', 'gpt-5.1');
    const name = screen.getByRole('textbox', { name: 'Name in your model list' });
    await user.clear(name);
    await user.type(name, 'taken');

    expect(
      screen.getByText('"taken" is already in your model list. Pick another name.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Test and add' })).toBeDisabled();
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

    await pick(user, 'Provider', 'OpenAI');
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Model' })).toBeEnabled());
    await pick(user, 'Model', 'gpt-4o');
    await user.click(screen.getByRole('button', { name: 'Test and add' }));

    expect(await screen.findByText('The test call failed: MISSING_TOOL_CALL')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
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
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Model' })).toBeEnabled());
    expect(api.loadModel).toHaveBeenCalledWith({ configurationId: 'cfg1', name: 'Taken' });
    expect(screen.getByRole('combobox', { name: 'Connection' })).toHaveTextContent(
      'Saved connection: My OpenAI · My Workspace'
    );
    expect(screen.getByRole('textbox', { name: 'Name in your model list' })).toHaveValue('Taken');

    await pick(user, 'Model', 'gpt-5.1');
    // A name the user kept is not replaced by the new model id.
    expect(screen.getByRole('textbox', { name: 'Name in your model list' })).toHaveValue('Taken');
    await user.click(screen.getByRole('button', { name: 'Test and save' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.testAndSave).toHaveBeenCalledWith({
      providerId: 'openai',
      connection: SAVED,
      modelId: 'gpt-5.1',
      name: 'Taken',
      editing: SAVED_MODEL,
    });
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

    await pick(user, 'Provider', 'OpenAI');
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
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Model' })).toBeEnabled());
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

    await pick(user, 'Provider', 'OpenAI');
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

    await pick(user, 'Provider', 'OpenAI');
    await user.click(await screen.findByRole('button', { name: 'Edit connection' }));
    await screen.findByText('Could not read the connection settings');
    finishFirstList();

    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Model' })).toBeEnabled());
    expect(api.listModels).toHaveBeenCalledTimes(2);
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

    await pick(user, 'Provider', 'OpenAI');
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

    await pick(user, 'Provider', 'OpenAI');
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Model' })).toBeEnabled());
    await pick(user, 'Model', 'gpt-4o');
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

    await pick(user, 'Provider', 'OpenAI');
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Model' })).toBeEnabled());
    await pick(user, 'Model', 'gpt-4o');
    await user.click(screen.getByRole('button', { name: 'Test and add' }));
    rerender(<ByoModelDialog open={false} onOpenChange={vi.fn()} api={api} onSaved={onSaved} />);
    finishTest();

    await waitFor(() =>
      expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ name: 'gpt-4o' }))
    );
  });
});
