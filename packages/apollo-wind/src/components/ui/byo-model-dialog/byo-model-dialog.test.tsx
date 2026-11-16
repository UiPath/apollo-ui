import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ByoModelDialog } from './byo-model-dialog';
import type {
  ByoConnection,
  ByoConnectionForm,
  ByoDialogContext,
  ByoModelDialogApi,
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
    loadForm: vi.fn(async () => ({ ok: true as const, value: AZURE_FORM })),
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
    testAndAdd: vi.fn(async (r) => ({
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
    const onAdded = vi.fn();
    const onOpenChange = vi.fn();
    render(<ByoModelDialog open onOpenChange={onOpenChange} api={api} onAdded={onAdded} />);

    await pick(user, 'Provider', 'OpenAI');
    expect(screen.getByRole('combobox', { name: 'Connection' })).toHaveTextContent(
      'Saved connection: My OpenAI · My Workspace'
    );
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Model' })).toBeEnabled());
    await pick(user, 'Model', 'gpt-4o');
    expect(screen.getByRole('textbox', { name: 'Name in your model list' })).toHaveValue('gpt-4o');
    await user.click(screen.getByRole('button', { name: 'Test and add' }));

    await waitFor(() => expect(onAdded).toHaveBeenCalled());
    expect(api.testAndAdd).toHaveBeenCalledWith({
      providerId: 'openai',
      connection: SAVED,
      modelId: 'gpt-4o',
      name: 'gpt-4o',
    });
    expect(onAdded.mock.calls[0]?.[0]).toMatchObject({ name: 'gpt-4o', connectionId: 'c1' });
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
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onAdded={vi.fn()} />);

    await pick(user, 'Provider', 'Azure OpenAI');
    const connect = await screen.findByRole('button', { name: 'Connect' });
    expect(connect).toBeDisabled();
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
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onAdded={vi.fn()} />);

    await pick(user, 'Provider', 'Azure OpenAI');
    await user.type(await screen.findByLabelText(/Endpoint/), 'https://res.openai.azure.com');
    await user.type(screen.getByLabelText(/API key/), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    expect(
      await screen.findByText('Azure OpenAI refused the connection (HTTP 401)')
    ).toBeInTheDocument();
    expect(screen.getByText('Access denied')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show full response' }));
    expect(screen.getByText('{"code":401}')).toBeInTheDocument();
    expect(screen.getByLabelText(/API key/)).toBeEnabled();
  });

  it('refuses a name already in the model list', async () => {
    const user = userEvent.setup();
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={fakeApi()} onAdded={vi.fn()} />);

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
    const onAdded = vi.fn();
    const api = fakeApi({
      testAndAdd: vi.fn(async () => ({
        ok: false as const,
        failure: { title: 'The test call failed: MISSING_TOOL_CALL' },
      })),
    });
    render(<ByoModelDialog open onOpenChange={vi.fn()} api={api} onAdded={onAdded} />);

    await pick(user, 'Provider', 'OpenAI');
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Model' })).toBeEnabled());
    await pick(user, 'Model', 'gpt-4o');
    await user.click(screen.getByRole('button', { name: 'Test and add' }));

    expect(await screen.findByText('The test call failed: MISSING_TOOL_CALL')).toBeInTheDocument();
    expect(onAdded).not.toHaveBeenCalled();
  });
});
